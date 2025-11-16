import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Activity, Zap, AlertCircle } from 'lucide-react'
import { mockInsights, mockCryptos } from '../data/mockData'

export default function InsightsView() {
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
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ago`
  }

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-bold text-white mb-2">AI Insights</h1>
        <p className="text-dark-400">AI-powered market analysis and trading signals</p>
      </motion.div>

      {/* AI Status Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6 rounded-2xl bg-gradient-to-r from-primary-500/10 to-success-500/10 p-6 border border-primary-500/20"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 animate-pulse">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-1">AI Engine Active</h3>
            <p className="text-sm text-dark-300">
              Analyzing market data across 12 cryptocurrencies • Last updated 2 minutes ago
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">4</div>
            <div className="text-xs text-dark-400">Active Signals</div>
          </div>
        </div>
      </motion.div>

      {/* Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {mockInsights.map((insight, index) => {
          const SignalIcon = getSignalIcon(insight.signal)
          const crypto = mockCryptos.find((c) => c.symbol === insight.symbol)

          return (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="group relative overflow-hidden rounded-2xl bg-dark-900 border border-dark-800 hover:border-primary-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary-500/10"
            >
              {/* Gradient Background */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${getSignalColor(
                  insight.signal
                )} opacity-5 group-hover:opacity-10 transition-opacity`}
              />

              <div className="relative p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500/10 text-primary-400 font-bold text-lg">
                      {crypto?.icon || insight.symbol[0]}
                    </div>
                    <div>
                      <div className="text-lg font-bold text-white">{insight.symbol}</div>
                      <div className="text-sm text-dark-400">{crypto?.name}</div>
                    </div>
                  </div>
                  <div
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${getSignalBadgeColor(
                      insight.signal
                    )}`}
                  >
                    <SignalIcon className="h-4 w-4" />
                    <span className="text-sm font-semibold capitalize">{insight.signal}</span>
                  </div>
                </div>

                {/* Summary */}
                <p className="text-dark-300 mb-4 leading-relaxed">{insight.summary}</p>

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
                      transition={{ delay: 0.5 + index * 0.1, duration: 0.8 }}
                      className={`h-full bg-gradient-to-r ${getSignalColor(insight.signal)}`}
                    />
                  </div>
                </div>

                {/* Indicators */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {insight.indicators.rsi && (
                    <div className="rounded-lg bg-dark-800/50 p-3">
                      <div className="text-xs text-dark-400 mb-1">RSI</div>
                      <div className="text-lg font-bold text-white font-mono">
                        {insight.indicators.rsi}
                      </div>
                    </div>
                  )}
                  {insight.indicators.volumeChange && (
                    <div className="rounded-lg bg-dark-800/50 p-3">
                      <div className="text-xs text-dark-400 mb-1">Volume Change</div>
                      <div className="text-lg font-bold text-success-400 font-mono">
                        +{insight.indicators.volumeChange}%
                      </div>
                    </div>
                  )}
                  {insight.indicators.volatility && (
                    <div className="rounded-lg bg-dark-800/50 p-3">
                      <div className="text-xs text-dark-400 mb-1">Volatility</div>
                      <div className="text-lg font-bold text-warning-400 font-mono">
                        {insight.indicators.volatility}%
                      </div>
                    </div>
                  )}
                  {insight.indicators.smaSignal && (
                    <div className="rounded-lg bg-dark-800/50 p-3">
                      <div className="text-xs text-dark-400 mb-1">SMA Signal</div>
                      <div className="text-sm font-semibold text-primary-400 capitalize">
                        {insight.indicators.smaSignal.replace('_', ' ')}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-dark-800">
                  <span className="text-xs text-dark-500">{formatTimeAgo(insight.timestamp)}</span>
                  <button className="text-sm font-semibold text-primary-400 hover:text-primary-300 transition-colors">
                    View Details →
                  </button>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Technical Indicators Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="rounded-2xl bg-dark-900 border border-dark-800 p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Market Indicators</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-xl bg-dark-800/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-primary-400" />
              <span className="text-sm text-dark-400">Avg RSI</span>
            </div>
            <div className="text-2xl font-bold text-white font-mono">58.3</div>
            <div className="text-xs text-dark-500 mt-1">Neutral territory</div>
          </div>

          <div className="rounded-xl bg-dark-800/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-success-400" />
              <span className="text-sm text-dark-400">Bullish Signals</span>
            </div>
            <div className="text-2xl font-bold text-success-400 font-mono">7</div>
            <div className="text-xs text-dark-500 mt-1">Across all assets</div>
          </div>

          <div className="rounded-xl bg-dark-800/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-4 w-4 text-danger-400" />
              <span className="text-sm text-dark-400">Bearish Signals</span>
            </div>
            <div className="text-2xl font-bold text-danger-400 font-mono">3</div>
            <div className="text-xs text-dark-500 mt-1">Across all assets</div>
          </div>

          <div className="rounded-xl bg-dark-800/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-warning-400" />
              <span className="text-sm text-dark-400">High Volatility</span>
            </div>
            <div className="text-2xl font-bold text-warning-400 font-mono">2</div>
            <div className="text-xs text-dark-500 mt-1">Assets to watch</div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
