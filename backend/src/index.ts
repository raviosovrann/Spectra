import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import logger from './utils/logger.js'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
)
app.use(express.json())

// Health check endpoint with service status checks
app.get('/health', (_req, res) => {
  const health = {
    status: 'ok',
    timestamp: Date.now(),
    uptime: process.uptime(),
    services: {
      api: 'ok',
      // Additional service checks can be added here
      // coinbaseAPI: checkCoinbaseConnection(),
      // websocket: checkWebSocketStatus(),
    },
  }

  res.json(health)
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
