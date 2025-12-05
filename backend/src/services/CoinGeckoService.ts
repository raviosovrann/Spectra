import logger from '../utils/logger.js'
import type { Candle } from '../types/market'

const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3'

const COINGECKO_ID_MAP: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  ADA: 'cardano',
  DOGE: 'dogecoin',
  XRP: 'ripple',
  DOT: 'polkadot',
  AVAX: 'avalanche-2',
  POL: 'polygon-ecosystem-token',
  LINK: 'chainlink',
  UNI: 'uniswap',
  ATOM: 'cosmos',
  LTC: 'litecoin',
  BCH: 'bitcoin-cash',
  ALGO: 'algorand',
  XLM: 'stellar',
  AAVE: 'aave',
  NEAR: 'near',
  APT: 'aptos',
  ARB: 'arbitrum'
}

const DAY_OPTIONS = [1, 7, 14, 30, 90, 180, 365]

function getIntervalMs(interval: string): number {
  const map: Record<string, number> = {
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
    '1d': 24 * 60 * 60 * 1000
  }
  return map[interval] ?? 60 * 60 * 1000
}

function chooseCoinGeckoDays(interval: string, limit: number): number | 'max' {
  const intervalMs = getIntervalMs(interval)
  const totalDays = (intervalMs * limit) / (24 * 60 * 60 * 1000)
  for (const option of DAY_OPTIONS) {
    if (totalDays <= option) {
      return option
    }
  }
  return 'max'
}

export async function fetchCoinGeckoCandles(
  symbol: string,
  interval: string,
  limit: number
): Promise<Candle[] | null> {
  const coinId = COINGECKO_ID_MAP[symbol]
  if (!coinId) {
    logger.warn('CoinGecko fallback: unsupported symbol', { symbol })
    return null
  }

  const daysParam = chooseCoinGeckoDays(interval, limit)
  const url = `${COINGECKO_BASE_URL}/coins/${coinId}/ohlc?vs_currency=usd&days=${daysParam}`

  try {
    const response = await fetch(url)
    if (!response.ok) {
      logger.warn('CoinGecko fallback failed', { symbol, status: response.status })
      return null
    }

    const data = (await response.json()) as Array<[number, number, number, number, number]>
    if (!Array.isArray(data) || data.length === 0) {
      return null
    }

    const intervalMs = getIntervalMs(interval)
    const now = Date.now()
    const startThreshold = now - intervalMs * (limit + 5)

    const candles: Candle[] = data
      .map((row) => ({
        timestamp: row[0],
        open: row[1],
        high: row[2],
        low: row[3],
        close: row[4],
        volume: 0,
      }))
      .filter((candle) => candle.timestamp >= startThreshold)
      .sort((a, b) => a.timestamp - b.timestamp)

    if (candles.length === 0) {
      return null
    }

    return candles.slice(-limit)
  } catch (error) {
    logger.error('CoinGecko fallback error', {
      symbol,
      error: error instanceof Error ? error.message : String(error),
    })
    return null
  }
}
