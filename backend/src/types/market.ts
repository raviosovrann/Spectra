/**
 * Market Data Type Definitions
 * 
 * This module defines types for market data and historical price information.
 */

/**
 * OHLCV candle data
 */
export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Price history with candles
 */
export interface PriceHistory {
  symbol: string;
  interval: '1m' | '5m' | '15m' | '1h' | '1d';
  candles: Candle[];
}

/**
 * Market data cache entry
 */
export interface CachedMarketData {
  data: PriceHistory;
  timestamp: number;
}
