import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import logger from './utils/logger.js'
import pool from './database/config.js'
import authRoutes from './routes/auth.js'
import userRoutes from './routes/users.js'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true, // Allow cookies to be sent
  })
)
app.use(express.json())
app.use(cookieParser()) // Parse cookies from requests

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)

// Health check endpoint with service status checks
app.get('/health', async (_req, res) => {
  try {
    // Test database connection
    await pool.query('SELECT NOW()')

    const health = {
      status: 'ok',
      timestamp: Date.now(),
      uptime: process.uptime(),
      services: {
        api: 'ok',
        database: 'ok',
      },
    }

    res.json(health)
  } catch (error) {
    logger.error('Health check failed', { error: error instanceof Error ? error.message : String(error) })

    res.status(503).json({
      status: 'error',
      timestamp: Date.now(),
      services: {
        api: 'ok',
        database: 'error',
      },
    })
  }
})

// Error handling middleware
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    logger.error('Error occurred', {
      error: err.message,
      stack: err.stack,
    })

    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
    })
  }
)

// Start server
app.listen(PORT, () => {
  logger.info(`Backend server running on port ${PORT}`)
})
