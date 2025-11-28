/**
 * Insights API Routes
 * 
 * Provides AI-generated market insights with ML predictions
 * and technical analysis. Supports 1d/7d/30d prediction horizons.
 * Also includes whale detection alerts.
 */

import express, { Request, Response } from 'express'
import { authMiddleware } from '../middleware/auth'
import { generateInsights, checkMLServiceHealth, clearInsightsCache, MarketData } from '../services/AIEngine'
import { MarketInsight } from '../ml/types'
import { SUPPORTED_SYMBOLS } from '../ml/config'
import { whaleDetector, WhaleAlert } from '../services/WhaleDetector'

const router = express.Router()

// In-memory price history storage (populated by WebSocket data)
const priceHistoryStore = new Map<string, number[]>()
const volumeStore = new Map<string, { current: number; average: number }>()

/**
 * Update price history from WebSocket data
 * Called by MarketDataRelay when new prices arrive
 */
export function updatePriceHistory(symbol: string, price: number, volume: number): void {
  const history = priceHistoryStore.get(symbol) || []
  history.push(price)

  // Keep last 200 prices for better ML predictions
  if (history.length > 200) {
    history.shift()
  }

  priceHistoryStore.set(symbol, history)

  // Update volume with exponential moving average
  const volumeData = volumeStore.get(symbol) || { current: 0, average: volume }
  volumeData.current = volume
  volumeData.average = volumeData.average * 0.95 + volume * 0.05
  volumeStore.set(symbol, volumeData)
}

/**
 * GET /api/insights/health
 * Check ML service health and data availability
 */
router.get('/health', async (_req: Request, res: Response) => {
  const mlAvailable = await checkMLServiceHealth()
  const symbolsWithData = SUPPORTED_SYMBOLS.filter(s => {
    const history = priceHistoryStore.get(s)
    return history && history.length >= 30
  })

  res.json({
    status: 'ok',
    mlService: mlAvailable ? 'available' : 'unavailable',
    supportedSymbols: SUPPORTED_SYMBOLS,
    symbolsWithData: symbolsWithData.length,
    timestamp: Date.now()
  })
})

/**
 * GET /api/insights/:symbol
 * Get insight for a specific cryptocurrency
 * Query params: horizon (1, 7, 30) - prediction horizon in days
 */
router.get('/:symbol', authMiddleware, async (req: Request, res: Response) => {
  try {
    const symbol = req.params.symbol.toUpperCase()
    const horizonParam = parseInt(req.query.horizon as string) || 7
    const horizon = [1, 7, 30].includes(horizonParam) ? (horizonParam as 1 | 7 | 30) : 7

    // Get price history
    const priceHistory = priceHistoryStore.get(symbol) || []
    const volumeData = volumeStore.get(symbol) || { current: 0, average: 0 }

    // Create market data object
    const marketData: MarketData = {
      symbol,
      name: symbol,
      price: priceHistory[priceHistory.length - 1] || 0,
      priceHistory,
      volume24h: volumeData.current,
      averageVolume: volumeData.average,
      change24h: calculateChange24h(priceHistory)
    }

    // Generate insights with specified horizon
    const insights = await generateInsights(symbol, marketData, horizon)

    res.json({
      symbol,
      horizon,
      insights,
      dataPoints: priceHistory.length,
      hasEnoughData: priceHistory.length >= 30,
      timestamp: Date.now()
    })
  } catch (error) {
    console.error(`Error generating insights for ${req.params.symbol}:`, error)
    res.status(500).json({ error: 'Failed to generate insights' })
  }
})

/**
 * GET /api/insights
 * Get insights for all tracked symbols
 * Query params: horizon (1, 7, 30) - prediction horizon in days
 */
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const horizonParam = parseInt(req.query.horizon as string) || 7
    const horizon = [1, 7, 30].includes(horizonParam) ? (horizonParam as 1 | 7 | 30) : 7

    const allInsights: MarketInsight[] = []
    const symbolsWithData: string[] = []
    const symbolsWithoutData: string[] = []

    // Generate insights for ALL symbols (ML prediction requires 30+ data points, but technical analysis works with less)
    for (const symbol of SUPPORTED_SYMBOLS) {
      const priceHistory = priceHistoryStore.get(symbol) || []
      const volumeData = volumeStore.get(symbol) || { current: 0, average: 0 }

      // Track which symbols have enough data for ML
      if (priceHistory.length >= 30) {
        symbolsWithData.push(symbol)
      } else if (priceHistory.length > 0) {
        symbolsWithoutData.push(symbol)
      }

      // Generate insights even with limited data (technical analysis still works)
      if (priceHistory.length >= 2) {
        const marketData: MarketData = {
          symbol,
          name: symbol,
          price: priceHistory[priceHistory.length - 1] || 0,
          priceHistory,
          volume24h: volumeData.current,
          averageVolume: volumeData.average,
          change24h: calculateChange24h(priceHistory)
        }

        const insights = await generateInsights(symbol, marketData, horizon)
        allInsights.push(...insights)
      }
      // Symbols with no data at all are already tracked in symbolsWithoutData
    }

    // Sort by confidence
    const sortedInsights = allInsights.sort((a, b) => b.confidence - a.confidence)

    res.json({
      insights: sortedInsights,
      horizon,
      symbolsWithData,
      symbolsWithoutData,
      totalSymbols: SUPPORTED_SYMBOLS.length,
      timestamp: Date.now()
    })
  } catch (error) {
    console.error('Error generating insights:', error)
    res.status(500).json({ error: 'Failed to generate insights' })
  }
})

/**
 * DELETE /api/insights/cache
 * Clear insights cache
 */
router.delete('/cache', authMiddleware, (_req: Request, res: Response) => {
  clearInsightsCache()
  res.json({ message: 'Cache cleared' })
})

/**
 * GET /api/insights/whales
 * Get recent whale alerts
 */
router.get('/whales', authMiddleware, (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 10
  const symbol = req.query.symbol as string

  let alerts: WhaleAlert[]
  if (symbol) {
    alerts = whaleDetector.getAlertsForSymbol(symbol.toUpperCase(), limit)
  } else {
    alerts = whaleDetector.getRecentAlerts(limit)
  }

  res.json({
    alerts,
    count: alerts.length,
    timestamp: Date.now()
  })
})

/**
 * GET /api/insights/whales/stats/:symbol
 * Get whale detection stats for a symbol
 */
router.get('/whales/stats/:symbol', authMiddleware, (req: Request, res: Response) => {
  const symbol = req.params.symbol.toUpperCase()
  const stats = whaleDetector.getStats(symbol)

  if (!stats) {
    res.json({
      symbol,
      message: 'No order data available yet',
      avgSize: 0,
      orderCount: 0
    })
    return
  }

  res.json({
    symbol,
    ...stats,
    timestamp: Date.now()
  })
})

/**
 * Calculate 24h price change percentage
 */
function calculateChange24h(prices: number[]): number {
  if (prices.length < 2) return 0
  const current = prices[prices.length - 1]
  // Use price from ~24 data points ago if available (assuming ~1 update per minute)
  const lookback = Math.min(prices.length - 1, 1440) // 24 hours * 60 minutes
  const previous = prices[prices.length - 1 - lookback]
  if (previous === 0) return 0
  return ((current - previous) / previous) * 100
}

export default router
