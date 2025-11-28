/**
 * Market Data API Routes
 * 
 * This module provides REST API endpoints for historical market data.
 * 
 * Requirements: 1.1, 3.4
 */

import express, { Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { PriceHistory, Candle, CachedMarketData } from '../types/market';

const router = express.Router();

// In-memory cache for historical data (30-day retention)
const marketDataCache = new Map<string, CachedMarketData>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache
const DATA_RETENTION = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * GET /api/market/history/:symbol
 * 
 * Get historical candle data for a cryptocurrency
 * 
 * Query parameters:
 * - interval: '1m' | '5m' | '15m' | '1h' | '1d' (default: '1h')
 * - start: Start timestamp in milliseconds (optional)
 * - end: End timestamp in milliseconds (optional, default: now)
 * 
 * Requirements: 1.1, 3.4
 */
router.get('/history/:symbol', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const interval = (req.query.interval as string) || '1h';
    const end = req.query.end ? parseInt(req.query.end as string) : Date.now();
    const start = req.query.start ? parseInt(req.query.start as string) : end - (24 * 60 * 60 * 1000); // Default: 24h ago

    // Validate symbol format
    if (!symbol || !/^[A-Z]{2,10}$/.test(symbol.toUpperCase())) {
      return res.status(400).json({
        error: 'Invalid symbol format',
        message: 'Symbol must be 2-10 uppercase letters'
      });
    }

    // Validate interval
    const validIntervals = ['1m', '5m', '15m', '1h', '1d'];
    if (!validIntervals.includes(interval)) {
      return res.status(400).json({
        error: 'Invalid interval',
        message: `Interval must be one of: ${validIntervals.join(', ')}`
      });
    }

    // Validate timestamps
    if (isNaN(start) || isNaN(end)) {
      return res.status(400).json({
        error: 'Invalid timestamps',
        message: 'Start and end must be valid timestamps in milliseconds'
      });
    }

    if (start >= end) {
      return res.status(400).json({
        error: 'Invalid time range',
        message: 'Start time must be before end time'
      });
    }

    // Check cache
    const cacheKey = `${symbol.toUpperCase()}_${interval}_${start}_${end}`;
    const cached = marketDataCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return res.json(cached.data);
    }

    // In a real implementation, this would fetch data from Coinbase API or database
    // For now, generate mock candle data
    const candles = generateMockCandles(symbol.toUpperCase(), interval, start, end);

    const priceHistory: PriceHistory = {
      symbol: symbol.toUpperCase(),
      interval: interval as '1m' | '5m' | '15m' | '1h' | '1d',
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

/**
 * Generate mock candle data for demonstration
 * In production, this would fetch real data from Coinbase API
 */
function generateMockCandles(
  symbol: string,
  interval: string,
  start: number,
  end: number
): Candle[] {
  const candles: Candle[] = [];
  
  // Calculate interval duration in milliseconds
  const intervalMs = getIntervalMs(interval);
  
  // Generate base price based on symbol
  let basePrice = 50000; // Default for BTC
  if (symbol === 'ETH') basePrice = 3000;
  else if (symbol === 'SOL') basePrice = 100;
  else if (symbol === 'ADA') basePrice = 0.5;
  
  let currentTime = start;
  let currentPrice = basePrice;
  
  while (currentTime < end) {
    // Generate realistic OHLCV data
    const volatility = basePrice * 0.02; // 2% volatility
    const open = currentPrice;
    const change = (Math.random() - 0.5) * volatility;
    const close = open + change;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    const volume = Math.random() * 1000000 + 500000;
    
    candles.push({
      timestamp: currentTime,
      open,
      high,
      low,
      close,
      volume
    });
    
    currentPrice = close;
    currentTime += intervalMs;
  }
  
  return candles;
}

/**
 * Convert interval string to milliseconds
 */
function getIntervalMs(interval: string): number {
  switch (interval) {
    case '1m': return 60 * 1000;
    case '5m': return 5 * 60 * 1000;
    case '15m': return 15 * 60 * 1000;
    case '1h': return 60 * 60 * 1000;
    case '1d': return 24 * 60 * 60 * 1000;
    default: return 60 * 60 * 1000; // Default to 1h
  }
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
