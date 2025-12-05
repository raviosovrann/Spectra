/**
 * CandleAggregator Service
 * 
 * Aggregates real-time ticker data from Coinbase WebSocket into OHLC candlestick format.
 * Maintains rolling buffers of candles for multiple time intervals per symbol.
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */

import logger from '../utils/logger.js'
import type { TickerMessage } from '../types/websocket.js'

// Supported time intervals - extended to support all granularities
export type CandleInterval = 
  | '1m' | '2m' | '3m' | '4m' | '5m' | '10m' | '15m' | '30m' | '45m'
  | '1h' | '2h' | '3h' | '4h'
  | '1d'

// Interval durations in milliseconds
export const INTERVAL_MS: Record<CandleInterval, number> = {
  '1m': 60 * 1000,
  '2m': 2 * 60 * 1000,
  '3m': 3 * 60 * 1000,
  '4m': 4 * 60 * 1000,
  '5m': 5 * 60 * 1000,
  '10m': 10 * 60 * 1000,
  '15m': 15 * 60 * 1000,
  '30m': 30 * 60 * 1000,
  '45m': 45 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '2h': 2 * 60 * 60 * 1000,
  '3h': 3 * 60 * 60 * 1000,
  '4h': 4 * 60 * 60 * 1000,
  '1d': 24 * 60 * 60 * 1000,
}

// Supported intervals list
const SUPPORTED_INTERVALS: CandleInterval[] = [
  '1m', '2m', '3m', '4m', '5m', '10m', '15m', '30m', '45m',
  '1h', '2h', '3h', '4h',
  '1d'
]

// Export for validation in routes
export const VALID_INTERVALS = SUPPORTED_INTERVALS

// Maximum candles to store per symbol per interval
const MAX_CANDLES = 100

/**
 * Aggregated candle data structure
 */
export interface AggregatedCandle {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
  trades: number
}

/**
 * Latest ticker data for a symbol
 */
export interface TickerData {
  symbol: string
  productId: string
  price: number
  change24h: number
  change24hPercent: number
  volume24h: number
  high24h: number
  low24h: number
  bestBid: number
  bestAsk: number
  timestamp: number
}

/**
 * Response format for candles API
 */
export interface CandlesResponse {
  symbol: string
  productId: string
  interval: CandleInterval
  ticker: TickerData | null
  candles: AggregatedCandle[]
  lastUpdate: number
}

export class CandleAggregator {
  // Finalized candles: Map<symbol, Map<interval, candles[]>>
  private candles: Map<string, Map<CandleInterval, AggregatedCandle[]>> = new Map()
  
  // Current (incomplete) candles: Map<symbol, Map<interval, candle>>
  private currentCandles: Map<string, Map<CandleInterval, AggregatedCandle>> = new Map()
  
  // Latest ticker data: Map<symbol, ticker>
  private latestTickers: Map<string, TickerData> = new Map()
  
  // Volume tracking for candle volume calculation
  private lastVolume24h: Map<string, number> = new Map()

  constructor() {
    logger.info('CandleAggregator initialized', {
      supportedIntervals: SUPPORTED_INTERVALS,
      maxCandlesPerSymbol: MAX_CANDLES,
    })
  }

  /**
   * Process incoming ticker message and aggregate into candles
   */
  processTicker(ticker: TickerMessage): void {
    const symbol = ticker.productId.split('-')[0]
    const price = ticker.price
    const now = Date.now()

    // Update latest ticker data
    this.updateLatestTicker(symbol, ticker)

    // Process for each supported interval
    for (const interval of SUPPORTED_INTERVALS) {
      this.processTickerForInterval(symbol, price, ticker.volume24h, interval, now)
    }
  }

  /**
   * Update the latest ticker data for a symbol
   */
  private updateLatestTicker(symbol: string, ticker: TickerMessage): void {
    const change24h = ticker.price - ticker.open24h
    const change24hPercent = ticker.open24h > 0 
      ? (change24h / ticker.open24h) * 100 
      : 0

    this.latestTickers.set(symbol, {
      symbol,
      productId: ticker.productId,
      price: ticker.price,
      change24h: parseFloat(change24h.toFixed(2)),
      change24hPercent: parseFloat(change24hPercent.toFixed(2)),
      volume24h: ticker.volume24h,
      high24h: ticker.high24h,
      low24h: ticker.low24h,
      bestBid: ticker.bestBid,
      bestAsk: ticker.bestAsk,
      timestamp: ticker.timestamp,
    })
  }

  /**
   * Process ticker for a specific interval
   */
  private processTickerForInterval(
    symbol: string,
    price: number,
    volume24h: number,
    interval: CandleInterval,
    now: number
  ): void {
    const intervalMs = INTERVAL_MS[interval]
    const candleTimestamp = Math.floor(now / intervalMs) * intervalMs

    // Get or create symbol maps
    if (!this.currentCandles.has(symbol)) {
      this.currentCandles.set(symbol, new Map())
    }
    if (!this.candles.has(symbol)) {
      this.candles.set(symbol, new Map())
    }

    const symbolCurrentCandles = this.currentCandles.get(symbol)!
    const symbolCandles = this.candles.get(symbol)!

    // Get current candle for this interval
    const currentCandle = symbolCurrentCandles.get(interval)

    if (!currentCandle || currentCandle.timestamp !== candleTimestamp) {
      // New candle period - finalize current and start new
      if (currentCandle) {
        this.finalizeCandle(symbol, interval, currentCandle, symbolCandles)
      }

      // Start new candle
      const newCandle: AggregatedCandle = {
        timestamp: candleTimestamp,
        open: price,
        high: price,
        low: price,
        close: price,
        volume: 0,
        trades: 1,
      }
      symbolCurrentCandles.set(interval, newCandle)
      
      // Reset volume tracking for this symbol
      this.lastVolume24h.set(`${symbol}-${interval}`, volume24h)
    } else {
      // Update existing candle
      currentCandle.high = Math.max(currentCandle.high, price)
      currentCandle.low = Math.min(currentCandle.low, price)
      currentCandle.close = price
      currentCandle.trades++

      // Estimate volume change (delta from last update)
      const lastVol = this.lastVolume24h.get(`${symbol}-${interval}`) || volume24h
      const volumeDelta = Math.max(0, volume24h - lastVol)
      currentCandle.volume += volumeDelta
      this.lastVolume24h.set(`${symbol}-${interval}`, volume24h)
    }
  }

  /**
   * Finalize a candle and add to history
   */
  private finalizeCandle(
    symbol: string,
    interval: CandleInterval,
    candle: AggregatedCandle,
    symbolCandles: Map<CandleInterval, AggregatedCandle[]>
  ): void {
    if (!symbolCandles.has(interval)) {
      symbolCandles.set(interval, [])
    }

    const candles = symbolCandles.get(interval)!
    candles.push({ ...candle })

    // Trim to max candles
    if (candles.length > MAX_CANDLES) {
      candles.shift()
    }

    logger.debug('Candle finalized', {
      symbol,
      interval,
      timestamp: candle.timestamp,
      open: candle.open,
      close: candle.close,
      trades: candle.trades,
    })
  }

  /**
   * Get candles for a symbol and interval
   */
  getCandles(symbol: string, interval: CandleInterval, limit: number = MAX_CANDLES): AggregatedCandle[] {
    const symbolCandles = this.candles.get(symbol)
    if (!symbolCandles) return []

    const candles = symbolCandles.get(interval) || []
    const currentCandle = this.getCurrentCandle(symbol, interval)

    // Combine finalized candles with current candle
    const allCandles = currentCandle 
      ? [...candles, currentCandle]
      : [...candles]

    // Return last N candles
    return allCandles.slice(-limit)
  }

  /**
   * Get current (incomplete) candle for a symbol and interval
   */
  getCurrentCandle(symbol: string, interval: CandleInterval): AggregatedCandle | null {
    const symbolCurrentCandles = this.currentCandles.get(symbol)
    if (!symbolCurrentCandles) return null
    return symbolCurrentCandles.get(interval) || null
  }

  /**
   * Get latest ticker data for a symbol
   */
  getLatestTicker(symbol: string): TickerData | null {
    return this.latestTickers.get(symbol) || null
  }

  /**
   * Get full candles response for API
   */
  getCandlesResponse(symbol: string, interval: CandleInterval, limit: number = MAX_CANDLES): CandlesResponse {
    return {
      symbol,
      productId: `${symbol}-USD`,
      interval,
      ticker: this.getLatestTicker(symbol),
      candles: this.getCandles(symbol, interval, limit),
      lastUpdate: Date.now(),
    }
  }

  /**
   * Check if a symbol has any data
   */
  hasData(symbol: string): boolean {
    return this.latestTickers.has(symbol) || this.candles.has(symbol)
  }

  /**
   * Get all symbols with data
   */
  getSymbols(): string[] {
    return Array.from(this.latestTickers.keys())
  }

  /**
   * Get statistics for debugging
   */
  getStats(): {
    symbolCount: number
    candleCounts: Record<string, Record<string, number>>
  } {
    const candleCounts: Record<string, Record<string, number>> = {}

    this.candles.forEach((intervals, symbol) => {
      candleCounts[symbol] = {}
      intervals.forEach((candles, interval) => {
        candleCounts[symbol][interval] = candles.length
      })
    })

    return {
      symbolCount: this.latestTickers.size,
      candleCounts,
    }
  }
}

// Singleton instance
let candleAggregatorInstance: CandleAggregator | null = null

export function getCandleAggregator(): CandleAggregator {
  if (!candleAggregatorInstance) {
    candleAggregatorInstance = new CandleAggregator()
  }
  return candleAggregatorInstance
}

export function createCandleAggregator(): CandleAggregator {
  candleAggregatorInstance = new CandleAggregator()
  return candleAggregatorInstance
}
