import { Request, Response, NextFunction } from 'express'
import AuthService from '../services/AuthService.js'

export interface AuthRequest extends Request {
  userId?: string
  emailAddress?: string
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing or invalid authorization header' })
      return
    }

    const token = authHeader.substring(7)

    const payload = await AuthService.verifyToken(token)

    req.userId = payload.userId
    req.emailAddress = payload.emailAddress

    next()
  } catch (error) {
    res.status(401).json({
      error: 'Unauthorized',
      message: error instanceof Error ? error.message : 'Invalid token',
    })
  }
}
