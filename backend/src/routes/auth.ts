import { Router, Response } from 'express'
import AuthService from '../services/AuthService.js'
import { authMiddleware, AuthRequest } from '../middleware/auth.js'
import { RegisterRequest } from '../types/auth.js'
import logger from '../utils/logger.js'

const router = Router()

// Cookie options interface
interface CookieOptions {
  httpOnly: boolean
  secure: boolean
  sameSite: 'strict' | 'lax' | 'none'
  maxAge?: number
  path: string
  domain?: string
}

// Validation helpers
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function isValidPassword(password: string): boolean {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
  return passwordRegex.test(password)
}

function isValidUsername(username: string): boolean {
  // 3-50 characters, alphanumeric and underscore only
  const usernameRegex = /^[a-zA-Z0-9_]{3,50}$/
  return usernameRegex.test(username)
}

// POST /api/auth/register
router.post('/register', async (req, res: Response) => {
  try {
    const { fullName, username, emailAddress, password } = req.body as RegisterRequest

    // Validate inputs
    if (!fullName || !username || !emailAddress || !password) {
      res.status(400).json({ error: 'Missing required fields' })
      return
    }

    if (!isValidEmail(emailAddress)) {
      res.status(400).json({ error: 'Invalid email format' })
      return
    }

    if (!isValidUsername(username)) {
      res.status(400).json({ error: 'Username must be 3-50 characters, alphanumeric and underscore only' })
      return
    }

    if (!isValidPassword(password)) {
      res.status(400).json({
        error: 'Password must be at least 8 characters with uppercase, lowercase, and number',
      })
      return
    }

    const user = await AuthService.register(fullName, username, emailAddress, password)

    res.status(201).json({
      message: 'User registered successfully',
      user,
    })
  } catch (error) {
    logger.error('Registration error', { error: error instanceof Error ? error.message : String(error) })

    if (error instanceof Error && error.message.includes('already exists')) {
      res.status(409).json({ error: error.message })
    } else {
      res.status(500).json({ error: 'Registration failed' })
    }
  }
})

// POST /api/auth/login
router.post('/login', async (req, res: Response) => {
  try {
    const { identifier, password } = req.body

    // Validate inputs
    if (!identifier || !password) {
      res.status(400).json({ error: 'Email/username and password are required' })
      return
    }

    const { user, token } = await AuthService.login(identifier, password)

    // Set HTTP-only cookie for secure session management
    const cookieOptions: CookieOptions = {
      httpOnly: true, // Prevents JavaScript access (XSS protection)
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax', // CSRF protection (lax for dev)
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/',
    }
    
    // In development, don't set domain to allow cross-port cookies on localhost
    if (process.env.NODE_ENV === 'production' && process.env.COOKIE_DOMAIN) {
      cookieOptions.domain = process.env.COOKIE_DOMAIN
    }
    
    res.cookie('auth_token', token, cookieOptions)

    res.json({
      message: 'Login successful',
      user,
    })
  } catch (error) {
    logger.error('Login error', { error: error instanceof Error ? error.message : String(error) })

    res.status(401).json({
      error: 'Invalid credentials',
    })
  }
})

// POST /api/auth/logout
router.post('/logout', (_req, res: Response) => {
  try {
    // Clear the auth cookie
    const cookieOptions: CookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      path: '/',
    }
    
    if (process.env.NODE_ENV === 'production' && process.env.COOKIE_DOMAIN) {
      cookieOptions.domain = process.env.COOKIE_DOMAIN
    }
    
    res.clearCookie('auth_token', cookieOptions)

    res.json({
      message: 'Logout successful',
    })
  } catch (error) {
    logger.error('Logout error', { error: error instanceof Error ? error.message : String(error) })

    res.status(500).json({ error: 'Logout failed' })
  }
})

// GET /api/auth/me
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'User ID not found in token' })
      return
    }

    const user = await AuthService.getUserById(req.userId)

    res.json({ user })
  } catch (error) {
    logger.error('Get user error', { error: error instanceof Error ? error.message : String(error) })

    res.status(500).json({ error: 'Failed to retrieve user' })
  }
})

export default router
