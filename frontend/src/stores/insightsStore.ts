/**
 * Insights Store
 * 
 * Manages AI-generated market insights and user's tracked coins for insights.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Version for migration - increment this to reset persisted state
const STORE_VERSION = 3

// Default tracked coins - same 20 coins as Investing view
const VALID_COINS = new Set([
  'BTC', 'ETH', 'SOL', 'ADA', 'DOGE', 'XRP', 'DOT', 'AVAX', 'POL', 'LINK',
  'UNI', 'ATOM', 'LTC', 'BCH', 'ALGO', 'XLM', 'AAVE', 'NEAR', 'APT', 'ARB'
])

export interface MarketInsight {
  id: string
  symbol: string
  signal: 'bullish' | 'bearish' | 'neutral'
  confidence: number
  summary: string
  indicators: {
    rsi?: number
    rsiSignal?: 'overbought' | 'oversold' | 'neutral'
    volumeChange?: number
    volatility?: number
    smaSignal?: 'golden_cross' | 'death_cross' | null
    macd?: {
      line: number
      signal: number
      histogram: number
      trend: 'bullish' | 'bearish' | 'neutral'
    }
    bollingerBands?: {
      upper: number
      middle: number
      lower: number
      percentB: number
      signal: 'overbought' | 'oversold' | 'neutral'
    }
    momentum?: number
    momentumSignal?: 'bullish' | 'bearish' | 'neutral'
    stochastic?: {
      k: number
      signal: 'overbought' | 'oversold' | 'neutral'
    }
    ema12?: number
    ema26?: number
  }
  mlPrediction?: {
    direction: 'up' | 'down' | 'neutral'
    confidence: number
    predictedChange: number
    predictedPrice?: number
    forecast?: number[]
    horizon: string
    modelVersion: string
  }
  timestamp: number
}

export interface ModelInfo {
  version: string
  status: 'loading' | 'ready' | 'fallback' | 'error'
  huggingFaceAvailable: boolean
  huggingFaceModel?: string
}

interface InsightsState {
  // Tracked coins for insights
  trackedCoins: string[]
  
  // Prediction horizon (1, 7, or 30 days)
  horizon: 1 | 7 | 30
  
  // Insights data
  insights: MarketInsight[]
  
  // Model info
  modelInfo: ModelInfo | null
  
  // Loading state
  isLoading: boolean
  lastUpdated: number | null
  error: string | null
  
  // Actions
  addCoin: (symbol: string) => void
  removeCoin: (symbol: string) => void
  setHorizon: (horizon: 1 | 7 | 30) => void
  setInsights: (insights: MarketInsight[]) => void
  setModelInfo: (info: ModelInfo) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  fetchInsights: () => Promise<void>
  fetchInsightForSymbol: (symbol: string) => Promise<MarketInsight | null>
}

// Default tracked coins - derived from VALID_COINS set
const DEFAULT_TRACKED_COINS = Array.from(VALID_COINS)

export const useInsightsStore = create<InsightsState>()(
  persist(
    (set, get) => ({
      trackedCoins: DEFAULT_TRACKED_COINS,
      horizon: 7 as 1 | 7 | 30,
      insights: [],
      modelInfo: null,
      isLoading: false,
      lastUpdated: null,
      error: null,

      setHorizon: (horizon: 1 | 7 | 30) => {
        set({ horizon })
        // Refetch insights with new horizon
        get().fetchInsights()
      },

      addCoin: (symbol: string) => {
        const upperSymbol = symbol.toUpperCase()
        set((state) => {
          if (state.trackedCoins.includes(upperSymbol)) {
            return state
          }
          return { trackedCoins: [...state.trackedCoins, upperSymbol] }
        })
        // Fetch insight for new coin
        get().fetchInsightForSymbol(upperSymbol)
      },

      removeCoin: (symbol: string) => {
        const upperSymbol = symbol.toUpperCase()
        set((state) => ({
          trackedCoins: state.trackedCoins.filter((c) => c !== upperSymbol),
          insights: state.insights.filter((i) => i.symbol !== upperSymbol),
        }))
      },

      setInsights: (insights: MarketInsight[]) => {
        set({ insights, lastUpdated: Date.now(), error: null })
      },

      setModelInfo: (info: ModelInfo) => {
        set({ modelInfo: info })
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },

      setError: (error: string | null) => {
        set({ error, isLoading: false })
      },

      fetchInsights: async () => {
        const { trackedCoins, horizon } = get()
        set({ isLoading: true, error: null })

        try {
          const token = localStorage.getItem('spectra_auth_token')
          if (!token) {
            set({ error: 'Not authenticated', isLoading: false })
            return
          }

          // Use batch endpoint to fetch all insights in a single request
          const response = await fetch(
            `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/insights?horizon=${horizon}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          )

          if (!response.ok) {
            throw new Error('Failed to fetch insights')
          }

          const data = await response.json()
          
          // Filter insights to only include tracked coins
          const allInsights: MarketInsight[] = (data.insights || [])
            .filter((insight: MarketInsight) => trackedCoins.includes(insight.symbol))
            .sort((a: MarketInsight, b: MarketInsight) => b.confidence - a.confidence)

          set({
            insights: allInsights,
            lastUpdated: Date.now(),
            isLoading: false,
            error: null,
          })

          // Also fetch model info from health endpoint
          try {
            const modelResponse = await fetch(
              `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/insights/health`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            )
            if (modelResponse.ok) {
              const healthData = await modelResponse.json()
              set({ 
                modelInfo: {
                  version: 'timesfm-2.5-200m',
                  status: healthData.mlService === 'available' ? 'ready' : 'fallback',
                  huggingFaceAvailable: healthData.mlService === 'available',
                  huggingFaceModel: 'google/timesfm-2.5-200m-pytorch'
                }
              })
            }
          } catch {
            // Model info is optional
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch insights',
            isLoading: false,
          })
        }
      },

      fetchInsightForSymbol: async (symbol: string) => {
        try {
          const token = localStorage.getItem('spectra_auth_token')
          if (!token) return null

          const { horizon } = get()
          const response = await fetch(
            `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/insights/${symbol}?horizon=${horizon}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          )

          if (response.ok) {
            const data = await response.json()
            if (data.insights && data.insights.length > 0) {
              const newInsight = data.insights[0]
              set((state) => {
                // Replace or add insight for this symbol
                const filtered = state.insights.filter((i) => i.symbol !== symbol.toUpperCase())
                return {
                  insights: [...filtered, newInsight].sort((a, b) => b.confidence - a.confidence),
                }
              })
              return newInsight
            }
          }
          return null
        } catch {
          return null
        }
      },
    }),
    {
      name: 'spectra-insights',
      version: STORE_VERSION,
      partialize: (state) => ({
        trackedCoins: state.trackedCoins,
      }),
      // Migration to clean up invalid coins (MATIC, VET, FIL, EOS, etc.)
      migrate: (persistedState: unknown, version: number) => {
        if (version < STORE_VERSION) {
          const state = persistedState as { trackedCoins?: string[] }
          // Filter out any coins that are not in the valid list
          if (state?.trackedCoins) {
            state.trackedCoins = state.trackedCoins.filter(coin => VALID_COINS.has(coin))
            // Ensure all valid coins are present
            VALID_COINS.forEach(coin => {
              if (!state.trackedCoins!.includes(coin)) {
                state.trackedCoins!.push(coin)
              }
            })
          } else {
            state.trackedCoins = Array.from(VALID_COINS)
          }
          return state as InsightsState
        }
        return persistedState as InsightsState
      },
    }
  )
)
