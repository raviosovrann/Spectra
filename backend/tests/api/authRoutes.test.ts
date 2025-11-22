import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import request from 'supertest'
import express, { Express } from 'express'
import cookieParser from 'cookie-parser'
import authRoutes from '../../src/routes/auth.js'
import jwt from 'jsonwebtoken'

// Mock the database pool
vi.mock('../../src/database/config.js', () => ({
  default: {
    query: vi.fn(),
  },
}))

// Mock the logger
vi.mock('../../src/utils/logger.js', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}))

import pool from '../../src/database/config.js'
import bcrypt from 'bcrypt'

// Helper to create mock query results
const mockQueryResult = <T>(rows: T[]) => Promise.resolve({ rows, rowCount: rows.length, command: '', oid: 0, fields: [] })

describe('Auth API Integration Tests', () => {
  let app: Express

  beforeAll(() => {
    // Set up Express app for testing
    app = express()
    app.use(express.json())
    app.use(cookieParser())
    app.use('/api/auth', authRoutes)
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
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

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Test User',
          username: 'testuser',
          emailAddress: 'test@example.com',
          password: 'Password123',
        })

      expect(response.status).toBe(201)
      expect(response.body.message).toBe('User registered successfully')
      expect(response.body.user).toBeDefined()
      expect(response.body.user.username).toBe('testuser')
      expect(response.body.user.emailAddress).toBe('test@example.com')
    })

    it('should reject registration with missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          emailAddress: 'test@example.com',
          // Missing fullName and password
        })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Missing required fields')
    })

    it('should reject registration with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Test User',
          username: 'testuser',
          emailAddress: 'invalid-email',
          password: 'Password123',
        })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Invalid email format')
    })

    it('should reject registration with weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Test User',
          username: 'testuser',
          emailAddress: 'test@example.com',
          password: 'weak',
        })

      expect(response.status).toBe(400)
      expect(response.body.error).toContain('Password must be at least 8 characters')
    })

    it('should reject registration with invalid username', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Test User',
          username: 'ab', // Too short
          emailAddress: 'test@example.com',
          password: 'Password123',
        })

      expect(response.status).toBe(400)
      expect(response.body.error).toContain('Username must be 3-50 characters')
    })

    it('should reject registration with existing email', async () => {
      // Mock existing user
      vi.mocked(pool.query).mockImplementationOnce(() => mockQueryResult([{ user_id: 'existing-id' }]))

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Test User',
          username: 'testuser',
          emailAddress: 'existing@example.com',
          password: 'Password123',
        })

      expect(response.status).toBe(409)
      expect(response.body.error).toContain('already exists')
    })
  })

  describe('POST /api/auth/login', () => {
    it('should login user with correct credentials', async () => {
      const password = 'Password123'
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

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: 'test@example.com',
          password: password,
        })

      expect(response.status).toBe(200)
      expect(response.body.message).toBe('Login successful')
      expect(response.body.user).toBeDefined()
      expect(response.body.user.emailAddress).toBe('test@example.com')
      
      // Check that cookie was set
      const cookies = response.headers['set-cookie']
      expect(cookies).toBeDefined()
      expect(cookies[0]).toContain('auth_token')
      expect(cookies[0]).toContain('HttpOnly')
    })

    it('should login user with username instead of email', async () => {
      const password = 'Password123'
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

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: 'testuser',
          password: password,
        })

      expect(response.status).toBe(200)
      expect(response.body.user.username).toBe('testuser')
    })

    it('should reject login with missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: 'test@example.com',
          // Missing password
        })

      expect(response.status).toBe(400)
      expect(response.body.error).toContain('required')
    })

    it('should reject login with incorrect password', async () => {
      const password = 'Password123'
      const hashedPassword = await bcrypt.hash(password, 10)

      const mockUser = {
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        email_address: 'test@example.com',
        password: hashedPassword,
      }

      vi.mocked(pool.query).mockImplementationOnce(() => mockQueryResult([mockUser]))

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: 'test@example.com',
          password: 'WrongPassword123',
        })

      expect(response.status).toBe(401)
      expect(response.body.error).toBe('Invalid credentials')
    })

    it('should reject login with non-existent user', async () => {
      vi.mocked(pool.query).mockImplementationOnce(() => mockQueryResult([]))

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: 'nonexistent@example.com',
          password: 'Password123',
        })

      expect(response.status).toBe(401)
      expect(response.body.error).toBe('Invalid credentials')
    })

    it('should set secure cookie in production', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const password = 'Password123'
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

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: 'test@example.com',
          password: password,
        })

      const cookies = response.headers['set-cookie']
      expect(cookies[0]).toContain('Secure')

      process.env.NODE_ENV = originalEnv
    })
  })

  describe('POST /api/auth/logout', () => {
    it('should logout user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')

      expect(response.status).toBe(200)
      expect(response.body.message).toBe('Logout successful')
      
      // Check that cookie was cleared
      const cookies = response.headers['set-cookie']
      expect(cookies).toBeDefined()
      expect(cookies[0]).toContain('auth_token=;')
    })
  })

  describe('GET /api/auth/me', () => {
    it('should return user info with valid token', async () => {
      const mockUserId = '123e4567-e89b-12d3-a456-426614174000'
      const mockUser = {
        user_id: mockUserId,
        full_name: 'Test User',
        username: 'testuser',
        email_address: 'test@example.com',
        user_coinbase_public: null,
        user_coinbase_secret: null,
        created_at: new Date(),
        last_login: new Date(),
      }

      vi.mocked(pool.query).mockImplementationOnce(() => mockQueryResult([mockUser]))

      const token = jwt.sign(
        { userId: mockUserId, emailAddress: 'test@example.com', username: 'testuser' },
        process.env.JWT_SECRET!,
        { expiresIn: '24h' }
      )

      const response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', [`auth_token=${token}`])

      expect(response.status).toBe(200)
      expect(response.body.user).toBeDefined()
      expect(response.body.user.userId).toBe(mockUserId)
      expect(response.body.user.emailAddress).toBe('test@example.com')
    })

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')

      expect(response.status).toBe(401)
      expect(response.body.error).toBe('Authentication required')
    })

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', ['auth_token=invalid.token.here'])

      expect(response.status).toBe(401)
      expect(response.body.error).toBe('Unauthorized')
    })

    it('should accept token from Authorization header', async () => {
      const mockUserId = '123e4567-e89b-12d3-a456-426614174000'
      const mockUser = {
        user_id: mockUserId,
        full_name: 'Test User',
        username: 'testuser',
        email_address: 'test@example.com',
        user_coinbase_public: null,
        user_coinbase_secret: null,
        created_at: new Date(),
        last_login: new Date(),
      }

      vi.mocked(pool.query).mockImplementationOnce(() => mockQueryResult([mockUser]))

      const token = jwt.sign(
        { userId: mockUserId, emailAddress: 'test@example.com', username: 'testuser' },
        process.env.JWT_SECRET!,
        { expiresIn: '24h' }
      )

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)

      expect(response.status).toBe(200)
      expect(response.body.user.userId).toBe(mockUserId)
    })
  })

  describe('Complete Authentication Flow', () => {
    it('should complete full registration and login flow', async () => {
      const password = 'Password123'
      const hashedPassword = await bcrypt.hash(password, 10)

      // Step 1: Register
      const mockNewUser = {
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        full_name: 'New User',
        username: 'newuser',
        email_address: 'new@example.com',
        created_at: new Date(),
        is_active: true,
      }

      vi.mocked(pool.query)
        .mockImplementationOnce(() => mockQueryResult([])) // No existing user
        .mockImplementationOnce(() => mockQueryResult([mockNewUser])) // Insert successful

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'New User',
          username: 'newuser',
          emailAddress: 'new@example.com',
          password: password,
        })

      expect(registerResponse.status).toBe(201)

      // Step 2: Login with registered credentials
      const mockLoginUser = {
        ...mockNewUser,
        password: hashedPassword,
        user_coinbase_public: null,
        user_coinbase_secret: null,
      }

      vi.mocked(pool.query)
        .mockImplementationOnce(() => mockQueryResult([mockLoginUser])) // Find user
        .mockImplementationOnce(() => mockQueryResult([])) // Update last login

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: 'new@example.com',
          password: password,
        })

      expect(loginResponse.status).toBe(200)
      expect(loginResponse.body.user.emailAddress).toBe('new@example.com')

      // Step 3: Access protected route with token
      const cookies = loginResponse.headers['set-cookie'] as unknown as string[]
      const authCookie = cookies.find((cookie: string) => cookie.startsWith('auth_token='))
      expect(authCookie).toBeDefined()

      vi.mocked(pool.query).mockImplementationOnce(() => mockQueryResult([mockLoginUser]))

      const meResponse = await request(app)
        .get('/api/auth/me')
        .set('Cookie', cookies)

      expect(meResponse.status).toBe(200)
      expect(meResponse.body.user.emailAddress).toBe('new@example.com')

      // Step 4: Logout
      const logoutResponse = await request(app)
        .post('/api/auth/logout')

      expect(logoutResponse.status).toBe(200)
    })
  })

  describe('Session Persistence', () => {
    it('should maintain session after simulated page refresh', async () => {
      const password = 'Password123'
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
        last_login: new Date(),
        is_active: true,
      }

      // Step 1: Login
      vi.mocked(pool.query)
        .mockImplementationOnce(() => mockQueryResult([mockUser]))
        .mockImplementationOnce(() => mockQueryResult([]))

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: 'test@example.com',
          password: password,
        })

      expect(loginResponse.status).toBe(200)
      const cookies = loginResponse.headers['set-cookie'] as unknown as string[]
      expect(cookies).toBeDefined()

      // Step 2: Simulate page refresh - verify session with cookie
      vi.mocked(pool.query).mockImplementationOnce(() => mockQueryResult([mockUser]))

      const sessionCheckResponse = await request(app)
        .get('/api/auth/me')
        .set('Cookie', cookies)

      expect(sessionCheckResponse.status).toBe(200)
      expect(sessionCheckResponse.body.user.userId).toBe(mockUser.user_id)
      expect(sessionCheckResponse.body.user.emailAddress).toBe(mockUser.email_address)
    })

    it('should persist session across multiple requests', async () => {
      const password = 'Password123'
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
        last_login: new Date(),
        is_active: true,
      }

      // Login
      vi.mocked(pool.query)
        .mockImplementationOnce(() => mockQueryResult([mockUser]))
        .mockImplementationOnce(() => mockQueryResult([]))

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: 'test@example.com',
          password: password,
        })

      const cookies = loginResponse.headers['set-cookie'] as unknown as string[]

      // Make multiple authenticated requests with same cookie
      for (let i = 0; i < 3; i++) {
        vi.mocked(pool.query).mockImplementationOnce(() => mockQueryResult([mockUser]))

        const response = await request(app)
          .get('/api/auth/me')
          .set('Cookie', cookies)

        expect(response.status).toBe(200)
        expect(response.body.user.userId).toBe(mockUser.user_id)
      }
    })

    it('should reject requests after logout', async () => {
      const password = 'Password123'
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
        last_login: new Date(),
        is_active: true,
      }

      // Login
      vi.mocked(pool.query)
        .mockImplementationOnce(() => mockQueryResult([mockUser]))
        .mockImplementationOnce(() => mockQueryResult([]))

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: 'test@example.com',
          password: password,
        })

      const cookies = loginResponse.headers['set-cookie'] as unknown as string[]

      // Verify session works
      vi.mocked(pool.query).mockImplementationOnce(() => mockQueryResult([mockUser]))

      const beforeLogout = await request(app)
        .get('/api/auth/me')
        .set('Cookie', cookies)

      expect(beforeLogout.status).toBe(200)

      // Logout
      const logoutResponse = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', cookies)

      expect(logoutResponse.status).toBe(200)

      // Get cleared cookies from logout response
      const clearedCookies = logoutResponse.headers['set-cookie'] as unknown as string[]
      expect(clearedCookies[0]).toContain('auth_token=;')

      // Try to access protected route after logout
      const afterLogout = await request(app)
        .get('/api/auth/me')
        .set('Cookie', clearedCookies)

      expect(afterLogout.status).toBe(401)
    })

    it('should set cookie with correct attributes in development', async () => {
      const password = 'Password123'
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

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: 'test@example.com',
          password: password,
        })

      const cookies = response.headers['set-cookie'] as unknown as string[]
      const authCookie = cookies[0]

      // Verify cookie attributes
      expect(authCookie).toContain('auth_token=')
      expect(authCookie).toContain('HttpOnly')
      expect(authCookie).toContain('Path=/')
      expect(authCookie).toContain('SameSite=Lax') // Lax in development
      expect(authCookie).not.toContain('Secure') // Not secure in development
    })

    it('should handle expired or invalid cookies gracefully', async () => {
      // Try to access protected route with invalid cookie
      const response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', ['auth_token=invalid_token_here'])

      expect(response.status).toBe(401)
      expect(response.body.error).toBe('Unauthorized')
    })
  })
})
