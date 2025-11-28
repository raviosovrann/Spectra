import { motion, AnimatePresence } from 'framer-motion'
import { X, TrendingUp, TrendingDown, Activity, ArrowRight, Brain, Zap, BarChart3, Fish } from 'lucide-react'
import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMarketStore } from '../../stores/marketStore'
import { formatCurrency, formatNumber, formatPercent } from '../../utils/formatters'
import Loader from '../Loader'

// Time range options like Robinhood
type TimeRange = '1D' | '1W' | '1M' | '3M' | 'YTD' | '1Y' | '5Y' | 'MAX'

interface TimeRangeConfig {
  label: string
  interval: string
  duration: number // in milliseconds
}

const TIME_RANGES: Record<TimeRange, TimeRangeConfig> = {
  '1D': { label: '1D', interval: '5m', duration: 24 * 60 * 60 * 1000 },
  '1W': { label: '1W', interval: '1h', duration: 7 * 24 * 60 * 60 * 1000 },
  '1M': { label: '1M', interval: '1h', duration: 30 * 24 * 60 * 60 * 1000 },
  '3M': { label: '3M', interval: '1d', duration: 90 * 24 * 60 * 60 * 1000 },
  'YTD': { label: 'YTD', interval: '1d', duration: getYTDDuration() },
  '1Y': { label: '1Y', interval: '1d', duration: 365 * 24 * 60 * 60 * 1000 },
  '5Y': { label: '5Y', interval: '1d', duration: 5 * 365 * 24 * 60 * 60 * 1000 },
  'MAX': { label: 'MAX', interval: '1d', duration: 10 * 365 * 24 * 60 * 60 * 1000 },
}

function getYTDDuration(): number {
  const now = new Date()
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  return now.getTime() - startOfYear.getTime()
}

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

interface MLPrediction {
  direction: 'up' | 'down' | 'neutral'
  confidence: number
  predictedChange: number
  predictedPrice?: number
  forecast?: number[]
  horizon: string
  modelVersion: string
}

interface WhaleActivity {
  recentBuys: number
  recentSells: number
  netFlow: 'bullish' | 'bearish' | 'neutral'
  largestTrade?: {
    side: 'buy' | 'sell'
    usdValue: number
    timestamp: number
  }
}

interface InsightData {
  symbol: string
  signal: 'bullish' | 'bearish' | 'neutral'
  confidence: number
  summary: string
  indicators: TechnicalIndicators
  mlPrediction?: MLPrediction
  whaleActivity?: WhaleActivity
  timestamp: number
}

interface PricePoint {
  price: number
  timestamp: number
}

interface Candle {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export default function CoinDetailModal({ isOpen, onClose, symbol }: CoinDetailModalProps) {
  const navigate = useNavigate()
  const allCryptos = useMarketStore((state) => Array.from(state.cryptocurrencies.values()))
  const crypto = allCryptos.find(c => c.symbol === symbol)
  
  const [insights, setInsights] = useState<InsightData | null>(null)
  const [isLoadingInsights, setIsLoadingInsights] = useState(false)
  const [insightsError, setInsightsError] = useState<string | null>(null)
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([])
  const [whaleAlerts, setWhaleAlerts] = useState<WhaleActivity | null>(null)
  const [selectedRange, setSelectedRange] = useState<TimeRange>('1D')
  const [isLoadingChart, setIsLoadingChart] = useState(false)
  const [chartData, setChartData] = useState<PricePoint[]>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const currentPrice = crypto?.price

  // Fetch historical price data based on selected time range
  const fetchChartData = useCallback(async (range: TimeRange) => {
    if (!symbol) return
    
    setIsLoadingChart(true)
    try {
      const token = localStorage.getItem('spectra_auth_token')
      const apiUrl = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3001'
      const config = TIME_RANGES[range]
      
      const end = Date.now()
      const start = end - config.duration
      
      const response = await fetch(
        `${apiUrl}/api/market/history/${symbol}?interval=${config.interval}&start=${start}&end=${end}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      if (response.ok) {
        const data = await response.json()
        if (data.candles && Array.isArray(data.candles)) {
          const points: PricePoint[] = data.candles.map((candle: Candle) => ({
            price: candle.close,
            timestamp: candle.timestamp
          }))
          setChartData(points)
        }
      }
    } catch (error) {
      console.error('Failed to fetch chart data:', error)
      // Fall back to simulated data
      if (currentPrice) {
        setChartData(generateSimulatedHistory(currentPrice, selectedRange))
      }
    } finally {
      setIsLoadingChart(false)
    }
  }, [symbol, currentPrice, selectedRange])

  // Generate simulated price history for fallback
  const generateSimulatedHistory = (price: number, range: TimeRange): PricePoint[] => {
    const config = TIME_RANGES[range]
    const points: PricePoint[] = []
    const now = Date.now()
    const numPoints = range === '1D' ? 288 : range === '1W' ? 168 : range === '1M' ? 720 : 365
    const interval = config.duration / numPoints
    
    let currentPx = price * (0.85 + Math.random() * 0.1) // Start 5-15% lower
    const trend = (price - currentPx) / numPoints
    
    for (let i = 0; i < numPoints; i++) {
      const volatility = price * 0.01
      const noise = (Math.random() - 0.5) * volatility
      currentPx += trend + noise
      points.push({
        price: currentPx,
        timestamp: now - config.duration + (i * interval)
      })
    }
    
    // Ensure last point matches current price
    points.push({ price, timestamp: now })
    return points
  }

  // Fetch chart data when range changes
  useEffect(() => {
    if (isOpen && symbol) {
      fetchChartData(selectedRange)
    }
  }, [isOpen, symbol, selectedRange, fetchChartData])

  // Track real-time price changes for 1D view
  useEffect(() => {
    if (!isOpen || !currentPrice || selectedRange !== '1D') return
    
    setPriceHistory(prev => {
      const newPoint = { price: currentPrice, timestamp: Date.now() }
      const updated = [...prev, newPoint]
      return updated.slice(-60)
    })
  }, [currentPrice, isOpen, selectedRange])

  // Get the data to display in chart (chartData for historical, combined with realtime for 1D)
  const displayData = useMemo(() => {
    if (selectedRange === '1D' && priceHistory.length > 0) {
      return [...chartData.slice(0, -priceHistory.length), ...priceHistory]
    }
    return chartData
  }, [selectedRange, priceHistory, chartData])

  // Draw chart
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || displayData.length < 2) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const width = rect.width
    const height = rect.height
    const padding = 10

    // Clear
    ctx.clearRect(0, 0, width, height)

    // Calculate min/max
    const prices = displayData.map(p => p.price)
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    const priceRange = maxPrice - minPrice || 1

    // Draw gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    const isUp = prices[prices.length - 1] >= prices[0]
    if (isUp) {
      gradient.addColorStop(0, 'rgba(34, 197, 94, 0.2)')
      gradient.addColorStop(1, 'rgba(34, 197, 94, 0)')
    } else {
      gradient.addColorStop(0, 'rgba(239, 68, 68, 0.2)')
      gradient.addColorStop(1, 'rgba(239, 68, 68, 0)')
    }

    // Draw area
    ctx.beginPath()
    ctx.moveTo(padding, height - padding)
    
    displayData.forEach((point, i) => {
      const x = padding + (i / (displayData.length - 1)) * (width - 2 * padding)
      const y = height - padding - ((point.price - minPrice) / priceRange) * (height - 2 * padding)
      if (i === 0) ctx.lineTo(x, y)
      else ctx.lineTo(x, y)
    })
    
    ctx.lineTo(width - padding, height - padding)
    ctx.closePath()
    ctx.fillStyle = gradient
    ctx.fill()

    // Draw line
    ctx.beginPath()
    displayData.forEach((point, i) => {
      const x = padding + (i / (displayData.length - 1)) * (width - 2 * padding)
      const y = height - padding - ((point.price - minPrice) / priceRange) * (height - 2 * padding)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.strokeStyle = isUp ? '#22c55e' : '#ef4444'
    ctx.lineWidth = 2
    ctx.stroke()

    // Draw current price dot
    if (displayData.length > 0) {
      const lastPoint = displayData[displayData.length - 1]
      const x = width - padding
      const y = height - padding - ((lastPoint.price - minPrice) / priceRange) * (height - 2 * padding)
      
      ctx.beginPath()
      ctx.arc(x, y, 4, 0, Math.PI * 2)
      ctx.fillStyle = isUp ? '#22c55e' : '#ef4444'
      ctx.fill()
      
      // Glow effect
      ctx.beginPath()
      ctx.arc(x, y, 8, 0, Math.PI * 2)
      ctx.fillStyle = isUp ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'
      ctx.fill()
    }
  }, [displayData, priceHistory])

  // Fetch technical indicators and whale activity
  const fetchInsights = useCallback(async () => {
    if (!symbol) return

    setIsLoadingInsights(true)
    setInsightsError(null)

    try {
      const token = localStorage.getItem('spectra_auth_token')
      const apiUrl = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3001'
      
      // Fetch insights and whale data in parallel
      const [insightsRes, whaleRes] = await Promise.all([
        fetch(`${apiUrl}/api/insights/${symbol}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${apiUrl}/api/insights/whales?symbol=${symbol}&limit=10`, {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => null)
      ])

      if (!insightsRes.ok) {
        throw new Error('Failed to fetch insights')
      }

      const data = await insightsRes.json()
      
      if (data.insights && Array.isArray(data.insights) && data.insights.length > 0) {
        setInsights(data.insights[0])
      } else if (data.insights && !Array.isArray(data.insights)) {
        setInsights(data.insights)
      } else {
        setInsights(null)
      }

      // Process whale data
      if (whaleRes && whaleRes.ok) {
        const whaleData = await whaleRes.json()
        if (whaleData.alerts && whaleData.alerts.length > 0) {
          const buys = whaleData.alerts.filter((a: { side: string }) => a.side === 'buy').length
          const sells = whaleData.alerts.filter((a: { side: string }) => a.side === 'sell').length
          const largest = whaleData.alerts[0]
          
          setWhaleAlerts({
            recentBuys: buys,
            recentSells: sells,
            netFlow: buys > sells ? 'bullish' : sells > buys ? 'bearish' : 'neutral',
            largestTrade: largest ? {
              side: largest.side,
              usdValue: largest.usdValue,
              timestamp: largest.timestamp
            } : undefined
          })
        }
      }
    } catch (error) {
      console.error('Error fetching insights:', error)
      setInsightsError('Unable to load technical indicators')
    } finally {
      setIsLoadingInsights(false)
    }
  }, [symbol])

  // Generate initial simulated price history for immediate chart display
  const generateInitialPriceHistory = useCallback((currentPrice: number): PricePoint[] => {
    if (!currentPrice || currentPrice === 0) return []
    
    const points: PricePoint[] = []
    const now = Date.now()
    const volatility = 0.002 // 0.2% max variation
    
    // Generate 30 points going back in time
    for (let i = 29; i >= 0; i--) {
      const randomChange = (Math.random() - 0.5) * 2 * volatility
      const price = currentPrice * (1 + randomChange * (i / 10))
      points.push({
        price,
        timestamp: now - (i * 2000) // 2 second intervals
      })
    }
    
    // Make sure the last point is exactly the current price
    points.push({ price: currentPrice, timestamp: now })
    
    return points
  }, [])

  useEffect(() => {
    if (!isOpen || !symbol) return
    
    // Initialize with simulated price history for immediate chart display
    if (currentPrice && currentPrice > 0) {
      setPriceHistory(generateInitialPriceHistory(currentPrice))
    } else {
      setPriceHistory([])
    }
    
    fetchInsights()
    
    const interval = setInterval(fetchInsights, 15000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, symbol])

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
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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

                {/* ML Prediction Card */}
                {insights?.mlPrediction && (
                  <div className={`rounded-xl p-6 border ${
                    insights.mlPrediction.direction === 'up' 
                      ? 'bg-success-500/10 border-success-500/30' 
                      : insights.mlPrediction.direction === 'down'
                      ? 'bg-danger-500/10 border-danger-500/30'
                      : 'bg-dark-800/50 border-dark-700'
                  }`}>
                    <div className="flex items-center gap-2 mb-3">
                      <Brain className="h-5 w-5 text-primary-400" />
                      <span className="text-sm font-medium text-primary-400">ML Prediction</span>
                    </div>
                    <div className={`text-2xl font-bold mb-1 ${
                      insights.mlPrediction.direction === 'up' ? 'text-success-400' :
                      insights.mlPrediction.direction === 'down' ? 'text-danger-400' : 'text-white'
                    }`}>
                      {insights.mlPrediction.predictedChange > 0 ? '+' : ''}
                      {insights.mlPrediction.predictedChange.toFixed(2)}%
                    </div>
                    <div className="text-sm text-dark-400">
                      {insights.mlPrediction.horizon} • {insights.mlPrediction.confidence}% confidence
                    </div>
                  </div>
                )}
                
                {!insights?.mlPrediction && (
                  <div className="rounded-xl bg-dark-800/50 border border-dark-700 p-6 flex items-center justify-center">
                    <div className="text-center text-dark-400">
                      <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">ML prediction loading...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Price Chart with Time Range Tabs */}
              <div className="rounded-xl bg-dark-800/50 border border-dark-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary-400" />
                    <h3 className="text-lg font-semibold text-white">Price Chart</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${selectedRange === '1D' ? 'bg-success-400 animate-pulse' : 'bg-dark-600'}`} />
                    <span className="text-xs text-dark-400">{selectedRange === '1D' ? 'Live' : TIME_RANGES[selectedRange].label}</span>
                  </div>
                </div>

                {/* Time Range Tabs - Robinhood Style */}
                <div className="flex gap-1 mb-4 p-1 bg-dark-900/50 rounded-lg">
                  {(['1D', '1W', '1M', '3M', 'YTD', '1Y', '5Y', 'MAX'] as TimeRange[]).map((range) => (
                    <button
                      key={range}
                      onClick={() => setSelectedRange(range)}
                      className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-md transition-all duration-200 ${
                        selectedRange === range
                          ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20'
                          : 'text-dark-400 hover:text-white hover:bg-dark-700'
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>

                <div className="h-48 relative">
                  {isLoadingChart && (
                    <div className="absolute inset-0 flex items-center justify-center bg-dark-900/50 z-10 rounded-lg">
                      <Loader size="small" />
                    </div>
                  )}
                  <canvas 
                    ref={canvasRef} 
                    className="w-full h-full"
                    style={{ width: '100%', height: '100%' }}
                  />
                  {displayData.length < 2 && !isLoadingChart && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-dark-400">
                        <Activity className="h-8 w-8 mx-auto mb-2 animate-pulse" />
                        <p className="text-sm">Loading chart data...</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Price Change for Selected Range */}
                {displayData.length >= 2 && (
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-dark-400">{TIME_RANGES[selectedRange].label} Change</span>
                    {(() => {
                      const firstPrice = displayData[0]?.price || 0
                      const lastPrice = displayData[displayData.length - 1]?.price || 0
                      const change = firstPrice ? ((lastPrice - firstPrice) / firstPrice) * 100 : 0
                      const isPositive = change >= 0
                      return (
                        <span className={`font-medium ${isPositive ? 'text-success-400' : 'text-danger-400'}`}>
                          {isPositive ? '+' : ''}{change.toFixed(2)}%
                        </span>
                      )
                    })()}
                  </div>
                )}
              </div>

              {/* Technical Indicators Grid */}
              <div className="rounded-xl bg-dark-800/50 border border-dark-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary-400" />
                  Technical Indicators
                </h3>

                {isLoadingInsights && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="rounded-lg bg-dark-900/50 p-4 animate-pulse">
                        <div className="h-3 bg-dark-800 rounded w-16 mb-2"></div>
                        <div className="h-6 bg-dark-800 rounded w-12 mb-1"></div>
                        <div className="h-2 bg-dark-800 rounded w-20"></div>
                      </div>
                    ))}
                  </div>
                )}

                {insightsError && (
                  <div className="rounded-lg bg-danger-500/10 border border-danger-500/20 p-4 text-center">
                    <p className="text-danger-400">{insightsError}</p>
                  </div>
                )}

                {!isLoadingInsights && !insightsError && insights?.indicators && (
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

                {!isLoadingInsights && !insightsError && !insights?.indicators && (
                  <div className="rounded-lg bg-dark-900/50 p-8 text-center">
                    <Activity className="h-12 w-12 text-dark-600 mx-auto mb-2" />
                    <p className="text-dark-400">No technical indicators available</p>
                    <p className="text-dark-500 text-sm mt-1">Waiting for more market data...</p>
                  </div>
                )}
              </div>

              {/* Whale Activity */}
              {whaleAlerts && (
                <div className={`rounded-xl p-6 border ${
                  whaleAlerts.netFlow === 'bullish' 
                    ? 'bg-success-500/5 border-success-500/20' 
                    : whaleAlerts.netFlow === 'bearish'
                    ? 'bg-danger-500/5 border-danger-500/20'
                    : 'bg-dark-800/50 border-dark-700'
                }`}>
                  <div className="flex items-center gap-2 mb-4">
                    <Fish className="h-5 w-5 text-primary-400" />
                    <h3 className="text-lg font-semibold text-white">Whale Activity</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-success-400">{whaleAlerts.recentBuys}</div>
                      <div className="text-xs text-dark-400">Large Buys</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-danger-400">{whaleAlerts.recentSells}</div>
                      <div className="text-xs text-dark-400">Large Sells</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold capitalize ${
                        whaleAlerts.netFlow === 'bullish' ? 'text-success-400' :
                        whaleAlerts.netFlow === 'bearish' ? 'text-danger-400' : 'text-white'
                      }`}>
                        {whaleAlerts.netFlow}
                      </div>
                      <div className="text-xs text-dark-400">Net Flow</div>
                    </div>
                  </div>
                  {whaleAlerts.largestTrade && (
                    <div className="mt-4 pt-4 border-t border-dark-700/50">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-dark-400">Largest Recent Trade</span>
                        <span className={`text-sm font-semibold ${
                          whaleAlerts.largestTrade.side === 'buy' ? 'text-success-400' : 'text-danger-400'
                        }`}>
                          {whaleAlerts.largestTrade.side.toUpperCase()} ${formatNumber(whaleAlerts.largestTrade.usdValue)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* AI Signal Summary */}
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
