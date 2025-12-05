/**
 * useInstrumentData Hook
 * 
 * Custom React hook for fetching real-time data for a single cryptocurrency instrument.
 * Polls the backend API at regular intervals (default: 5 seconds) for dedicated
 * instrument data, separate from the batch WebSocket updates used by InvestingView.
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */

import { useState, useEffect, useCallback, useRef } from 'react'

// API base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// Retry configuration
const MAX_RETRIES = 3
const RETRY_DELAYS = [1000, 2000, 4000] // Exponential backoff

export type CandleInterval = '1m' | '5m' | '15m' | '1h' | '1d'

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

export interface CandleData {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
  trades?: number
}

export interface UseInstrumentDataOptions {
  symbol: string
  interval?: CandleInterval
  pollInterval?: number // Default: 5000ms (5 seconds)
  enabled?: boolean
}

export interface UseInstrumentDataReturn {
  ticker: TickerData | null
  candles: CandleData[]
  isLoading: boolean
  error: string | null
  lastUpdate: number
  refetch: () => Promise<void>
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Fetch with retry logic and exponential backoff
 */
async function fetchWithRetry(url: string, retries = 0): Promise<Response> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout
    
    const response = await fetch(url, {
      credentials: 'include',
      signal: controller.signal,
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    return response
  } catch (error) {
    if (retries < MAX_RETRIES) {
      await sleep(RETRY_DELAYS[retries])
      return fetchWithRetry(url, retries + 1)
    }
    throw error
  }
}

/**
 * Custom hook for fetching real-time instrument data
 */
export function useInstrumentData(options: UseInstrumentDataOptions): UseInstrumentDataReturn {
  const {
    symbol,
    interval = '5m',
    pollInterval = 5000,
    enabled = true,
  } = options

  const [ticker, setTicker] = useState<TickerData | null>(null)
  const [candles, setCandles] = useState<CandleData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState(0)

  // Refs for cleanup and preventing stale closures
  const isMountedRef = useRef(true)
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const currentSymbolRef = useRef(symbol)
  const currentIntervalRef = useRef(interval)

  // Update refs when props change
  useEffect(() => {
    currentSymbolRef.current = symbol
    currentIntervalRef.current = interval
  }, [symbol, interval])

  /**
   * Fetch data from the API
   */
  const fetchData = useCallback(async () => {
    if (!enabled || !symbol) return

    // Don't set loading on subsequent fetches to prevent flickering
    const isInitialFetch = candles.length === 0

    if (isInitialFetch) {
      setIsLoading(true)
    }

    try {
      const url = `${API_URL}/api/market/candles/${symbol.toUpperCase()}?interval=${interval}&limit=100`
      const response = await fetchWithRetry(url)
      const data = await response.json()

      // Check if component is still mounted and symbol hasn't changed
      if (!isMountedRef.current || currentSymbolRef.current !== symbol) {
        return
      }

      // Update state with new data
      if (data.ticker) {
        setTicker(data.ticker)
      }

      if (data.candles && Array.isArray(data.candles)) {
        setCandles(data.candles)
      }

      setLastUpdate(Date.now())
      setError(null)
    } catch (err) {
      // Only update error if component is still mounted
      if (isMountedRef.current && currentSymbolRef.current === symbol) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data'
        setError(errorMessage)
        console.error(`Error fetching instrument data for ${symbol}:`, err)
      }
    } finally {
      if (isMountedRef.current && currentSymbolRef.current === symbol) {
        setIsLoading(false)
      }
    }
  }, [symbol, interval, enabled, candles.length])

  /**
   * Manual refetch function
   */
  const refetch = useCallback(async () => {
    await fetchData()
  }, [fetchData])

  /**
   * Set up polling
   */
  useEffect(() => {
    isMountedRef.current = true

    // Clear any existing timeout
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current)
      pollTimeoutRef.current = null
    }

    if (!enabled || !symbol) {
      setIsLoading(false)
      return
    }

    // Reset state when symbol changes
    setCandles([])
    setTicker(null)
    setError(null)
    setIsLoading(true)

    // Initial fetch
    fetchData()

    // Set up polling interval
    const poll = () => {
      pollTimeoutRef.current = setTimeout(async () => {
        if (isMountedRef.current && enabled) {
          await fetchData()
          poll() // Schedule next poll
        }
      }, pollInterval)
    }

    poll()

    // Cleanup
    return () => {
      isMountedRef.current = false
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current)
        pollTimeoutRef.current = null
      }
    }
  }, [symbol, interval, pollInterval, enabled]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    ticker,
    candles,
    isLoading,
    error,
    lastUpdate,
    refetch,
  }
}
