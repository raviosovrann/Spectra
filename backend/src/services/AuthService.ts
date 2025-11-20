import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import pool from '../database/config.js'
import { UserDTO, JWTPayload } from '../types/auth.js'

const SALT_ROUNDS = 10
const JWT_EXPIRATION = '24h'

class AuthService {
  async register(fullName: string, username: string, emailAddress: string, password: string): Promise<UserDTO> {
    // Check if user already exists
    const existingUser = await pool.query('SELECT user_id FROM spectra_user_t WHERE email_address = $1 OR username = $2', [
      emailAddress,
      username,
    ])

    if (existingUser.rows.length > 0) {
      throw new Error('User with this email or username already exists')
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)

    // Insert user
    const result = await pool.query(
      `INSERT INTO spectra_user_t (full_name, username, email_address, password, is_active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING user_id, full_name, username, email_address, created_at, is_active`,
      [fullName, username, emailAddress, hashedPassword, true]
    )

    const user = result.rows[0]

    return {
      userId: user.user_id,
      fullName: user.full_name,
      username: user.username,
      emailAddress: user.email_address,
      hasCoinbaseKeys: false,
      createdAt: user.created_at,
    }
  }

  async login(identifier: string, password: string): Promise<{ user: UserDTO; token: string }> {
    // Smart login: Find user by email OR username
    const result = await pool.query(
      'SELECT * FROM spectra_user_t WHERE email_address = $1 OR username = $1',
      [identifier]
    )

    if (result.rows.length === 0) {
      throw new Error('Invalid credentials')
    }

    const user = result.rows[0]

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password)

    if (!passwordMatch) {
      throw new Error('Invalid credentials')
    }

    // Update last login
    await pool.query('UPDATE spectra_user_t SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1', [user.user_id])

    // Generate JWT token
    const token = this.generateToken(user.user_id, user.email_address, user.username)

    const userDTO: UserDTO = {
      userId: user.user_id,
      fullName: user.full_name,
      username: user.username,
      emailAddress: user.email_address,
      hasCoinbaseKeys: !!user.user_coinbase_public && !!user.user_coinbase_secret,
      createdAt: user.created_at,
      lastLogin: new Date(),
    }

    return { user: userDTO, token }
  }

  async verifyToken(token: string): Promise<JWTPayload> {
    const secret = process.env.JWT_SECRET

    if (!secret) {
      throw new Error('JWT_SECRET not configured')
    }

    try {
      const decoded = jwt.verify(token, secret) as JWTPayload
      return decoded
    } catch (error) {
      throw new Error('Invalid or expired token')
    }
  }

  async getUserById(userId: string): Promise<UserDTO> {
    const result = await pool.query('SELECT * FROM spectra_user_t WHERE user_id = $1', [userId])

    if (result.rows.length === 0) {
      throw new Error('User not found')
    }

    const user = result.rows[0]

    return {
      userId: user.user_id,
      fullName: user.full_name,
      username: user.username,
      emailAddress: user.email_address,
      hasCoinbaseKeys: !!user.user_coinbase_public && !!user.user_coinbase_secret,
      createdAt: user.created_at,
      lastLogin: user.last_login,
    }
  }

  private generateToken(userId: string, emailAddress: string, username: string): string {
    const secret = process.env.JWT_SECRET

    if (!secret) {
      throw new Error('JWT_SECRET not configured')
    }

    return jwt.sign(
      {
        userId,
        emailAddress,
        username,
      },
      secret,
      { expiresIn: JWT_EXPIRATION }
    )
  }
}

export default new AuthService()
