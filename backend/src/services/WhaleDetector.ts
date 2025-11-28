/**
 * Whale Detector Service
 * 
 * Detects large orders (whale activity) from Coinbase WebSocket ticker data.
 * Since level2 requires authentication, we use volume spikes from ticker data.
 * Whale activity is detected when volume exceeds 1000x the average.
 */

import logger from '../utils/logger.js'

export interface WhaleAlert {
  id: string
  symbol: string
  side: 'buy' | 'sell'
  size: number
  price: number
  usdValue: number
  averageSize: number
  multiplier: number
  timestamp: number
  message: string
  sizeCategory: WhaleSizeCategory
}

interface VolumeHistory {
  volumes: number[]
  lastVolume: number
  lastPrice: number
  lastUpdate: number
}

// Whale detection thresholds
// Lowered multiplier to catch more whale activity (was 1000x, now 10x)
const WHALE_MULTIPLIER = 10
const MAX_HISTORY_SIZE = 100
const HISTORY_EXPIRY_MS = 3600000 // 1 hour
// Lower minimum to $10K (tiny) - we'll filter by category in the UI
const MIN_USD_VALUE = 10000 // Minimum $10K to be considered whale activity
const MAX_ALERTS = 500 // Store up to 500 alerts for 30-day history
const ALERT_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

// Whale size categories
export type WhaleSizeCategory = 'tiny' | 'small' | 'average' | 'large'
export const getWhaleSizeCategory = (usdValue: number): WhaleSizeCategory => {
  if (usdValue >= 100000) return 'large'
  if (usdValue >= 50000) return 'average'
  if (usdValue >= 10000) return 'small'
  return 'tiny'
}

class WhaleDetector {
  private volumeHistory: Map<string, VolumeHistory> = new Map()
  private whaleAlerts: WhaleAlert[] = []
  private maxAlerts = MAX_ALERTS
  private listeners: ((alert: WhaleAlert) => void)[] = []

  /**
   * Process level2 order book data to detect whale activity
   * Detects large orders directly from order book updates
   */
  processOrder(
    symbol: string,
    side: 'buy' | 'sell',
    price: number,
    orderSize: number
  ): WhaleAlert | null {
    if (orderSize <= 0 || price <= 0) return null

    // Calculate USD value of the order
    const usdValue = orderSize * price

    // Get or create history for this symbol
    let history = this.volumeHistory.get(symbol)
    if (!history || Date.now() - history.lastUpdate > HISTORY_EXPIRY_MS) {
      history = { volumes: [], lastVolume: 0, lastPrice: price, lastUpdate: Date.now() }
      this.volumeHistory.set(symbol, history)
    }

    // Track order sizes in history for average calculation
    history.volumes.push(orderSize)
    if (history.volumes.length > MAX_HISTORY_SIZE) {
      history.volumes.shift()
    }
    history.lastVolume = orderSize
    history.lastPrice = price
    history.lastUpdate = Date.now()

    // Calculate average order size
    const avgSize = history.volumes.length > 0
      ? history.volumes.reduce((a, b) => a + b, 0) / history.volumes.length
      : orderSize

    // Check for whale activity (10x average order size AND minimum USD value)
    const multiplier = avgSize > 0 ? orderSize / avgSize : 1
    if (multiplier >= WHALE_MULTIPLIER && history.volumes.length >= 5 && usdValue >= MIN_USD_VALUE) {
      const alert = this.createWhaleAlert(symbol, side, price, orderSize, usdValue, avgSize, multiplier)
      this.addAlert(alert)
      this.notifyListeners(alert)
      return alert
    }

    return null
  }

  /**
   * Seed demo whale alerts for testing/demonstration
   */
  seedDemoAlerts(): void {
    if (this.whaleAlerts.length > 0) return // Only seed if no real alerts

    const demoAlerts: WhaleAlert[] = [
      {
        id: 'demo-btc-1',
        symbol: 'BTC',
        side: 'buy',
        size: 12.5,
        price: 97500,
        usdValue: 1218750,
        averageSize: 0.5,
        multiplier: 25,
        timestamp: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
        message: '🐋📈 WHALE ALERT: Large BUY order for BTC! $1.22M',
        sizeCategory: 'large'
      },
      {
        id: 'demo-eth-1',
        symbol: 'ETH',
        side: 'sell',
        size: 150,
        price: 3650,
        usdValue: 547500,
        averageSize: 5,
        multiplier: 30,
        timestamp: Date.now() - 5 * 60 * 60 * 1000, // 5 hours ago
        message: '🐋📉 WHALE ALERT: Large SELL order for ETH! $547K',
        sizeCategory: 'large'
      },
      {
        id: 'demo-sol-1',
        symbol: 'SOL',
        side: 'buy',
        size: 800,
        price: 240,
        usdValue: 192000,
        averageSize: 20,
        multiplier: 40,
        timestamp: Date.now() - 12 * 60 * 60 * 1000, // 12 hours ago
        message: '🐋📈 WHALE ALERT: Large BUY order for SOL! $192K',
        sizeCategory: 'large'
      },
      {
        id: 'demo-doge-1',
        symbol: 'DOGE',
        side: 'buy',
        size: 500000,
        price: 0.42,
        usdValue: 210000,
        averageSize: 10000,
        multiplier: 50,
        timestamp: Date.now() - 24 * 60 * 60 * 1000, // 1 day ago
        message: '🐋📈 WHALE ALERT: Large BUY order for DOGE! $210K',
        sizeCategory: 'large'
      },
      {
        id: 'demo-xrp-1',
        symbol: 'XRP',
        side: 'sell',
        size: 80000,
        price: 1.45,
        usdValue: 116000,
        averageSize: 2000,
        multiplier: 40,
        timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 days ago
        message: '🐋📉 WHALE ALERT: Large SELL order for XRP! $116K',
        sizeCategory: 'large'
      },
      {
        id: 'demo-link-1',
        symbol: 'LINK',
        side: 'buy',
        size: 4000,
        price: 18.50,
        usdValue: 74000,
        averageSize: 100,
        multiplier: 40,
        timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3 days ago
        message: '🐋📈 WHALE ALERT: Average BUY order for LINK! $74K',
        sizeCategory: 'average'
      },
      {
        id: 'demo-ada-1',
        symbol: 'ADA',
        side: 'buy',
        size: 50000,
        price: 1.05,
        usdValue: 52500,
        averageSize: 1000,
        multiplier: 50,
        timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 days ago
        message: '🐋📈 WHALE ALERT: Average BUY order for ADA! $52.5K',
        sizeCategory: 'average'
      },
      {
        id: 'demo-avax-1',
        symbol: 'AVAX',
        side: 'sell',
        size: 1500,
        price: 42,
        usdValue: 63000,
        averageSize: 50,
        multiplier: 30,
        timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
        message: '🐋📉 WHALE ALERT: Average SELL order for AVAX! $63K',
        sizeCategory: 'average'
      },
      {
        id: 'demo-dot-1',
        symbol: 'DOT',
        side: 'buy',
        size: 3000,
        price: 8.50,
        usdValue: 25500,
        averageSize: 100,
        multiplier: 30,
        timestamp: Date.now() - 10 * 24 * 60 * 60 * 1000, // 10 days ago
        message: '🐋📈 WHALE ALERT: Small BUY order for DOT! $25.5K',
        sizeCategory: 'small'
      },
      {
        id: 'demo-uni-1',
        symbol: 'UNI',
        side: 'buy',
        size: 1200,
        price: 12.50,
        usdValue: 15000,
        averageSize: 40,
        multiplier: 30,
        timestamp: Date.now() - 15 * 24 * 60 * 60 * 1000, // 15 days ago
        message: '🐋📈 WHALE ALERT: Small BUY order for UNI! $15K',
        sizeCategory: 'small'
      }
    ]

    this.whaleAlerts = demoAlerts
    logger.info('Seeded demo whale alerts', { count: demoAlerts.length })
  }

  /**
   * Create a whale alert object
   */
  private createWhaleAlert(
    symbol: string,
    side: 'buy' | 'sell',
    price: number,
    size: number,
    usdValue: number,
    avgSize: number,
    multiplier: number
  ): WhaleAlert {
    const sideText = side === 'buy' ? 'BUY' : 'SELL'
    const emoji = side === 'buy' ? '🐋📈' : '🐋📉'
    const sizeCategory = getWhaleSizeCategory(usdValue)
    
    return {
      id: `whale-${symbol}-${Date.now()}`,
      symbol,
      side,
      size,
      price,
      usdValue,
      averageSize: avgSize,
      multiplier: Math.round(multiplier),
      timestamp: Date.now(),
      message: `${emoji} WHALE ALERT: Large ${sideText} order detected for ${symbol}! ${size.toFixed(4)} ${symbol} ($${this.formatUSD(usdValue)}) - ${Math.round(multiplier)}x average size`,
      sizeCategory
    }
  }

  /**
   * Format USD value with K/M/B suffixes
   */
  private formatUSD(value: number): string {
    if (value >= 1000000000) return `${(value / 1000000000).toFixed(2)}B`
    if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`
    if (value >= 1000) return `${(value / 1000).toFixed(2)}K`
    return value.toFixed(2)
  }

  /**
   * Add alert to history
   */
  private addAlert(alert: WhaleAlert): void {
    this.whaleAlerts.unshift(alert)
    
    // Remove alerts older than 30 days
    const expiryTime = Date.now() - ALERT_EXPIRY_MS
    this.whaleAlerts = this.whaleAlerts.filter(a => a.timestamp > expiryTime)
    
    // Also limit by max alerts
    if (this.whaleAlerts.length > this.maxAlerts) {
      this.whaleAlerts = this.whaleAlerts.slice(0, this.maxAlerts)
    }
    
    logger.info('Whale activity detected', {
      symbol: alert.symbol,
      side: alert.side,
      usdValue: alert.usdValue,
      multiplier: alert.multiplier
    })
  }

  /**
   * Register a listener for whale alerts
   */
  onWhaleAlert(callback: (alert: WhaleAlert) => void): void {
    this.listeners.push(callback)
  }

  /**
   * Notify all listeners of a new whale alert
   */
  private notifyListeners(alert: WhaleAlert): void {
    for (const listener of this.listeners) {
      try {
        listener(alert)
      } catch (error) {
        logger.error('Error in whale alert listener', { error })
      }
    }
  }

  /**
   * Get recent whale alerts
   */
  getRecentAlerts(limit: number = 10): WhaleAlert[] {
    return this.whaleAlerts.slice(0, limit)
  }

  /**
   * Get whale alerts for a specific symbol
   */
  getAlertsForSymbol(symbol: string, limit: number = 10): WhaleAlert[] {
    return this.whaleAlerts
      .filter(a => a.symbol === symbol)
      .slice(0, limit)
  }

  /**
   * Get statistics for a symbol
   */
  getStats(symbol: string): { avgSize: number; orderCount: number } | null {
    const history = this.volumeHistory.get(symbol)
    if (!history || history.volumes.length === 0) return null

    return {
      avgSize: history.volumes.reduce((a, b) => a + b, 0) / history.volumes.length,
      orderCount: history.volumes.length
    }
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.volumeHistory.clear()
    this.whaleAlerts = []
  }
}

// Export singleton instance and seed demo alerts
export const whaleDetector = new WhaleDetector()
whaleDetector.seedDemoAlerts()
