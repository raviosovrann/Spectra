import { Request, Response, NextFunction } from 'express'
import AuthService from '../services/AuthService.js'

export interface AuthRequest extends Request {
  userId?: string
  emailAddress?: string
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    // Try to get token from cookie first (preferred), then from Authorization header
    let token = req.cookies?.auth_token

    if (!token) {
      const authHeader = req.headers.authorization
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7)
      }
    }

    if (!token) {
      res.status(401).json({ error: 'Authentication required' })
      return
    }

    const payload = await AuthService.verifyToken(token)

    req.userId = payload.userId
    req.emailAddress = payload.emailAddress

    next()
  } catch (error) {
    res.status(401).json({
      error: 'Unauthorized',
      message: error instanceof Error ? error.message : 'Invalid or expired token',
    })
  }
}
