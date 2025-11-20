import { describe, it, expect, beforeEach, vi } from 'vitest'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import AuthService from '../../src/services/AuthService.js'

// Mock the database pool
vi.mock('../../src/database/config.js', () => ({
  default: {
    query: vi.fn(),
  },
}))

import pool from '../../src/database/config.js'

// Helper to create mock query results
const mockQueryResult = <T>(rows: T[]) => Promise.resolve({ rows, rowCount: rows.length, command: '', oid: 0, fields: [] })

describe('AuthService - Password Hashing', () => {
  it('should hash password with bcrypt', async () => {
    const password = 'testPassword123!'
    const hashedPassword = await bcrypt.hash(password, 10)
    
    expect(hashedPassword).toBeDefined()
    expect(hashedPassword).not.toBe(password)
    expect(hashedPassword.length).toBeGreaterThan(0)
  })

  it('should verify correct password against hash', async () => {
    const password = 'testPassword123!'
    const hashedPassword = await bcrypt.hash(password, 10)
    
    const isMatch = await bcrypt.compare(password, hashedPassword)
    expect(isMatch).toBe(true)
  })

  it('should reject incorrect password against hash', async () => {
    const password = 'testPassword123!'
    const wrongPassword = 'wrongPassword456!'
    const hashedPassword = await bcrypt.hash(password, 10)
    
    const isMatch = await bcrypt.compare(wrongPassword, hashedPassword)
    expect(isMatch).toBe(false)
  })

  it('should generate different hashes for same password', async () => {
    const password = 'testPassword123!'
    const hash1 = await bcrypt.hash(password, 10)
    const hash2 = await bcrypt.hash(password, 10)
    
    expect(hash1).not.toBe(hash2)
    expect(await bcrypt.compare(password, hash1)).toBe(true)
    expect(await bcrypt.compare(password, hash2)).toBe(true)
  })
})

describe('AuthService - JWT Token Generation', () => {
  const mockUserId = '123e4567-e89b-12d3-a456-426614174000'
  const mockEmail = 'test@example.com'
  const mockUsername = 'testuser'

  it('should generate valid JWT token', () => {
    const token = jwt.sign(
      { userId: mockUserId, emailAddress: mockEmail, username: mockUsername },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    )
    
    expect(token).toBeDefined()
    expect(typeof token).toBe('string')
    expect(token.split('.').length).toBe(3) // JWT has 3 parts
  })

  it('should decode JWT token correctly', () => {
    const token = jwt.sign(
      { userId: mockUserId, emailAddress: mockEmail, username: mockUsername },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    )
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload & {
      userId: string
      emailAddress: string
      username: string
    }
    
    expect(decoded.userId).toBe(mockUserId)
    expect(decoded.emailAddress).toBe(mockEmail)
    expect(decoded.username).toBe(mockUsername)
    expect(decoded.exp).toBeDefined()
    expect(decoded.iat).toBeDefined()
  })

  it('should reject invalid JWT token', () => {
    const invalidToken = 'invalid.token.here'
    
    expect(() => {
      jwt.verify(invalidToken, process.env.JWT_SECRET!)
    }).toThrow()
  })

  it('should reject JWT token with wrong secret', () => {
    const token = jwt.sign(
      { userId: mockUserId, emailAddress: mockEmail, username: mockUsername },
      'wrong-secret',
      { expiresIn: '24h' }
    )
    
    expect(() => {
      jwt.verify(token, process.env.JWT_SECRET!)
    }).toThrow()
  })

  it('should include expiration time in token', () => {
    const token = jwt.sign(
      { userId: mockUserId, emailAddress: mockEmail, username: mockUsername },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    )
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload & {
      userId: string
      emailAddress: string
      username: string
    }
    const now = Math.floor(Date.now() / 1000)
    const expectedExpiry = now + (24 * 60 * 60) // 24 hours
    
    expect(decoded.exp).toBeGreaterThan(now)
    expect(decoded.exp).toBeLessThanOrEqual(expectedExpiry + 5) // Allow 5 second tolerance
  })
})

describe('AuthService - Registration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should register new user successfully', async () => {
    const mockUser = {
      user_id: '123e4567-e89b-12d3-a456-426614174000',
      full_name: 'Test User',
      username: 'testuser',
      email_address: 'test@example.com',
      created_at: new Date(),
      is_active: true,
    }

    // Mock database queries
    vi.mocked(pool.query)
      .mockImplementationOnce(() => mockQueryResult([])) // No existing user
      .mockImplementationOnce(() => mockQueryResult([mockUser])) // Insert successful

    const result = await AuthService.register(
      'Test User',
      'testuser',
      'test@example.com',
      'password123'
    )

    expect(result.userId).toBe(mockUser.user_id)
    expect(result.fullName).toBe(mockUser.full_name)
    expect(result.username).toBe(mockUser.username)
    expect(result.emailAddress).toBe(mockUser.email_address)
    expect(result.hasCoinbaseKeys).toBe(false)
  })

  it('should throw error if user already exists', async () => {
    // Mock existing user
    vi.mocked(pool.query).mockImplementationOnce(() => mockQueryResult([{ user_id: 'existing-id' }]))

    await expect(
      AuthService.register('Test User', 'testuser', 'test@example.com', 'password123')
    ).rejects.toThrow('User with this email or username already exists')
  })
})

describe('AuthService - Login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should login user with correct credentials', async () => {
    const password = 'password123'
    const hashedPassword = await bcrypt.hash(password, 10)
    
    const mockUser = {
      user_id: '123e4567-e89b-12d3-a456-426614174000',
      full_name: 'Test User',
      username: 'testuser',
      email_address: 'test@example.com',
      password: hashedPassword,
      user_coinbase_public: null,
      user_coinbase_secret: null,
      created_at: new Date(),
      is_active: true,
    }

    // Mock database queries
    vi.mocked(pool.query)
      .mockImplementationOnce(() => mockQueryResult([mockUser])) // Find user
      .mockImplementationOnce(() => mockQueryResult([])) // Update last login

    const result = await AuthService.login('test@example.com', password)

    expect(result.user.userId).toBe(mockUser.user_id)
    expect(result.user.emailAddress).toBe(mockUser.email_address)
    expect(result.token).toBeDefined()
    expect(typeof result.token).toBe('string')
  })

  it('should throw error with invalid email', async () => {
    // Mock no user found
    vi.mocked(pool.query).mockImplementationOnce(() => mockQueryResult([]))

    await expect(
      AuthService.login('nonexistent@example.com', 'password123')
    ).rejects.toThrow('Invalid credentials')
  })

  it('should throw error with incorrect password', async () => {
    const password = 'password123'
    const hashedPassword = await bcrypt.hash(password, 10)
    
    const mockUser = {
      user_id: '123e4567-e89b-12d3-a456-426614174000',
      email_address: 'test@example.com',
      password: hashedPassword,
    }

    vi.mocked(pool.query).mockImplementationOnce(() => mockQueryResult([mockUser]))

    await expect(
      AuthService.login('test@example.com', 'wrongpassword')
    ).rejects.toThrow('Invalid credentials')
  })

  it('should login with username instead of email', async () => {
    const password = 'password123'
    const hashedPassword = await bcrypt.hash(password, 10)
    
    const mockUser = {
      user_id: '123e4567-e89b-12d3-a456-426614174000',
      full_name: 'Test User',
      username: 'testuser',
      email_address: 'test@example.com',
      password: hashedPassword,
      user_coinbase_public: null,
      user_coinbase_secret: null,
      created_at: new Date(),
      is_active: true,
    }

    vi.mocked(pool.query)
      .mockImplementationOnce(() => mockQueryResult([mockUser]))
      .mockImplementationOnce(() => mockQueryResult([]))

    const result = await AuthService.login('testuser', password)

    expect(result.user.username).toBe('testuser')
    expect(result.token).toBeDefined()
  })
})

describe('AuthService - Token Verification', () => {
  const mockUserId = '123e4567-e89b-12d3-a456-426614174000'
  const mockEmail = 'test@example.com'
  const mockUsername = 'testuser'

  it('should verify valid token', async () => {
    const token = jwt.sign(
      { userId: mockUserId, emailAddress: mockEmail, username: mockUsername },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    )

    const payload = await AuthService.verifyToken(token)

    expect(payload.userId).toBe(mockUserId)
    expect(payload.emailAddress).toBe(mockEmail)
  })

  it('should reject invalid token', async () => {
    await expect(
      AuthService.verifyToken('invalid.token.here')
    ).rejects.toThrow('Invalid or expired token')
  })

  it('should reject expired token', async () => {
    const token = jwt.sign(
      { userId: mockUserId, emailAddress: mockEmail, username: mockUsername },
      process.env.JWT_SECRET!,
      { expiresIn: '0s' } // Expired immediately
    )

    // Wait a moment to ensure expiration
    await new Promise(resolve => setTimeout(resolve, 100))

    await expect(
      AuthService.verifyToken(token)
    ).rejects.toThrow('Invalid or expired token')
  })
})
