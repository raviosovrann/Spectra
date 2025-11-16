import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Activity } from 'lucide-react'
import { mockCryptos } from '../data/mockData'
import { useState } from 'react'

type ViewMode = 'change' | 'volume' | 'marketCap'

export default function InvestingView() {
  const [viewMode, setViewMode] = useState<ViewMode>('change')
  const [selectedCrypto, setSelectedCrypto] = useState<string | null>(null)

  const getColorForChange = (change: number) => {
    if (change > 5) return 'from-success-600 to-success-500'
    if (change > 2) return 'from-success-500 to-success-400'
    if (change > 0) return 'from-success-400 to-success-300'
    if (change > -2) return 'from-danger-300 to-danger-400'
    if (change > -5) return 'from-danger-400 to-danger-500'
    return 'from-danger-500 to-danger-600'
  }

  const formatNumber = (num: number) => {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`
    return `$${num.toFixed(2)}`
  }

  const sortedCryptos = [...mockCryptos].sort((a, b) => {
    if (viewMode === 'change') return Math.abs(b.change24h) - Math.abs(a.change24h)
    if (viewMode === 'volume') return b.volume24h - a.volume24h
    return b.marketCap - a.marketCap
  })

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Market Overview</h1>
            <p className="text-dark-400">Real-time cryptocurrency prices and trends</p>
          </div>

          {/* View Mode Selector */}
          <div className="flex gap-2 bg-dark-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('change')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'change'
                  ? 'bg-primary-500 text-white'
                  : 'text-dark-400 hover:text-white'
              }`}
            >
              24h Change
            </button>
            <button
              onClick={() => setViewMode('volume')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'volume'
                  ? 'bg-primary-500 text-white'
                  : 'text-dark-400 hover:text-white'
              }`}
            >
              Volume
            </button>
            <button
              onClick={() => setViewMode('marketCap')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'marketCap'
                  ? 'bg-primary-500 text-white'
                  : 'text-dark-400 hover:text-white'
              }`}
            >
              Market Cap
            </button>
          </div>
        </div>

        {/* Market Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl bg-dark-900 p-6 border border-dark-800"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success-500/10">
                <TrendingUp className="h-5 w-5 text-success-400" />
              </div>
              <span className="text-dark-400 text-sm">Total Market Cap</span>
            </div>
            <div className="text-2xl font-bold text-white">$1.82T</div>
            <div className="text-sm text-success-400 mt-1">+3.2% (24h)</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl bg-dark-900 p-6 border border-dark-800"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/10">
                <Activity className="h-5 w-5 text-primary-400" />
              </div>
              <span className="text-dark-400 text-sm">24h Volume</span>
            </div>
            <div className="text-2xl font-bold text-white">$89.4B</div>
            <div className="text-sm text-success-400 mt-1">+12.8% (24h)</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl bg-dark-900 p-6 border border-dark-800"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning-500/10">
                <TrendingDown className="h-5 w-5 text-warning-400" />
              </div>
              <span className="text-dark-400 text-sm">BTC Dominance</span>
            </div>
            <div className="text-2xl font-bold text-white">46.3%</div>
            <div className="text-sm text-danger-400 mt-1">-0.5% (24h)</div>
          </motion.div>
        </div>
      </motion.div>

      {/* Heatmap Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
      >
        {sortedCryptos.map((crypto, index) => (
          <motion.div
            key={crypto.symbol}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 * index }}
            onClick={() => setSelectedCrypto(crypto.symbol)}
            className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${getColorForChange(
              crypto.change24h
            )} p-6 cursor-pointer hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-2xl`}
          >
            {/* Crypto Icon */}
            <div className="absolute top-4 right-4 text-4xl opacity-20 group-hover:opacity-30 transition-opacity">
              {crypto.icon}
            </div>

            {/* Content */}
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl font-bold text-white">{crypto.symbol}</span>
                {crypto.change24h > 0 ? (
                  <TrendingUp className="h-5 w-5 text-white" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-white" />
                )}
              </div>
              <div className="text-sm text-white/80 mb-4">{crypto.name}</div>

              <div className="space-y-2">
                <div>
                  <div className="text-2xl font-bold text-white font-mono">
                    ${crypto.price.toLocaleString()}
                  </div>
                  <div className="text-sm text-white/90 font-semibold">
                    {crypto.change24h > 0 ? '+' : ''}
                    {crypto.change24h.toFixed(2)}%
                  </div>
                </div>

                <div className="pt-2 border-t border-white/20">
                  <div className="flex justify-between text-xs text-white/70">
                    <span>Vol:</span>
                    <span className="font-mono">{formatNumber(crypto.volume24h)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-white/70 mt-1">
                    <span>MCap:</span>
                    <span className="font-mono">{formatNumber(crypto.marketCap)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Hover Glow */}
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
