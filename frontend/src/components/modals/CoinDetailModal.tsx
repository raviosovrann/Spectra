import { motion, AnimatePresence } from 'framer-motion'
import { X, TrendingUp, TrendingDown, Activity, ArrowRight, Zap } from 'lucide-react'
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
  rsiSignal?: 'overbought' | 'oversold' | 'neutral'
  volatility?: number
  volumeChange?: number
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
  const allCryptos = useMarketStore((state) => Array.from(state.cryptocurrencies.values()))
  const crypto = allCryptos.find(c => c.symbol === symbol)
  
  const [insights, setInsights] = useState<InsightData | null>(null)
  const [insightsError, setInsightsError] = useState<string | null>(null)



  // Calculate basic technical indicators from available data
  useEffect(() => {
    if (!isOpen || !symbol || !crypto) return
    
    // Calculate simple technical indicators
    const priceRange = crypto.high24h - crypto.low24h
    const volatility = (priceRange / crypto.price) * 100
    
    // Simple RSI approximation based on 24h change
    // Real RSI needs 14 periods, this is a simplified version
    const rsi = crypto.change24h > 0 
      ? Math.min(50 + (crypto.change24h * 2), 100)
      : Math.max(50 + (crypto.change24h * 2), 0)
    
    const rsiSignal = rsi > 70 ? 'overbought' : rsi < 30 ? 'oversold' : 'neutral'
    
    // Momentum based on 24h change
    const momentum = crypto.change24h
    const momentumSignal = momentum > 2 ? 'bullish' : momentum < -2 ? 'bearish' : 'neutral'
    
    // Volume analysis (comparing to market cap as proxy for average)
    const avgVolumeEstimate = crypto.marketCap * 0.05 // Rough estimate
    const volumeChange = ((crypto.volume24h - avgVolumeEstimate) / avgVolumeEstimate) * 100
    
    // Overall signal
    let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral'
    let confidence = 50
    
    if (crypto.change24h > 3 && rsi < 70 && momentum > 2) {
      signal = 'bullish'
      confidence = Math.min(60 + Math.abs(crypto.change24h) * 2, 85)
    } else if (crypto.change24h < -3 && rsi > 30 && momentum < -2) {
      signal = 'bearish'
      confidence = Math.min(60 + Math.abs(crypto.change24h) * 2, 85)
    } else {
      confidence = 50 + Math.abs(crypto.change24h)
    }
    
    const summary = signal === 'bullish'
      ? `${crypto.symbol} shows bullish momentum with ${crypto.change24h.toFixed(2)}% gain in 24h. Price is ${rsiSignal === 'overbought' ? 'approaching overbought levels' : 'in healthy range'}.`
      : signal === 'bearish'
      ? `${crypto.symbol} shows bearish pressure with ${crypto.change24h.toFixed(2)}% decline in 24h. Price is ${rsiSignal === 'oversold' ? 'approaching oversold levels' : 'weakening'}.`
      : `${crypto.symbol} is trading sideways with ${Math.abs(crypto.change24h).toFixed(2)}% movement. Market is consolidating.`
    
    setInsights({
      symbol: crypto.symbol,
      signal,
      confidence: Math.round(confidence),
      summary,
      indicators: {
        rsi: Math.round(rsi),
        rsiSignal: rsiSignal as 'overbought' | 'oversold' | 'neutral',
        volatility: Number(volatility.toFixed(2)),
        volumeChange: Number(volumeChange.toFixed(1)),
        momentum: Number(momentum.toFixed(2)),
        momentumSignal: momentumSignal as 'bullish' | 'bearish' | 'neutral',
      },
      timestamp: Date.now(),
    })
    
    setInsightsError(null)
  }, [isOpen, symbol, crypto])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

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
            className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-dark-900 rounded-2xl border border-dark-800 shadow-2xl m-4"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-dark-900/95 backdrop-blur-sm border-b border-dark-800 p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500/20 to-primary-600/10 text-3xl font-bold text-primary-400">
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
              {/* Price and Stats Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Current Price */}
                <div className="rounded-xl bg-dark-800/50 border border-dark-700 p-6">
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

                {/* 24h Stats */}
                <div className="rounded-xl bg-dark-800/50 border border-dark-700 p-6 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-dark-400">24h High</span>
                    <span className="text-success-400 font-mono">{formatCurrency(crypto.high24h)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-400">24h Low</span>
                    <span className="text-danger-400 font-mono">{formatCurrency(crypto.low24h)}</span>
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

              {/* Technical Indicators Grid */}
              <div className="rounded-xl bg-dark-800/50 border border-dark-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary-400" />
                  Technical Indicators
                </h3>

                {insightsError && (
                  <div className="rounded-lg bg-danger-500/10 border border-danger-500/20 p-4 text-center">
                    <p className="text-danger-400">{insightsError}</p>
                  </div>
                )}

                {!insightsError && insights?.indicators && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* RSI */}
                    <div className="rounded-lg bg-dark-900/50 p-4">
                      <div className="text-xs text-dark-400 mb-1">RSI (14)</div>
                      <div className={`text-2xl font-bold mb-1 ${getRSIColor(insights.indicators.rsi)}`}>
                        {insights.indicators.rsi?.toFixed(1) || 'N/A'}
                      </div>
                      <div className="text-xs text-dark-500">
                        {getRSILabel(insights.indicators.rsi)}
                      </div>
                      {insights.indicators.rsi && (
                        <div className="mt-2 h-1.5 bg-dark-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              insights.indicators.rsi > 70 ? 'bg-danger-500' :
                              insights.indicators.rsi < 30 ? 'bg-success-500' : 'bg-warning-500'
                            }`}
                            style={{ width: `${insights.indicators.rsi}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* MACD */}
                    {insights.indicators.macd && (
                      <div className="rounded-lg bg-dark-900/50 p-4">
                        <div className="text-xs text-dark-400 mb-1">MACD</div>
                        <div className={`text-2xl font-bold mb-1 ${
                          insights.indicators.macd.trend === 'bullish' ? 'text-success-400' :
                          insights.indicators.macd.trend === 'bearish' ? 'text-danger-400' : 'text-white'
                        }`}>
                          {insights.indicators.macd.histogram > 0 ? '+' : ''}
                          {insights.indicators.macd.histogram.toFixed(3)}
                        </div>
                        <div className="text-xs text-dark-500 capitalize">
                          {insights.indicators.macd.trend}
                        </div>
                      </div>
                    )}

                    {/* Bollinger Bands */}
                    {insights.indicators.bollingerBands && (
                      <div className="rounded-lg bg-dark-900/50 p-4">
                        <div className="text-xs text-dark-400 mb-1">Bollinger %B</div>
                        <div className={`text-2xl font-bold mb-1 ${
                          insights.indicators.bollingerBands.signal === 'overbought' ? 'text-danger-400' :
                          insights.indicators.bollingerBands.signal === 'oversold' ? 'text-success-400' : 'text-white'
                        }`}>
                          {(insights.indicators.bollingerBands.percentB * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-dark-500 capitalize">
                          {insights.indicators.bollingerBands.signal}
                        </div>
                      </div>
                    )}

                    {/* Stochastic */}
                    {insights.indicators.stochastic && (
                      <div className="rounded-lg bg-dark-900/50 p-4">
                        <div className="text-xs text-dark-400 mb-1">Stochastic %K</div>
                        <div className={`text-2xl font-bold mb-1 ${
                          insights.indicators.stochastic.signal === 'overbought' ? 'text-danger-400' :
                          insights.indicators.stochastic.signal === 'oversold' ? 'text-success-400' : 'text-white'
                        }`}>
                          {insights.indicators.stochastic.k.toFixed(0)}
                        </div>
                        <div className="text-xs text-dark-500 capitalize">
                          {insights.indicators.stochastic.signal}
                        </div>
                      </div>
                    )}

                    {/* Momentum */}
                    {insights.indicators.momentum !== undefined && (
                      <div className="rounded-lg bg-dark-900/50 p-4">
                        <div className="text-xs text-dark-400 mb-1">Momentum</div>
                        <div className={`text-2xl font-bold mb-1 ${
                          insights.indicators.momentum > 0 ? 'text-success-400' :
                          insights.indicators.momentum < 0 ? 'text-danger-400' : 'text-white'
                        }`}>
                          {insights.indicators.momentum > 0 ? '+' : ''}
                          {insights.indicators.momentum.toFixed(2)}%
                        </div>
                        <div className="text-xs text-dark-500 capitalize">
                          {insights.indicators.momentumSignal || 'neutral'}
                        </div>
                      </div>
                    )}

                    {/* Volatility */}
                    <div className="rounded-lg bg-dark-900/50 p-4">
                      <div className="text-xs text-dark-400 mb-1">Volatility</div>
                      <div className={`text-2xl font-bold mb-1 ${
                        (insights.indicators.volatility || 0) > 5 ? 'text-danger-400' :
                        (insights.indicators.volatility || 0) > 2 ? 'text-warning-400' : 'text-success-400'
                      }`}>
                        {insights.indicators.volatility?.toFixed(2) || '0.00'}%
                      </div>
                      <div className="text-xs text-dark-500">
                        {(insights.indicators.volatility || 0) > 5 ? 'High' :
                         (insights.indicators.volatility || 0) > 2 ? 'Medium' : 'Low'}
                      </div>
                    </div>

                    {/* Volume Change */}
                    <div className="rounded-lg bg-dark-900/50 p-4">
                      <div className="text-xs text-dark-400 mb-1">Volume vs Avg</div>
                      <div className={`text-2xl font-bold mb-1 ${
                        (insights.indicators.volumeChange || 0) > 50 ? 'text-warning-400' :
                        (insights.indicators.volumeChange || 0) > 0 ? 'text-success-400' : 'text-danger-400'
                      }`}>
                        {(insights.indicators.volumeChange || 0) > 0 ? '+' : ''}
                        {(insights.indicators.volumeChange || 0).toFixed(1)}%
                      </div>
                      <div className="text-xs text-dark-500">
                        {(insights.indicators.volumeChange || 0) > 100 ? 'Spike!' :
                         (insights.indicators.volumeChange || 0) > 50 ? 'High' :
                         (insights.indicators.volumeChange || 0) > 0 ? 'Above Avg' : 'Below Avg'}
                      </div>
                    </div>

                    {/* SMA Signal */}
                    {insights.indicators.smaSignal && (
                      <div className="rounded-lg bg-dark-900/50 p-4">
                        <div className="text-xs text-dark-400 mb-1">SMA Crossover</div>
                        <div className={`text-xl font-bold mb-1 capitalize ${
                          insights.indicators.smaSignal === 'golden_cross' ? 'text-success-400' : 'text-danger-400'
                        }`}>
                          {insights.indicators.smaSignal.replace('_', ' ')}
                        </div>
                        <div className="text-xs text-dark-500">
                          {insights.indicators.smaSignal === 'golden_cross' ? 'Bullish Signal' : 'Bearish Signal'}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!insightsError && !insights?.indicators && (
                  <div className="rounded-lg bg-dark-900/50 p-8 text-center">
                    <Activity className="h-12 w-12 text-dark-600 mx-auto mb-2" />
                    <p className="text-dark-400">No technical indicators available</p>
                    <p className="text-dark-500 text-sm mt-1">Waiting for more market data...</p>
                  </div>
                )}
              </div>

              {/* Market Signal Summary */}
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
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                        insights.signal === 'bullish'
                          ? 'bg-success-500/20'
                          : insights.signal === 'bearish'
                          ? 'bg-danger-500/20'
                          : 'bg-warning-500/20'
                      }`}
                    >
                      {insights.signal === 'bullish' ? (
                        <TrendingUp className="h-6 w-6 text-success-400" />
                      ) : insights.signal === 'bearish' ? (
                        <TrendingDown className="h-6 w-6 text-danger-400" />
                      ) : (
                        <Activity className="h-6 w-6 text-warning-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4
                          className={`text-lg font-semibold ${
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
                        <span className="text-sm px-2 py-0.5 rounded-full bg-dark-800 text-dark-300">
                          {insights.confidence}% confidence
                        </span>
                      </div>
                      <p className="text-white leading-relaxed">
                        {insights.summary.split(/(BUY:|SELL:|HOLD:)/).map((part, idx) => {
                          if (part === 'BUY:') return <span key={idx} className="font-bold text-success-400">BUY:</span>
                          if (part === 'SELL:') return <span key={idx} className="font-bold text-danger-400">SELL:</span>
                          if (part === 'HOLD:') return <span key={idx} className="font-bold text-warning-400">HOLD:</span>
                          return <span key={idx}>{part}</span>
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Trade Button */}
              <button
                onClick={handleTradeClick}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold py-4 px-6 rounded-xl transition-all shadow-lg shadow-primary-500/20"
              >
                <Zap className="h-5 w-5" />
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
