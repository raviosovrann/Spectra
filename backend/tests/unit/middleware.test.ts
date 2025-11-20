import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { authMiddleware, AuthRequest } from '../../src/middleware/auth.js'

describe('Authentication Middleware', () => {
  let mockRequest: Partial<AuthRequest>
  let mockResponse: Partial<Response>
  let nextFunction: NextFunction

  beforeEach(() => {
    mockRequest = {
      headers: {},
      cookies: {},
    }
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    }
    nextFunction = vi.fn()
  })

  it('should authenticate valid token from cookie', async () => {
    const mockUserId = '123e4567-e89b-12d3-a456-426614174000'
    const mockEmail = 'test@example.com'
    const mockUsername = 'testuser'
    
    const token = jwt.sign(
      { userId: mockUserId, emailAddress: mockEmail, username: mockUsername },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    )

    mockRequest.cookies = { auth_token: token }

    await authMiddleware(
      mockRequest as AuthRequest,
      mockResponse as Response,
      nextFunction
    )

    expect(mockRequest.userId).toBe(mockUserId)
    expect(mockRequest.emailAddress).toBe(mockEmail)
    expect(nextFunction).toHaveBeenCalled()
    expect(mockResponse.status).not.toHaveBeenCalled()
  })

  it('should authenticate valid token from Authorization header', async () => {
    const mockUserId = '123e4567-e89b-12d3-a456-426614174000'
    const mockEmail = 'test@example.com'
    const mockUsername = 'testuser'
    
    const token = jwt.sign(
      { userId: mockUserId, emailAddress: mockEmail, username: mockUsername },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    )

    mockRequest.headers = { authorization: `Bearer ${token}` }

    await authMiddleware(
      mockRequest as AuthRequest,
      mockResponse as Response,
      nextFunction
    )

    expect(mockRequest.userId).toBe(mockUserId)
    expect(mockRequest.emailAddress).toBe(mockEmail)
    expect(nextFunction).toHaveBeenCalled()
    expect(mockResponse.status).not.toHaveBeenCalled()
  })

  it('should prioritize cookie over Authorization header', async () => {
    const mockUserId = '123e4567-e89b-12d3-a456-426614174000'
    const mockEmail = 'test@example.com'
    const mockUsername = 'testuser'
    
    const cookieToken = jwt.sign(
      { userId: mockUserId, emailAddress: mockEmail, username: mockUsername },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    )

    const headerToken = jwt.sign(
      { userId: 'different-id', emailAddress: 'different@example.com', username: 'different' },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    )

    mockRequest.cookies = { auth_token: cookieToken }
    mockRequest.headers = { authorization: `Bearer ${headerToken}` }

    await authMiddleware(
      mockRequest as AuthRequest,
      mockResponse as Response,
      nextFunction
    )

    expect(mockRequest.userId).toBe(mockUserId)
    expect(mockRequest.emailAddress).toBe(mockEmail)
    expect(nextFunction).toHaveBeenCalled()
  })

  it('should reject request with no token', async () => {
    await authMiddleware(
      mockRequest as AuthRequest,
      mockResponse as Response,
      nextFunction
    )

    expect(mockResponse.status).toHaveBeenCalledWith(401)
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Authentication required' })
    expect(nextFunction).not.toHaveBeenCalled()
  })

  it('should reject request with invalid token', async () => {
    mockRequest.cookies = { auth_token: 'invalid.token.here' }

    await authMiddleware(
      mockRequest as AuthRequest,
      mockResponse as Response,
      nextFunction
    )

    expect(mockResponse.status).toHaveBeenCalledWith(401)
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Unauthorized',
      })
    )
    expect(nextFunction).not.toHaveBeenCalled()
  })

  it('should reject request with expired token', async () => {
    const expiredToken = jwt.sign(
      { userId: 'test-id', emailAddress: 'test@example.com', username: 'testuser' },
      process.env.JWT_SECRET!,
      { expiresIn: '0s' }
    )

    // Wait to ensure expiration
    await new Promise(resolve => setTimeout(resolve, 100))

    mockRequest.cookies = { auth_token: expiredToken }

    await authMiddleware(
      mockRequest as AuthRequest,
      mockResponse as Response,
      nextFunction
    )

    expect(mockResponse.status).toHaveBeenCalledWith(401)
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Unauthorized',
      })
    )
    expect(nextFunction).not.toHaveBeenCalled()
  })

  it('should reject token signed with wrong secret', async () => {
    const wrongToken = jwt.sign(
      { userId: 'test-id', emailAddress: 'test@example.com', username: 'testuser' },
      'wrong-secret',
      { expiresIn: '24h' }
    )

    mockRequest.cookies = { auth_token: wrongToken }

    await authMiddleware(
      mockRequest as AuthRequest,
      mockResponse as Response,
      nextFunction
    )

    expect(mockResponse.status).toHaveBeenCalledWith(401)
    expect(nextFunction).not.toHaveBeenCalled()
  })

  it('should reject malformed Authorization header', async () => {
    mockRequest.headers = { authorization: 'InvalidFormat token' }

    await authMiddleware(
      mockRequest as AuthRequest,
      mockResponse as Response,
      nextFunction
    )

    expect(mockResponse.status).toHaveBeenCalledWith(401)
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Authentication required' })
    expect(nextFunction).not.toHaveBeenCalled()
  })

  it('should handle missing Bearer prefix in Authorization header', async () => {
    const token = jwt.sign(
      { userId: 'test-id', emailAddress: 'test@example.com', username: 'testuser' },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    )

    mockRequest.headers = { authorization: token } // Missing "Bearer " prefix

    await authMiddleware(
      mockRequest as AuthRequest,
      mockResponse as Response,
      nextFunction
    )

    expect(mockResponse.status).toHaveBeenCalledWith(401)
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Authentication required' })
    expect(nextFunction).not.toHaveBeenCalled()
  })

  it('should attach userId and emailAddress to request object', async () => {
    const mockUserId = '123e4567-e89b-12d3-a456-426614174000'
    const mockEmail = 'test@example.com'
    const mockUsername = 'testuser'
    
    const token = jwt.sign(
      { userId: mockUserId, emailAddress: mockEmail, username: mockUsername },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    )

    mockRequest.cookies = { auth_token: token }

    await authMiddleware(
      mockRequest as AuthRequest,
      mockResponse as Response,
      nextFunction
    )

    expect(mockRequest.userId).toBeDefined()
    expect(mockRequest.emailAddress).toBeDefined()
    expect(mockRequest.userId).toBe(mockUserId)
    expect(mockRequest.emailAddress).toBe(mockEmail)
  })
})
