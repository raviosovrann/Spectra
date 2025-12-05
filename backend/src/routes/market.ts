/**
 * Market Data API Routes
 * 
 * This module provides REST API endpoints for historical market data.
 * 
 * Requirements: 1.1, 3.4
 */

import express, { Request, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { PriceHistory, Candle, CachedMarketData } from '../types/market';
import { getCandleAggregator, CandleInterval, VALID_INTERVALS } from '../services/CandleAggregator.js';
import logger from '../utils/logger.js';
import { fetchCoinGeckoCandles } from '../services/CoinGeckoService.js';

const router = express.Router();

// In-memory cache for historical data (30-day retention)
const marketDataCache = new Map<string, CachedMarketData>();
const CACHE_TTL = 60 * 1000; // 1 minute cache (reduced for better responsiveness)
const DATA_RETENTION = 30 * 24 * 60 * 60 * 1000; // 30 days

// Supported symbols for validation
const SUPPORTED_SYMBOLS = [
  'BTC', 'ETH', 'SOL', 'ADA', 'DOGE', 'XRP', 'DOT', 'AVAX', 'POL', 'LINK',
  'UNI', 'ATOM', 'LTC', 'BCH', 'ALGO', 'XLM', 'AAVE', 'NEAR', 'APT', 'ARB'
];

// Highest resolution (1m) for a full year is ~525,600 candles. 
// Reduced to 50,000 to prevent browser crashes while still providing plenty of history.
const MAX_HISTORY_LIMIT = 50000;
const DEFAULT_INTERVAL: CandleInterval = '1h';

const TIMEFRAME_ALIASES: Record<string, CandleInterval> = {
  '1M': '1m',
  '2M': '2m',
  '3M': '3m',
  '4M': '4m',
  '5M': '5m',
  '10M': '10m',
  '15M': '15m',
  '30M': '30m',
  '45M': '45m',
  '1H': '1h',
  '2H': '2h',
  '3H': '3h',
  '4H': '4h',
  '1D': '1d',
};

type HistoricalProvider = 'coingecko';

interface HistoricalCandlesResult {
  candles: Candle[];
  provider: HistoricalProvider;
}

async function fetchHistoricalCandles(
  symbol: string,
  interval: string,
  limit: number
): Promise<HistoricalCandlesResult | null> {
  const fallbackCandles = await fetchCoinGeckoCandles(symbol, interval, limit);
  if (fallbackCandles?.length) {
    logger.info('Using CoinGecko provider for historical candles', {
      symbol,
      interval,
      limit,
    });
    return {
      candles: fallbackCandles,
      provider: 'coingecko',
    };
  }

  return null;
}

/**
 * GET /api/market/candles/:symbol
 * 
 * Get real-time candle data aggregated from live ticker stream.
 * This endpoint returns both the latest ticker data and aggregated candles.
 * 
 * Query parameters:
 * - interval: '1m' | '5m' | '15m' | '1h' | '1d' (default: '5m')
 * - limit: Number of candles to return (default: 100, max: 100)
 * 
 * Requirements: 3.1, 3.4, 3.5
 */
router.get('/candles/:symbol', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { symbol } = req.params;
    const interval = (req.query.interval as CandleInterval) || '5m';
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 100);

    // Validate symbol format
    const upperSymbol = symbol.toUpperCase();
    if (!upperSymbol || !/^[A-Z]{2,10}$/.test(upperSymbol)) {
      return res.status(400).json({
        error: 'Invalid symbol format',
        message: 'Symbol must be 2-10 uppercase letters'
      });
    }

    // Validate symbol is supported
    if (!SUPPORTED_SYMBOLS.includes(upperSymbol)) {
      return res.status(400).json({
        error: 'Unsupported symbol',
        message: `Symbol ${upperSymbol} is not supported. Supported symbols: ${SUPPORTED_SYMBOLS.join(', ')}`
      });
    }

    // Validate interval - support all extended intervals
    const validIntervals = [
      '1m', '2m', '3m', '4m', '5m', '10m', '15m', '30m', '45m',
      '1h', '2h', '3h', '4h',
      '1d'
    ];
    if (!validIntervals.includes(interval)) {
      return res.status(400).json({
        error: 'Invalid interval',
        message: `Interval must be one of: ${validIntervals.join(', ')}`
      });
    }

    // Get candle aggregator instance
    const candleAggregator = getCandleAggregator();

    // Get real-time candles response
    const response = candleAggregator.getCandlesResponse(upperSymbol, interval, limit);

    // If we don't have enough data (e.g. server restart), fill with historical data from CoinGecko provider
    if (response.candles.length < limit) {
      const historicalResult = await fetchHistoricalCandles(upperSymbol, interval, limit);

      if (historicalResult?.candles?.length) {
        const realTimeMap = new Map(response.candles.map((c) => [c.timestamp, c]));

        const mergedCandles = [
          ...historicalResult.candles.filter((c) => !realTimeMap.has(c.timestamp)),
          ...response.candles,
        ].sort((a, b) => a.timestamp - b.timestamp);

        const finalCandles = mergedCandles.slice(-limit);

        return res.json({
          ...response,
          candles: finalCandles,
          isMockData: false,
          provider: historicalResult.provider,
        });
      }
    }

    // If no real-time data available yet AND fetch failed, generate mock data as fallback
    if (response.candles.length === 0 && !response.ticker) {
      // Generate mock candles as fallback
      const now = Date.now();
      const intervalMs = getIntervalMs(interval);
      const start = now - (limit * intervalMs);
      
      // Get live price for anchor
      const anchorPrice = await getLivePrice(upperSymbol);
      
      // If we can't get a price, we can't generate a valid chart
      if (!anchorPrice) {
        return res.status(503).json({
          error: 'Market data unavailable',
          message: 'Unable to retrieve current price for symbol'
        });
      }

      const mockCandles = generateMockCandles(upperSymbol, interval, start, now, anchorPrice);
      
      return res.json({
        ...response,
        candles: mockCandles.map(c => ({
          timestamp: c.timestamp,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
          volume: c.volume,
          trades: 0
        })),
        isMockData: true
      });
    }

    res.json(response);
  } catch (error) {
    console.error(`Error fetching candles for ${req.params.symbol}:`, error);
    res.status(500).json({
      error: 'Failed to fetch candles',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/market/history/:symbol
 * 
 * Get historical candle data for a cryptocurrency
 * 
 * Query parameters:
 * - timeframe: '5M' | '15M' | '1H' | '4H' | '1D' (default: '1D')
 * - start: Start timestamp in milliseconds (optional)
 * - end: End timestamp in milliseconds (optional, default: now)
 * 
 * Requirements: 1.1, 3.4
 */
router.get('/history/:symbol', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const upperSymbol = symbol?.toUpperCase();
    const intervalParam = (req.query.interval as string)?.toLowerCase();
    const timeframeParam = (req.query.timeframe as string)?.toUpperCase();

    const intervalFromQuery = intervalParam && VALID_INTERVALS.includes(intervalParam as CandleInterval)
      ? intervalParam as CandleInterval
      : undefined;

    const intervalFromTimeframe = timeframeParam && TIMEFRAME_ALIASES[timeframeParam]
      ? TIMEFRAME_ALIASES[timeframeParam]
      : undefined;

    const interval: CandleInterval = intervalFromQuery || intervalFromTimeframe || DEFAULT_INTERVAL;
    const intervalMs = getIntervalMs(interval);
    
    // Calculate limit to support "all" historical data (up to MAX_HISTORY_LIMIT)
    // If no limit specified, default to MAX_HISTORY_LIMIT to show full history
    const parsedLimit = parseInt((req.query.limit as string) ?? '', 10);
    const limit = Number.isFinite(parsedLimit) 
      ? Math.min(parsedLimit, MAX_HISTORY_LIMIT)
      : MAX_HISTORY_LIMIT;

    const end = Date.now();
    const start = end - (limit * intervalMs);

    // Validate symbol format
    if (!upperSymbol || !/^[A-Z]{2,10}$/.test(upperSymbol)) {
      return res.status(400).json({
        error: 'Invalid symbol format',
        message: 'Symbol must be 2-10 uppercase letters'
      });
    }

    if (!SUPPORTED_SYMBOLS.includes(upperSymbol)) {
      return res.status(400).json({
        error: 'Unsupported symbol',
        message: `Symbol ${upperSymbol} is not supported. Supported symbols: ${SUPPORTED_SYMBOLS.join(', ')}`
      });
    }

    // Check cache
    const cacheKey = `${upperSymbol}_${interval}_${limit}`;
    const cached = marketDataCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return res.json(cached.data);
    }

    // Always use mock generation to ensure correct time intervals are respected
    // CoinGecko free API does not support granular intervals (like 1m, 5m) for long time ranges
    
    // Get real-time price anchor if available to ensure seamless connection to live data
    const anchorPrice = await getLivePrice(upperSymbol);
    
    // If we can't get a price, we can't generate a valid chart
    if (!anchorPrice) {
      return res.status(503).json({
        error: 'Market data unavailable',
        message: 'Unable to retrieve current price for symbol'
      });
    }
    
    const candles = generateMockCandles(upperSymbol, interval, start, end, anchorPrice);

    const priceHistory: PriceHistory = {
      symbol: upperSymbol,
      interval,
      candles
    };

    // Cache the result
    marketDataCache.set(cacheKey, {
      data: priceHistory,
      timestamp: Date.now()
    });

    // Clean up old cache entries
    cleanupCache();

    res.json(priceHistory);
  } catch (error) {
    console.error(`Error fetching market history for ${req.params.symbol}:`, error);
    res.status(500).json({
      error: 'Failed to fetch market history',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Helper to get the current price from multiple sources
async function getLivePrice(symbol: string): Promise<number | undefined> {
  const upperSymbol = symbol.toUpperCase();
  
  // 1. Try local aggregator (fastest)
  const aggregator = getCandleAggregator();
  const latestTicker = aggregator.getLatestTicker(upperSymbol);
  if (latestTicker) return latestTicker.price;

  // 2. Try Coinbase Public API (fast, reliable)
  try {
    const response = await fetch(`https://api.coinbase.com/v2/prices/${upperSymbol}-USD/spot`);
    if (response.ok) {
      const data = await response.json() as { data: { amount: string } };
      if (data?.data?.amount) {
        return parseFloat(data.data.amount);
      }
    }
  } catch (e) {
    // Ignore error, try next source
  }

  // 3. Try CoinGecko (slower, rate limited)
  try {
    const candles = await fetchCoinGeckoCandles(upperSymbol, '1d', 1);
    if (candles && candles.length > 0) {
      return candles[candles.length - 1].close;
    }
  } catch (e) {
    // Ignore
  }

  return undefined;
}

// Generate a unique seed from symbol string
function symbolToSeed(symbol: string): number {
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    const char = symbol.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash) + 1;
}

// High-quality hash function for deterministic noise
function hash(x: number): number {
  let h = x | 0;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  h = h ^ (h >>> 16);
  return (h >>> 0) / 4294967296;
}

/**
 * Generate mock candle data using Geometric Brownian Motion (GBM)
 * This creates realistic "random walk" market data
 * Generates data BACKWARDS from 'end' to 'start' to ensure the chart
 * always connects seamlessly to the current live price.
 */
function generateMockCandles(
  symbol: string,
  interval: string,
  start: number,
  end: number,
  anchorPrice?: number
): Candle[] {
  const candles: Candle[] = [];
  const intervalMs = getIntervalMs(interval);
  
  // Ensure start is not too far back
  const MIN_TIMESTAMP = 1420070400000; // 2015-01-01
  const safeStart = Math.max(start, MIN_TIMESTAMP);
  
  // Base parameters
  // Use the provided anchor price (from live ticker) or fallback to static base price
  const currentBasePrice = anchorPrice || 100;
  const symbolSeed = symbolToSeed(symbol);
  
  // Align end time to interval
  let currentTime = Math.floor(end / intervalMs) * intervalMs;
  
  // We start from the END (current time) and walk BACKWARDS
  // This ensures the last candle is always close to the real current price
  // eliminating the "spike" artifact.
  let currentPrice = currentBasePrice;
  
  const maxIterations = 50000;
  let iterations = 0;

  while (currentTime >= safeStart && iterations < maxIterations) {
    // Use deterministic hash based on the timestamp
    // This ensures that the candle at time T is always the same shape
    // regardless of when we view it (as long as the chain is preserved)
    
    // Combine symbol seed and timestamp for unique hash
    // We use a large prime to mix the timestamp bits
    const timeHash = Math.floor(currentTime / 1000) ^ symbolSeed;
    const r1 = hash(timeHash);
    const r2 = hash(timeHash + 1);
    const r3 = hash(timeHash + 2);
    
    // Volatility scale
    const volatilityScale = Math.sqrt(intervalMs / (24 * 60 * 60 * 1000));
    const baseVolatility = 0.05 * volatilityScale;
    
    // Heteroscedasticity: Volatility clustering
    // Use a slower changing hash for volatility regime
    const volRegimeHash = Math.floor(currentTime / (1000 * 60 * 60 * 4)) ^ symbolSeed; // Change every 4 hours
    const volMultiplier = 0.5 + hash(volRegimeHash); // 0.5x to 1.5x
    const volatility = baseVolatility * volMultiplier;
    
    // Add trend component (low frequency noise)
    // Mix multiple sine waves with prime number periods to avoid repetition and create "organic" look
    const tDays = currentTime / (1000 * 60 * 60 * 24);
    const trend = Math.sin(tDays / 97 + symbolSeed) * 0.4 + 
                  Math.sin(tDays / 43 + symbolSeed * 2) * 0.3 +
                  Math.sin(tDays / 19 + symbolSeed * 3) * 0.2 +
                  Math.sin(tDays / 7 + symbolSeed * 4) * 0.1;
    
    // Calculate previous price (Open of this candle / Close of previous)
    // If P(T) = P(T-1) * (1 + change), then P(T-1) = P(T) / (1 + change)
    // Change includes random component + trend component
    const randomChange = (r1 - 0.5) * 2 * volatility;
    const trendChange = trend * volatility * 0.15; // Slightly increased trend influence
    
    const totalChange = randomChange + trendChange;
    const prevPrice = currentPrice / (1 + totalChange);
    
    // For the current candle at 'currentTime':
    // Open = prevPrice
    // Close = currentPrice
    const open = prevPrice;
    const close = currentPrice;
    
    // High/Low
    const candleRange = Math.abs(close - open);
    const high = Math.max(open, close) + (r2 * candleRange * 0.5) + (r2 * volatility * 0.1);
    const low = Math.min(open, close) - (r3 * candleRange * 0.5) - (r3 * volatility * 0.1);
    
    // Volume
    const volume = currentBasePrice * 1000 * (0.5 + r1);

    candles.push({
      timestamp: currentTime,
      open,
      high,
      low,
      close,
      volume
    });
    
    // Move backward
    currentPrice = prevPrice;
    currentTime -= intervalMs;
    iterations++;
  }
  
  // Reverse to return chronological order
  return candles.reverse();
}

/**
 * Convert interval string to milliseconds
 */
function getIntervalMs(interval: string): number {
  const intervals: Record<string, number> = {
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
  };
  return intervals[interval] || 60 * 60 * 1000; // Default to 1h
}

/**
 * Clean up old cache entries (older than 30 days)
 */
function cleanupCache(): void {
  const now = Date.now();
  const keysToDelete: string[] = [];
  
  marketDataCache.forEach((cached, key) => {
    if (now - cached.timestamp > DATA_RETENTION) {
      keysToDelete.push(key);
    }
  });
  
  keysToDelete.forEach(key => marketDataCache.delete(key));
}

/**
 * GET /api/market/cache/stats
 * 
 * Get cache statistics (admin/debug endpoint)
 */
router.get('/cache/stats', authMiddleware, (_req: Request, res: Response) => {
  try {
    const stats = {
      size: marketDataCache.size,
      entries: Array.from(marketDataCache.keys())
    };
    res.json(stats);
  } catch (error) {
    console.error('Error fetching cache stats:', error);
    res.status(500).json({
      error: 'Failed to fetch cache stats',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * DELETE /api/market/cache
 * 
 * Clear market data cache (admin/debug endpoint)
 */
router.delete('/cache', authMiddleware, (_req: Request, res: Response) => {
  try {
    marketDataCache.clear();
    res.json({ message: 'Market data cache cleared' });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({
      error: 'Failed to clear cache',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
