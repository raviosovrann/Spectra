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
}

interface VolumeHistory {
  volumes: number[]
  lastVolume: number
  lastPrice: number
  lastUpdate: number
}

// Whale detection threshold (1000x average volume change)
const WHALE_MULTIPLIER = 1000
const MAX_HISTORY_SIZE = 100
const HISTORY_EXPIRY_MS = 3600000 // 1 hour
const MIN_USD_VALUE = 100000 // Minimum $100K to be considered whale activity

class WhaleDetector {
  private volumeHistory: Map<string, VolumeHistory> = new Map()
  private whaleAlerts: WhaleAlert[] = []
  private maxAlerts = 50
  private listeners: ((alert: WhaleAlert) => void)[] = []

  /**
   * Process ticker data to detect whale activity via volume spikes
   * Since level2 requires authentication, we detect whales by monitoring
   * sudden large changes in 24h volume between ticker updates
   */
  processOrder(
    symbol: string,
    _side: 'buy' | 'sell', // Side is determined by price movement instead
    price: number,
    volumeChange: number
  ): WhaleAlert | null {
    if (volumeChange <= 0 || price <= 0) return null

    // Get or create history for this symbol
    let history = this.volumeHistory.get(symbol)
    if (!history || Date.now() - history.lastUpdate > HISTORY_EXPIRY_MS) {
      history = { volumes: [], lastVolume: 0, lastPrice: price, lastUpdate: Date.now() }
      this.volumeHistory.set(symbol, history)
    }

    // Calculate volume delta (change since last update)
    const volumeDelta = Math.abs(volumeChange - history.lastVolume)
    const usdValue = volumeDelta * price

    // Update history
    if (volumeDelta > 0) {
      history.volumes.push(volumeDelta)
      if (history.volumes.length > MAX_HISTORY_SIZE) {
        history.volumes.shift()
      }
    }
    history.lastVolume = volumeChange
    history.lastPrice = price
    history.lastUpdate = Date.now()

    // Calculate average volume delta
    const avgVolumeDelta = history.volumes.length > 0
      ? history.volumes.reduce((a, b) => a + b, 0) / history.volumes.length
      : volumeDelta

    // Check for whale activity (1000x average volume change AND minimum USD value)
    const multiplier = avgVolumeDelta > 0 ? volumeDelta / avgVolumeDelta : 1
    if (multiplier >= WHALE_MULTIPLIER && history.volumes.length >= 10 && usdValue >= MIN_USD_VALUE) {
      // Determine side based on price movement
      const priceSide = price > history.lastPrice ? 'buy' : 'sell'
      const alert = this.createWhaleAlert(symbol, priceSide, price, volumeDelta, usdValue, avgVolumeDelta, multiplier)
      this.addAlert(alert)
      this.notifyListeners(alert)
      return alert
    }

    return null
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
      message: `${emoji} WHALE ALERT: Large ${sideText} order detected for ${symbol}! ${size.toFixed(4)} ${symbol} ($${this.formatUSD(usdValue)}) - ${Math.round(multiplier)}x average size`
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
    if (this.whaleAlerts.length > this.maxAlerts) {
      this.whaleAlerts.pop()
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

// Export singleton instance
export const whaleDetector = new WhaleDetector()
