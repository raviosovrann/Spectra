import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, TrendingDown, Activity, Sparkles, AlertCircle, Plus, X, RefreshCw, Brain, ChevronRight, Fish, Filter } from 'lucide-react'
import { useInsightsStore, MarketInsight } from '../stores/insightsStore'
import Loader from '../components/Loader'

// Available coins - same 20 coins as Investing and backend
const AVAILABLE_COINS = [
  'BTC', 'ETH', 'SOL', 'ADA', 'DOGE', 'XRP', 'DOT', 'AVAX', 'POL', 'LINK',
  'UNI', 'ATOM', 'LTC', 'BCH', 'ALGO', 'XLM', 'AAVE', 'NEAR', 'APT', 'ARB'
]

// Whale size categories
type WhaleSize = 'tiny' | 'small' | 'average' | 'large'
const getWhaleSize = (usdValue: number): WhaleSize => {
  if (usdValue >= 100000) return 'large'
  if (usdValue >= 50000) return 'average'
  if (usdValue >= 10000) return 'small'
  return 'tiny'
}

const getWhaleSizeLabel = (size: WhaleSize): string => {
  switch (size) {
    case 'large': return '🐋 Large ($100K+)'
    case 'average': return '🐳 Average ($50K-$100K)'
    case 'small': return '🐬 Small ($10K-$50K)'
    case 'tiny': return '🐟 Tiny (<$10K)'
  }
}

const getWhaleSizeColor = (size: WhaleSize): string => {
  switch (size) {
    case 'large': return 'text-primary-400'
    case 'average': return 'text-warning-400'
    case 'small': return 'text-success-400'
    case 'tiny': return 'text-dark-400'
  }
}

interface WhaleAlert {
  id: string
  symbol: string
  side: 'buy' | 'sell'
  size: number
  price: number
  usdValue: number
  multiplier: number
  timestamp: number
  message: string
  sizeCategory?: WhaleSize
}

export default function InsightsView() {
  const { 
    trackedCoins, 
    insights, 
    isLoading, 
    lastUpdated, 
    error,
    horizon,
    addCoin, 
    removeCoin,
    setHorizon,
    fetchInsights 
  } = useInsightsStore()
  
  const [showAddCoin, setShowAddCoin] = useState(false)
  const [selectedInsight, setSelectedInsight] = useState<MarketInsight | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [whaleAlerts, setWhaleAlerts] = useState<WhaleAlert[]>([])
  const [isFilterLoading, setIsFilterLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showWhaleFilter, setShowWhaleFilter] = useState(false)
  const [isLoadingWhales, setIsLoadingWhales] = useState(false)
  const [whaleSizeFilter, setWhaleSizeFilter] = useState<WhaleSize | 'all'>('all')

  // Handle refresh with immediate visual feedback
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await fetchInsights()
    } finally {
      setIsRefreshing(false)
    }
  }, [fetchInsights])

  // Fetch whale alerts - can fetch more when filter is active
  const fetchWhaleAlerts = useCallback(async (fetchAll: boolean = false) => {
    try {
      setIsLoadingWhales(true)
      const token = localStorage.getItem('spectra_auth_token')
      if (!token) return

      // Fetch more alerts when whale filter is active (last 30 days worth)
      const limit = fetchAll ? 100 : 5
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/insights/whales?limit=${limit}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (response.ok) {
        const data = await response.json()
        setWhaleAlerts(data.alerts || [])
      }
    } catch (err) {
      console.warn('Failed to fetch whale alerts:', err)
    } finally {
      setIsLoadingWhales(false)
    }
  }, [])

  // Fetch insights and whale alerts on mount and every 60 seconds
  useEffect(() => {
    fetchInsights()
    fetchWhaleAlerts(showWhaleFilter)
    const interval = setInterval(() => {
      fetchInsights()
      fetchWhaleAlerts(showWhaleFilter)
    }, 60000)
    return () => clearInterval(interval)
  }, [fetchInsights, fetchWhaleAlerts, showWhaleFilter])

  const getSignalColor = (signal: string) => {
    if (signal === 'bullish') return 'from-success-500 to-success-600'
    if (signal === 'bearish') return 'from-danger-500 to-danger-600'
    return 'from-warning-500 to-warning-600'
  }

  const getSignalIcon = (signal: string) => {
    if (signal === 'bullish') return TrendingUp
    if (signal === 'bearish') return TrendingDown
    return Activity
  }

  const getSignalBadgeColor = (signal: string) => {
    if (signal === 'bullish') return 'bg-success-500/20 text-success-400 border-success-500/30'
    if (signal === 'bearish') return 'bg-danger-500/20 text-danger-400 border-danger-500/30'
    return 'bg-warning-500/20 text-warning-400 border-warning-500/30'
  }

  const formatTimeAgo = (timestamp: number) => {
    const minutes = Math.floor((Date.now() - timestamp) / 60000)
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ago`
  }

  const filteredCoinsToAdd = AVAILABLE_COINS.filter(
    coin => !trackedCoins.includes(coin) && 
    coin.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const bullishCount = insights.filter(i => i.signal === 'bullish').length
  const bearishCount = insights.filter(i => i.signal === 'bearish').length

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">AI Insights</h1>
          <p className="text-dark-400">ML-powered market analysis using TimesFM</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isLoading || isRefreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-dark-800 text-dark-300 hover:bg-dark-700 hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading || isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowAddCoin(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Coin
          </button>
        </div>
      </motion.div>

      {/* AI Status Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6 rounded-2xl bg-gradient-to-r from-primary-500/10 to-success-500/10 p-6 border border-primary-500/20"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-1">TimesFM ML Engine</h3>
            <p className="text-sm text-dark-300">
              Analyzing {trackedCoins.length} cryptocurrencies • {lastUpdated ? `Updated ${formatTimeAgo(lastUpdated)}` : 'Loading...'}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">{insights.length}</div>
            <div className="text-xs text-dark-400">Insights Generated</div>
          </div>
        </div>
      </motion.div>

      {/* Prediction Horizon Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="mb-6"
      >
        <h3 className="text-sm font-medium text-dark-400 mb-3">Prediction Horizon</h3>
        <div className="flex gap-2">
          {([1, 7, 30] as const).map((h) => (
            <button
              key={h}
              onClick={() => {
                setIsFilterLoading(true)
                setHorizon(h)
                setTimeout(() => setIsFilterLoading(false), 1200)
              }}
              disabled={isFilterLoading}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                horizon === h
                  ? 'bg-primary-500 text-white'
                  : 'bg-dark-800 text-dark-300 hover:bg-dark-700 hover:text-white'
              } ${isFilterLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {h === 1 ? 'Tomorrow' : h === 7 ? '7 Days' : '30 Days'}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Tracked Coins */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-6"
      >
        <h3 className="text-sm font-medium text-dark-400 mb-3">Tracked Coins</h3>
        <div className="flex flex-wrap gap-2">
          {trackedCoins.map((coin) => (
            <div
              key={coin}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-800 border border-dark-700"
            >
              <span className="text-sm font-medium text-white">{coin}</span>
              <button
                onClick={() => removeCoin(coin)}
                className="text-dark-500 hover:text-danger-400 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Whale Detection Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Fish className="h-4 w-4 text-primary-400" />
            <h3 className="text-sm font-medium text-dark-400">Whale Detection</h3>
            {whaleAlerts.length > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium bg-primary-500/20 text-primary-400 rounded-full">
                {whaleAlerts.length} alerts
              </span>
            )}
          </div>
          <button
            onClick={() => {
              setShowWhaleFilter(!showWhaleFilter)
              fetchWhaleAlerts(!showWhaleFilter)
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              showWhaleFilter
                ? 'bg-primary-500 text-white'
                : 'bg-dark-800 text-dark-300 hover:bg-dark-700 hover:text-white'
            }`}
          >
            <Filter className="h-4 w-4" />
            {showWhaleFilter ? 'Hide Whales' : 'Show Whale Activity'}
          </button>
        </div>

        {/* Whale Activity Panel - Shows when filter is active */}
        <AnimatePresence>
          {showWhaleFilter && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              {isLoadingWhales ? (
                <div className="flex items-center justify-center py-8">
                  <Loader size="small" text="Loading whale activity..." />
                </div>
              ) : whaleAlerts.length === 0 ? (
                <div className="p-6 rounded-xl bg-dark-800/50 border border-dark-700 text-center">
                  <Fish className="h-12 w-12 mx-auto mb-3 text-dark-600" />
                  <p className="text-dark-400 text-sm">No whale activity detected in the last 30 days</p>
                  <p className="text-dark-500 text-xs mt-1">Large orders (&gt;$10K) will appear here</p>
                </div>
              ) : (
                <div className="rounded-xl bg-dark-800/50 border border-dark-700 overflow-hidden">
                  <div className="p-4 border-b border-dark-700 bg-dark-900/50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-white">Last 30 Days Whale Activity</span>
                      <div className="flex gap-4 text-xs">
                        <span className="text-success-400">
                          {whaleAlerts.filter(a => a.side === 'buy').length} Buys
                        </span>
                        <span className="text-danger-400">
                          {whaleAlerts.filter(a => a.side === 'sell').length} Sells
                        </span>
                      </div>
                    </div>
                    {/* Size Filter Buttons */}
                    <div className="flex gap-2 flex-wrap">
                      {(['all', 'large', 'average', 'small', 'tiny'] as const).map((size) => (
                        <button
                          key={size}
                          onClick={() => setWhaleSizeFilter(size)}
                          className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                            whaleSizeFilter === size
                              ? 'bg-primary-500 text-white'
                              : 'bg-dark-800 text-dark-400 hover:text-white hover:bg-dark-700'
                          }`}
                        >
                          {size === 'all' ? 'All Sizes' : getWhaleSizeLabel(size)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {whaleAlerts
                      .filter(alert => whaleSizeFilter === 'all' || getWhaleSize(alert.usdValue) === whaleSizeFilter)
                      .map((alert) => (
                      <div
                        key={alert.id}
                        className={`p-4 border-b border-dark-700/50 last:border-0 flex items-center justify-between ${
                          alert.side === 'buy'
                            ? 'bg-success-500/5'
                            : 'bg-danger-500/5'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{alert.side === 'buy' ? '🐋📈' : '🐋📉'}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-white">{alert.symbol}</span>
                              <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                                alert.side === 'buy' 
                                  ? 'bg-success-500/20 text-success-400' 
                                  : 'bg-danger-500/20 text-danger-400'
                              }`}>
                                {alert.side.toUpperCase()}
                              </span>
                              <span className={`text-xs ${getWhaleSizeColor(getWhaleSize(alert.usdValue))}`}>
                                {getWhaleSizeLabel(getWhaleSize(alert.usdValue))}
                              </span>
                            </div>
                            <div className="text-sm text-dark-400 mt-0.5">
                              ${alert.usdValue >= 1000000 
                                ? `${(alert.usdValue / 1000000).toFixed(2)}M` 
                                : alert.usdValue >= 1000 
                                  ? `${(alert.usdValue / 1000).toFixed(0)}K`
                                  : alert.usdValue.toFixed(0)
                              } • {alert.multiplier.toFixed(0)}x average volume
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-dark-500">
                          {new Date(alert.timestamp).toLocaleDateString()} {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ))}
                    {whaleAlerts.filter(alert => whaleSizeFilter === 'all' || getWhaleSize(alert.usdValue) === whaleSizeFilter).length === 0 && (
                      <div className="p-6 text-center text-dark-400 text-sm">
                        No whale alerts match the selected size filter
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick summary when filter is not active but there are alerts */}
        {!showWhaleFilter && whaleAlerts.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {whaleAlerts.slice(0, 3).map((alert) => (
              <div
                key={alert.id}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
                  alert.side === 'buy'
                    ? 'bg-success-500/10 border border-success-500/30'
                    : 'bg-danger-500/10 border border-danger-500/30'
                }`}
              >
                <span>{alert.side === 'buy' ? '🐋📈' : '🐋📉'}</span>
                <span className="font-medium text-white">{alert.symbol}</span>
                <span className={`text-xs ${alert.side === 'buy' ? 'text-success-400' : 'text-danger-400'}`}>
                  ${alert.usdValue >= 1000000 ? `${(alert.usdValue / 1000000).toFixed(1)}M` : `${(alert.usdValue / 1000).toFixed(0)}K`}
                </span>
              </div>
            ))}
            {whaleAlerts.length > 3 && (
              <button
                onClick={() => {
                  setShowWhaleFilter(true)
                  fetchWhaleAlerts(true)
                }}
                className="px-3 py-1.5 rounded-lg text-sm bg-dark-800 text-dark-300 hover:text-white transition-colors"
              >
                +{whaleAlerts.length - 3} more
              </button>
            )}
          </div>
        )}
      </motion.div>

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 p-4 rounded-xl bg-danger-500/10 border border-danger-500/30 text-danger-400"
        >
          {error}
        </motion.div>
      )}

      {/* Loading State */}
      {isLoading && insights.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <Loader text="Generating insights..." />
        </div>
      )}

      {/* Insights Grid */}
      {insights.length > 0 && (
        <div className="relative">
          {/* Loader Overlay */}
          <AnimatePresence>
            {(isFilterLoading || isLoading || isRefreshing) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-10 flex items-center justify-center bg-dark-950/70 backdrop-blur-sm rounded-2xl"
              >
                <Loader text={isFilterLoading ? "Updating predictions..." : "Refreshing insights..."} />
              </motion.div>
            )}
          </AnimatePresence>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {insights.map((insight, index) => {
            const SignalIcon = getSignalIcon(insight.signal)

            return (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.05 }}
                className="group relative overflow-hidden rounded-2xl bg-dark-900 border border-dark-800 hover:border-primary-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary-500/10 cursor-pointer"
                onClick={() => setSelectedInsight(insight)}
              >
                {/* Gradient Background */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${getSignalColor(insight.signal)} opacity-5 group-hover:opacity-10 transition-opacity`}
                />

                <div className="relative p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500/10 text-primary-400 font-bold text-lg">
                        {insight.symbol[0]}
                      </div>
                      <div>
                        <div className="text-lg font-bold text-white">{insight.symbol}</div>
                        {insight.mlPrediction && (
                          <div className="flex items-center gap-1 text-xs text-primary-400">
                            <Brain className="h-3 w-3" />
                            ML Prediction
                          </div>
                        )}
                      </div>
                    </div>
                    <div
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${getSignalBadgeColor(insight.signal)}`}
                    >
                      <SignalIcon className="h-4 w-4" />
                      <span className="text-sm font-semibold capitalize">{insight.signal}</span>
                    </div>
                  </div>

                  {/* Summary */}
                  <p className="text-dark-300 mb-4 leading-relaxed line-clamp-2">
                    {insight.summary.split(/(BUY:|SELL:|HOLD:)/).map((part, idx) => {
                      if (part === 'BUY:') return <span key={idx} className="font-bold text-success-400">BUY:</span>
                      if (part === 'SELL:') return <span key={idx} className="font-bold text-danger-400">SELL:</span>
                      if (part === 'HOLD:') return <span key={idx} className="font-bold text-warning-400">HOLD:</span>
                      return <span key={idx}>{part}</span>
                    })}
                  </p>

                  {/* Confidence Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-dark-400">Confidence Score</span>
                      <span className="text-sm font-semibold text-white">{insight.confidence}%</span>
                    </div>
                    <div className="h-2 bg-dark-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${insight.confidence}%` }}
                        transition={{ delay: 0.3 + index * 0.05, duration: 0.8 }}
                        className={`h-full bg-gradient-to-r ${getSignalColor(insight.signal)}`}
                      />
                    </div>
                  </div>

                  {/* Quick Indicators */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {insight.indicators.rsi && (
                      <div className="rounded-lg bg-dark-800/50 p-3">
                        <div className="text-xs text-dark-400 mb-1">RSI</div>
                        <div className="text-lg font-bold text-white font-mono">
                          {insight.indicators.rsi.toFixed(1)}
                        </div>
                      </div>
                    )}
                    {insight.mlPrediction && (
                      <div className="rounded-lg bg-dark-800/50 p-3">
                        <div className="text-xs text-dark-400 mb-1">ML Forecast</div>
                        <div className={`text-lg font-bold font-mono ${
                          insight.mlPrediction.predictedChange > 0 ? 'text-success-400' : 
                          insight.mlPrediction.predictedChange < 0 ? 'text-danger-400' : 'text-dark-300'
                        }`}>
                          {insight.mlPrediction.predictedChange > 0 ? '+' : ''}{insight.mlPrediction.predictedChange.toFixed(1)}%
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-dark-800">
                    <span className="text-xs text-dark-500">{formatTimeAgo(insight.timestamp)}</span>
                    <button className="flex items-center gap-1 text-sm font-semibold text-primary-400 hover:text-primary-300 transition-colors">
                      View Details
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && insights.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Sparkles className="h-12 w-12 text-dark-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No insights yet</h3>
          <p className="text-dark-400 mb-4">Add coins to track and generate AI insights</p>
          <button
            onClick={() => setShowAddCoin(true)}
            className="px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors"
          >
            Add Your First Coin
          </button>
        </motion.div>
      )}

      {/* Market Indicators Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="rounded-2xl bg-dark-900 border border-dark-800 p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Market Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-xl bg-dark-800/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-primary-400" />
              <span className="text-sm text-dark-400">Tracked Coins</span>
            </div>
            <div className="text-2xl font-bold text-white font-mono">{trackedCoins.length}</div>
          </div>

          <div className="rounded-xl bg-dark-800/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-success-400" />
              <span className="text-sm text-dark-400">Bullish Signals</span>
            </div>
            <div className="text-2xl font-bold text-success-400 font-mono">{bullishCount}</div>
          </div>

          <div className="rounded-xl bg-dark-800/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-4 w-4 text-danger-400" />
              <span className="text-sm text-dark-400">Bearish Signals</span>
            </div>
            <div className="text-2xl font-bold text-danger-400 font-mono">{bearishCount}</div>
          </div>

          <div className="rounded-xl bg-dark-800/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-warning-400" />
              <span className="text-sm text-dark-400">Neutral</span>
            </div>
            <div className="text-2xl font-bold text-warning-400 font-mono">
              {insights.length - bullishCount - bearishCount}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Add Coin Modal */}
      <AnimatePresence>
        {showAddCoin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddCoin(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-dark-900 rounded-2xl border border-dark-800 p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Add Coin to Track</h3>
                <button
                  onClick={() => setShowAddCoin(false)}
                  className="text-dark-400 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <input
                type="text"
                placeholder="Search coins..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-dark-800 border border-dark-700 text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 mb-4"
              />

              <div className="max-h-64 overflow-y-auto space-y-2">
                {filteredCoinsToAdd.map((coin) => (
                  <button
                    key={coin}
                    onClick={() => {
                      addCoin(coin)
                      setShowAddCoin(false)
                      setSearchQuery('')
                    }}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-dark-800 hover:bg-dark-700 transition-colors"
                  >
                    <span className="font-medium text-white">{coin}</span>
                    <Plus className="h-4 w-4 text-primary-400" />
                  </button>
                ))}
                {filteredCoinsToAdd.length === 0 && (
                  <p className="text-center text-dark-400 py-4">No coins available to add</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Insight Detail Modal */}
      <AnimatePresence>
        {selectedInsight && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedInsight(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-dark-900 rounded-2xl border border-dark-800 w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 z-10 bg-dark-900/95 backdrop-blur-sm border-b border-dark-800 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-600/10 text-primary-400 font-bold text-xl">
                      {selectedInsight.symbol[0]}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">{selectedInsight.symbol}</h3>
                      <p className="text-sm text-dark-400">Detailed Analysis</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedInsight(null)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-dark-800 text-dark-400 hover:bg-dark-700 hover:text-white transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">

              {/* Signal Badge */}
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border mb-4 ${getSignalBadgeColor(selectedInsight.signal)}`}>
                {(() => {
                  const Icon = getSignalIcon(selectedInsight.signal)
                  return <Icon className="h-5 w-5" />
                })()}
                <span className="font-semibold capitalize">{selectedInsight.signal} Signal</span>
                <span className="text-sm opacity-75">({selectedInsight.confidence}% confidence)</span>
              </div>

              {/* Summary */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-dark-400 mb-2">Analysis Summary</h4>
                <p className="text-white leading-relaxed">
                  {selectedInsight.summary.split(/(BUY:|SELL:|HOLD:)/).map((part, idx) => {
                    if (part === 'BUY:') return <span key={idx} className="font-bold text-success-400 text-lg">BUY:</span>
                    if (part === 'SELL:') return <span key={idx} className="font-bold text-danger-400 text-lg">SELL:</span>
                    if (part === 'HOLD:') return <span key={idx} className="font-bold text-warning-400 text-lg">HOLD:</span>
                    return <span key={idx}>{part}</span>
                  })}
                </p>
              </div>

              {/* ML Prediction */}
              {selectedInsight.mlPrediction && (
                <div className="mb-6 p-4 rounded-xl bg-primary-500/10 border border-primary-500/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Brain className="h-5 w-5 text-primary-400" />
                    <h4 className="font-medium text-white">ML Prediction (TimesFM)</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-dark-400 mb-1">Direction</div>
                      <div className={`text-lg font-bold capitalize ${
                        selectedInsight.mlPrediction.direction === 'up' ? 'text-success-400' :
                        selectedInsight.mlPrediction.direction === 'down' ? 'text-danger-400' : 'text-dark-300'
                      }`}>
                        {selectedInsight.mlPrediction.direction}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-dark-400 mb-1">Predicted Change</div>
                      <div className={`text-lg font-bold ${
                        selectedInsight.mlPrediction.predictedChange > 0 ? 'text-success-400' :
                        selectedInsight.mlPrediction.predictedChange < 0 ? 'text-danger-400' : 'text-dark-300'
                      }`}>
                        {selectedInsight.mlPrediction.predictedChange > 0 ? '+' : ''}
                        {selectedInsight.mlPrediction.predictedChange.toFixed(2)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-dark-400 mb-1">Horizon</div>
                      <div className="text-lg font-bold text-white">{selectedInsight.mlPrediction.horizon}</div>
                    </div>
                    <div>
                      <div className="text-xs text-dark-400 mb-1">ML Confidence</div>
                      <div className="text-lg font-bold text-white">{selectedInsight.mlPrediction.confidence}%</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Technical Indicators */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-dark-400 mb-3">Technical Indicators</h4>
                <div className="grid grid-cols-2 gap-3">
                  {selectedInsight.indicators.rsi !== undefined && (
                    <div className="p-3 rounded-lg bg-dark-800">
                      <div className="text-xs text-dark-400 mb-1">RSI (14)</div>
                      <div className={`text-xl font-bold font-mono ${
                        selectedInsight.indicators.rsi > 70 ? 'text-danger-400' :
                        selectedInsight.indicators.rsi < 30 ? 'text-success-400' : 'text-white'
                      }`}>
                        {selectedInsight.indicators.rsi.toFixed(1)}
                      </div>
                      <div className="text-xs text-dark-500 mt-1">
                        {selectedInsight.indicators.rsiSignal || (selectedInsight.indicators.rsi > 70 ? 'Overbought' :
                         selectedInsight.indicators.rsi < 30 ? 'Oversold' : 'Neutral')}
                      </div>
                    </div>
                  )}
                  {selectedInsight.indicators.macd && (
                    <div className="p-3 rounded-lg bg-dark-800">
                      <div className="text-xs text-dark-400 mb-1">MACD</div>
                      <div className={`text-xl font-bold font-mono ${
                        selectedInsight.indicators.macd.trend === 'bullish' ? 'text-success-400' :
                        selectedInsight.indicators.macd.trend === 'bearish' ? 'text-danger-400' : 'text-white'
                      }`}>
                        {selectedInsight.indicators.macd.histogram > 0 ? '+' : ''}{selectedInsight.indicators.macd.histogram.toFixed(2)}
                      </div>
                      <div className="text-xs text-dark-500 mt-1 capitalize">
                        {selectedInsight.indicators.macd.trend}
                      </div>
                    </div>
                  )}
                  {selectedInsight.indicators.bollingerBands && (
                    <div className="p-3 rounded-lg bg-dark-800">
                      <div className="text-xs text-dark-400 mb-1">Bollinger %B</div>
                      <div className={`text-xl font-bold font-mono ${
                        selectedInsight.indicators.bollingerBands.signal === 'overbought' ? 'text-danger-400' :
                        selectedInsight.indicators.bollingerBands.signal === 'oversold' ? 'text-success-400' : 'text-white'
                      }`}>
                        {(selectedInsight.indicators.bollingerBands.percentB * 100).toFixed(0)}%
                      </div>
                      <div className="text-xs text-dark-500 mt-1 capitalize">
                        {selectedInsight.indicators.bollingerBands.signal}
                      </div>
                    </div>
                  )}
                  {selectedInsight.indicators.stochastic && (
                    <div className="p-3 rounded-lg bg-dark-800">
                      <div className="text-xs text-dark-400 mb-1">Stochastic %K</div>
                      <div className={`text-xl font-bold font-mono ${
                        selectedInsight.indicators.stochastic.signal === 'overbought' ? 'text-danger-400' :
                        selectedInsight.indicators.stochastic.signal === 'oversold' ? 'text-success-400' : 'text-white'
                      }`}>
                        {selectedInsight.indicators.stochastic.k.toFixed(0)}
                      </div>
                      <div className="text-xs text-dark-500 mt-1 capitalize">
                        {selectedInsight.indicators.stochastic.signal}
                      </div>
                    </div>
                  )}
                  {selectedInsight.indicators.momentum !== undefined && (
                    <div className="p-3 rounded-lg bg-dark-800">
                      <div className="text-xs text-dark-400 mb-1">Momentum (10)</div>
                      <div className={`text-xl font-bold font-mono ${
                        selectedInsight.indicators.momentum > 0 ? 'text-success-400' : 
                        selectedInsight.indicators.momentum < 0 ? 'text-danger-400' : 'text-white'
                      }`}>
                        {selectedInsight.indicators.momentum > 0 ? '+' : ''}{selectedInsight.indicators.momentum.toFixed(2)}%
                      </div>
                      <div className="text-xs text-dark-500 mt-1 capitalize">
                        {selectedInsight.indicators.momentumSignal || 'neutral'}
                      </div>
                    </div>
                  )}
                  {selectedInsight.indicators.volatility !== undefined && (
                    <div className="p-3 rounded-lg bg-dark-800">
                      <div className="text-xs text-dark-400 mb-1">Volatility</div>
                      <div className={`text-xl font-bold font-mono ${
                        selectedInsight.indicators.volatility > 5 ? 'text-danger-400' :
                        selectedInsight.indicators.volatility > 2 ? 'text-warning-400' : 'text-success-400'
                      }`}>
                        {selectedInsight.indicators.volatility.toFixed(2)}%
                      </div>
                      <div className="text-xs text-dark-500 mt-1">
                        {selectedInsight.indicators.volatility > 5 ? 'High' :
                         selectedInsight.indicators.volatility > 2 ? 'Medium' : 'Low'}
                      </div>
                    </div>
                  )}
                  {selectedInsight.indicators.volumeChange !== undefined && (
                    <div className="p-3 rounded-lg bg-dark-800">
                      <div className="text-xs text-dark-400 mb-1">Volume Change</div>
                      <div className={`text-xl font-bold font-mono ${
                        selectedInsight.indicators.volumeChange > 50 ? 'text-warning-400' :
                        selectedInsight.indicators.volumeChange > 0 ? 'text-success-400' : 'text-danger-400'
                      }`}>
                        {selectedInsight.indicators.volumeChange > 0 ? '+' : ''}
                        {selectedInsight.indicators.volumeChange.toFixed(1)}%
                      </div>
                      <div className="text-xs text-dark-500 mt-1">
                        {selectedInsight.indicators.volumeChange > 50 ? 'Spike' :
                         selectedInsight.indicators.volumeChange > 0 ? 'Above Avg' : 'Below Avg'}
                      </div>
                    </div>
                  )}
                  {selectedInsight.indicators.smaSignal && (
                    <div className="p-3 rounded-lg bg-dark-800">
                      <div className="text-xs text-dark-400 mb-1">SMA Crossover</div>
                      <div className={`text-lg font-bold capitalize ${
                        selectedInsight.indicators.smaSignal === 'golden_cross' ? 'text-success-400' : 'text-danger-400'
                      }`}>
                        {selectedInsight.indicators.smaSignal.replace('_', ' ')}
                      </div>
                      <div className="text-xs text-dark-500 mt-1">
                        {selectedInsight.indicators.smaSignal === 'golden_cross' ? 'Bullish' : 'Bearish'}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Timestamp */}
              <div className="text-xs text-dark-500 text-center pb-6">
                Generated {formatTimeAgo(selectedInsight.timestamp)}
              </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
