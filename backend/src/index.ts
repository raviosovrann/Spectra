import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import logger from './utils/logger.js'
import pool from './database/config.js'
import authRoutes from './routes/auth.js'
import userRoutes from './routes/users.js'
import walletRoutes from './routes/wallet.js'
import insightsRoutes from './routes/insights.js'
import marketRoutes from './routes/market.js'
import { checkMLServiceHealth } from './services/AIEngine.js'
import { FrontendWebSocketServer } from './services/FrontendWebSocketServer.js'
import { WebSocketManager } from './services/WebSocketManager.js'
import { MarketDataRelay } from './services/MarketDataRelay.js'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001
const WS_PORT = process.env.WS_PORT ? parseInt(process.env.WS_PORT) : 3002

// Initialize WebSocket server for frontend clients
const frontendWsServer = new FrontendWebSocketServer(WS_PORT)

// Initialize Coinbase WebSocket manager
const coinbaseWsManager = new WebSocketManager()

// Initialize market data relay
const marketDataRelay = new MarketDataRelay(coinbaseWsManager, frontendWsServer)

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
app.use('/api/wallet', walletRoutes)
app.use('/api/insights', insightsRoutes)
app.use('/api/market', marketRoutes)

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

// Start Express server
app.listen(PORT, () => {
  logger.info(`Backend server running on port ${PORT}`)
})

// Start WebSocket server
frontendWsServer.start()

// Start market data relay
marketDataRelay.start().catch((error) => {
  logger.error('Failed to start market data relay', {
    error: error instanceof Error ? error.message : String(error),
  })
})

// Check ML service availability
checkMLServiceHealth().then((available) => {
  if (available) {
    logger.info('ML service is available')
  } else {
    logger.warn('ML service not available, using technical analysis only')
  }
})

// Export services for use in other modules
export { frontendWsServer, coinbaseWsManager, marketDataRelay }
