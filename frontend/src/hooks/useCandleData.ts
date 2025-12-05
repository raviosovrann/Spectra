import { useState, useEffect, useCallback, useRef } from 'react'

export interface CandleData {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export type CandleTimeframe = 
  | '1M' | '2M' | '3M' | '4M' | '5M' | '10M' | '15M' | '30M' | '45M'
  | '1H' | '2H' | '3H' | '4H'
  | '1D'

interface UseCandleDataOptions {
  symbol: string
  timeframe?: CandleTimeframe
  enabled?: boolean
}

interface UseCandleDataReturn {
  candles: CandleData[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

/**
 * Hook for fetching fixed historical candle data for a symbol
 * Implements request cancellation to prevent race conditions when rapidly changing symbols
 */
export function useCandleData({
  symbol,
  timeframe = '1D',
  enabled = true,
}: UseCandleDataOptions): UseCandleDataReturn {
  const [candles, setCandles] = useState<CandleData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const abortControllerRef = useRef<AbortController | null>(null)
  const currentRequestRef = useRef<{ symbol: string; timeframe: CandleTimeframe } | null>(null)

  // Reset state when symbol changes
  useEffect(() => {
    setCandles([])
  }, [symbol, timeframe])

  const fetchCandles = useCallback(async () => {
    if (!enabled || !symbol) return

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController()
    currentRequestRef.current = { symbol, timeframe }

    setIsLoading(true)
    setError(null)

    try {
      const url = new URL(`${API_URL}/api/market/history/${symbol}`)
      url.searchParams.set('timeframe', timeframe)
      const response = await fetch(
        url.toString(),
        {
          credentials: 'include',
          signal: abortControllerRef.current.signal,
        }
      )

      // Check if this request is still relevant
      if (
        currentRequestRef.current?.symbol !== symbol ||
        currentRequestRef.current?.timeframe !== timeframe
      ) {
        return // Stale request, ignore
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      
      // Final check before updating state
      if (
        currentRequestRef.current?.symbol === symbol &&
        currentRequestRef.current?.timeframe === timeframe
      ) {
        setCandles(data.candles || [])
        setError(null)
      }
    } catch (err) {
      // Ignore abort errors
      if (err instanceof Error && err.name === 'AbortError') {
        return
      }

      // Only set error if this is still the current request
      if (
        currentRequestRef.current?.symbol === symbol &&
        currentRequestRef.current?.timeframe === timeframe
      ) {
        setError(err instanceof Error ? err.message : 'Failed to fetch candles')
        setCandles([])
      }
    } finally {
      // Only update loading state if this is still the current request
      if (
        currentRequestRef.current?.symbol === symbol &&
        currentRequestRef.current?.timeframe === timeframe
      ) {
        setIsLoading(false)
      }
    }
  }, [symbol, timeframe, enabled])

  // Fetch on mount and when symbol changes
  useEffect(() => {
    // Clear candles immediately when symbol changes
    setCandles([])
    setError(null)
    
    fetchCandles()

    return () => {
      // Cancel request on cleanup
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [symbol, timeframe, fetchCandles])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    candles,
    isLoading,
    error,
    refetch: fetchCandles,
  }
}
