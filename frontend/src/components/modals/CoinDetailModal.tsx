import { motion, AnimatePresence } from 'framer-motion'
import { X, TrendingUp, TrendingDown, Activity, BarChart3, ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMarketStore } from '../../stores/marketStore'
import { formatCurrency, formatNumber, formatPercent } from '../../utils/formatters'

interface CoinDetailModalProps {
  isOpen: boolean
  onClose: () => void
  symbol: string
}

interface TechnicalIndicators {
  rsi?: number
  volatility?: number
  volumeChange?: number
  smaSignal?: 'golden_cross' | 'death_cross' | null
}

interface InsightData {
  symbol: string
  signal: 'bullish' | 'bearish' | 'neutral'
  confidence: number
  summary: string
  indicators: TechnicalIndicators
  timestamp: number
}

export default function CoinDetailModal({ isOpen, onClose, symbol }: CoinDetailModalProps) {
  const navigate = useNavigate()
  const crypto = useMarketStore((state) => state.getCrypto(symbol))
  const [insights, setInsights] = useState<InsightData | null>(null)
  const [isLoadingInsights, setIsLoadingInsights] = useState(false)
  const [insightsError, setInsightsError] = useState<string | null>(null)

  // Fetch technical indicators from backend
  useEffect(() => {
    if (!isOpen || !symbol) return

    const fetchInsights = async () => {
      setIsLoadingInsights(true)
      setInsightsError(null)

      try {
        const token = localStorage.getItem('spectra_auth_token')
        const apiUrl = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3001'
        
        const response = await fetch(`${apiUrl}/api/insights/${symbol}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch insights')
        }

        const data = await response.json()
        setInsights(data)
      } catch (error) {
        console.error('Error fetching insights:', error)
        setInsightsError('Unable to load technical indicators')
      } finally {
        setIsLoadingInsights(false)
      }
    }

    fetchInsights()
  }, [isOpen, symbol])

  // Handle ESC key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleTradeClick = () => {
    navigate(`/dashboard/trading?symbol=${symbol}`)
    onClose()
  }

  if (!crypto) return null

  const getRSIColor = (rsi?: number) => {
    if (!rsi) return 'text-dark-400'
    if (rsi > 70) return 'text-danger-400'
    if (rsi < 30) return 'text-success-400'
    return 'text-warning-400'
  }

  const getRSILabel = (rsi?: number) => {
    if (!rsi) return 'N/A'
    if (rsi > 70) return 'Overbought'
    if (rsi < 30) return 'Oversold'
    return 'Neutral'
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={handleBackdropClick}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-dark-900 rounded-2xl border border-dark-800 shadow-2xl m-4"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-dark-900 border-b border-dark-800 p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-500/10 text-3xl">
                    {crypto.symbol.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white">{crypto.name}</h2>
                    <p className="text-dark-400">{crypto.symbol}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-dark-800 text-dark-400 hover:bg-dark-700 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Price Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl bg-dark-800 p-6">
                  <div className="text-sm text-dark-400 mb-2">Current Price</div>
                  <div className="text-4xl font-bold text-white font-mono mb-2">
                    {formatCurrency(crypto.price)}
                  </div>
                  <div
                    className={`flex items-center gap-2 text-lg font-semibold ${
                      crypto.change24h > 0 ? 'text-success-400' : 'text-danger-400'
                    }`}
                  >
                    {crypto.change24h > 0 ? (
                      <TrendingUp className="h-5 w-5" />
                    ) : (
                      <TrendingDown className="h-5 w-5" />
                    )}
                    {formatPercent(crypto.change24h)} (24h)
                  </div>
                </div>

                <div className="rounded-xl bg-dark-800 p-6 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-dark-400">24h High</span>
                    <span className="text-white font-mono">{formatCurrency(crypto.high24h)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-400">24h Low</span>
                    <span className="text-white font-mono">{formatCurrency(crypto.low24h)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-400">24h Volume</span>
                    <span className="text-white font-mono">{formatNumber(crypto.volume24h)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-400">Market Cap</span>
                    <span className="text-white font-mono">{formatNumber(crypto.marketCap)}</span>
                  </div>
                </div>
              </div>

              {/* Price Chart Placeholder */}
              <div className="rounded-xl bg-dark-800 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="h-5 w-5 text-primary-400" />
                  <h3 className="text-lg font-semibold text-white">24h Price Chart</h3>
                </div>
                <div className="h-64 flex items-center justify-center border border-dark-700 rounded-lg">
                  <div className="text-center">
                    <Activity className="h-12 w-12 text-dark-600 mx-auto mb-2" />
                    <p className="text-dark-400 text-sm">
                      Price chart will be available in task 13.1
                    </p>
                  </div>
                </div>
              </div>

              {/* Technical Indicators */}
              <div className="rounded-xl bg-dark-800 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Technical Indicators</h3>

                {isLoadingInsights && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="rounded-lg bg-dark-900 p-4 animate-pulse">
                        <div className="h-4 bg-dark-800 rounded w-20 mb-2"></div>
                        <div className="h-8 bg-dark-800 rounded w-16 mb-2"></div>
                        <div className="h-3 bg-dark-800 rounded w-24"></div>
                      </div>
                    ))}
                  </div>
                )}

                {insightsError && (
                  <div className="rounded-lg bg-danger-500/10 border border-danger-500/20 p-4 text-center">
                    <p className="text-danger-400">{insightsError}</p>
                  </div>
                )}

                {!isLoadingInsights && !insightsError && insights && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* RSI Indicator */}
                    <div className="rounded-lg bg-dark-900 p-4">
                      <div className="text-sm text-dark-400 mb-2">RSI (14)</div>
                      <div className={`text-3xl font-bold mb-1 ${getRSIColor(insights.indicators.rsi)}`}>
                        {insights.indicators.rsi?.toFixed(1) || 'N/A'}
                      </div>
                      <div className="text-xs text-dark-400">
                        {getRSILabel(insights.indicators.rsi)}
                      </div>
                      {insights.indicators.rsi && (
                        <div className="mt-3 h-2 bg-dark-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              insights.indicators.rsi > 70
                                ? 'bg-danger-500'
                                : insights.indicators.rsi < 30
                                ? 'bg-success-500'
                                : 'bg-warning-500'
                            }`}
                            style={{ width: `${insights.indicators.rsi}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Volatility Indicator */}
                    <div className="rounded-lg bg-dark-900 p-4">
                      <div className="text-sm text-dark-400 mb-2">Volatility</div>
                      <div className="text-3xl font-bold text-white mb-1">
                        {insights.indicators.volatility
                          ? `${insights.indicators.volatility.toFixed(1)}%`
                          : 'N/A'}
                      </div>
                      <div className="text-xs text-dark-400">
                        {insights.indicators.volatility && insights.indicators.volatility > 15
                          ? 'High'
                          : insights.indicators.volatility && insights.indicators.volatility > 8
                          ? 'Moderate'
                          : 'Low'}
                      </div>
                    </div>

                    {/* Volume Indicator */}
                    <div className="rounded-lg bg-dark-900 p-4">
                      <div className="text-sm text-dark-400 mb-2">Volume vs Avg</div>
                      <div
                        className={`text-3xl font-bold mb-1 ${
                          insights.indicators.volumeChange && insights.indicators.volumeChange > 50
                            ? 'text-success-400'
                            : insights.indicators.volumeChange && insights.indicators.volumeChange < -20
                            ? 'text-danger-400'
                            : 'text-white'
                        }`}
                      >
                        {insights.indicators.volumeChange
                          ? formatPercent(insights.indicators.volumeChange, 0, true)
                          : 'N/A'}
                      </div>
                      <div className="text-xs text-dark-400">
                        {insights.indicators.volumeChange && insights.indicators.volumeChange > 150
                          ? 'Spike Detected'
                          : 'Normal'}
                      </div>
                    </div>
                  </div>
                )}

                {!isLoadingInsights && !insightsError && !insights && (
                  <div className="rounded-lg bg-dark-900 p-8 text-center">
                    <Activity className="h-12 w-12 text-dark-600 mx-auto mb-2" />
                    <p className="text-dark-400">No technical indicators available</p>
                  </div>
                )}
              </div>

              {/* AI Insight Summary */}
              {insights && insights.summary && (
                <div
                  className={`rounded-xl p-6 border ${
                    insights.signal === 'bullish'
                      ? 'bg-success-500/10 border-success-500/20'
                      : insights.signal === 'bearish'
                      ? 'bg-danger-500/10 border-danger-500/20'
                      : 'bg-warning-500/10 border-warning-500/20'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        insights.signal === 'bullish'
                          ? 'bg-success-500/20'
                          : insights.signal === 'bearish'
                          ? 'bg-danger-500/20'
                          : 'bg-warning-500/20'
                      }`}
                    >
                      {insights.signal === 'bullish' ? (
                        <TrendingUp
                          className={`h-5 w-5 ${
                            insights.signal === 'bullish' ? 'text-success-400' : ''
                          }`}
                        />
                      ) : insights.signal === 'bearish' ? (
                        <TrendingDown className="h-5 w-5 text-danger-400" />
                      ) : (
                        <Activity className="h-5 w-5 text-warning-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4
                          className={`font-semibold ${
                            insights.signal === 'bullish'
                              ? 'text-success-400'
                              : insights.signal === 'bearish'
                              ? 'text-danger-400'
                              : 'text-warning-400'
                          }`}
                        >
                          {insights.signal === 'bullish'
                            ? 'Bullish Signal'
                            : insights.signal === 'bearish'
                            ? 'Bearish Signal'
                            : 'Neutral Signal'}
                        </h4>
                        <span className="text-xs text-dark-400">
                          Confidence: {insights.confidence}%
                        </span>
                      </div>
                      <p className="text-white text-sm">{insights.summary}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Trade Button */}
              <button
                onClick={handleTradeClick}
                className="w-full flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold py-4 px-6 rounded-xl transition-colors"
              >
                Trade {crypto.symbol}
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
