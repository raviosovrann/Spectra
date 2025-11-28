import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, TrendingDown, Activity } from 'lucide-react'
import { useState, useEffect, useMemo, memo } from 'react'
import { useMarketStore } from '../stores/marketStore'
import { useWebSocket } from '../hooks/useWebSocket'
import { formatNumber, formatCurrency, formatPercent } from '../utils/formatters'
import { Cryptocurrency } from '../types/market'
import CoinDetailModal from '../components/modals/CoinDetailModal'

type ViewMode = 'change' | 'volume' | 'marketCap' | 'price' | 'name'

// Memoized CoinCell component to prevent unnecessary re-renders
interface CoinCellProps {
  crypto: Cryptocurrency
  index: number
  onClick: (symbol: string) => void
}

const CoinCell = memo(
  ({ crypto, index, onClick }: CoinCellProps) => {
    const [priceChange, setPriceChange] = useState<'up' | 'down' | null>(null)
    const [prevPrice, setPrevPrice] = useState(crypto.price)

    // Detect price changes for pulse animation
    useEffect(() => {
      if (crypto.price !== prevPrice) {
        setPriceChange(crypto.price > prevPrice ? 'up' : 'down')
        setPrevPrice(crypto.price)

        // Clear animation after 1 second
        const timeout = setTimeout(() => setPriceChange(null), 1000)
        return () => clearTimeout(timeout)
      }
    }, [crypto.price, prevPrice])

    const getColorForChange = (change: number) => {
      if (change > 5) return 'from-success-600 to-success-500'
      if (change > 2) return 'from-success-500 to-success-400'
      if (change > 0) return 'from-success-400 to-success-300'
      if (change > -2) return 'from-danger-300 to-danger-400'
      if (change > -5) return 'from-danger-400 to-danger-500'
      return 'from-danger-500 to-danger-600'
    }

    const getCryptoIcon = (symbol: string) => {
      const icons: Record<string, string> = {
        BTC: '₿',
        ETH: 'Ξ',
        SOL: '◎',
        ADA: '₳',
        XRP: 'X',
        DOT: '●',
        DOGE: 'Ð',
        AVAX: 'A',
        SHIB: '🐕',
        LINK: 'L',
        UNI: 'U',
        ATOM: 'C',
        BCH: 'B',
        LTC: 'Ł',
        AAVE: 'A',
        ALGO: 'A',
      }
      return icons[symbol] || symbol.charAt(0)
    }

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{
          opacity: 1,
          scale: 1,
          boxShadow: priceChange
            ? priceChange === 'up'
              ? '0 0 20px rgba(34, 197, 94, 0.5)'
              : '0 0 20px rgba(239, 68, 68, 0.5)'
            : undefined,
        }}
        transition={{ delay: 0.05 * index, duration: 0.3 }}
        onClick={() => onClick(crypto.symbol)}
        className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${getColorForChange(
          crypto.change24h
        )} p-6 cursor-pointer hover:scale-105 transition-colors duration-300 shadow-lg hover:shadow-2xl border border-white/10`}
      >
        {/* Crypto Icon */}
        <div className="absolute top-4 right-4 text-4xl opacity-20 group-hover:opacity-30 transition-opacity font-mono">
          {getCryptoIcon(crypto.symbol)}
        </div>

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl font-bold text-white font-mono tracking-tight">{crypto.symbol}</span>
            {crypto.change24h > 0 ? (
              <TrendingUp className="h-5 w-5 text-white" />
            ) : (
              <TrendingDown className="h-5 w-5 text-white" />
            )}
          </div>
          <div className="text-sm text-white/80 mb-4 font-medium">{crypto.name}</div>

          <div className="space-y-2">
            <div>
              <div className="text-2xl font-bold text-white font-mono tracking-tight">
                {formatCurrency(crypto.price)}
              </div>
              <div className="text-sm text-white/90 font-bold font-mono">
                {formatPercent(crypto.change24h)}
              </div>
            </div>

            <div className="pt-2 border-t border-white/20">
              <div className="flex justify-between text-xs text-white/70">
                <span className="font-medium">Vol:</span>
                <span className="font-mono font-medium">{formatNumber(crypto.volume24h)}</span>
              </div>
              <div className="flex justify-between text-xs text-white/70 mt-1">
                <span className="font-medium">MCap:</span>
                <span className="font-mono font-medium">{formatNumber(crypto.marketCap)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Hover Glow */}
        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Pulse animation overlay */}
        {priceChange && (
          <motion.div
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className={`absolute inset-0 ${
              priceChange === 'up' ? 'bg-success-500/20' : 'bg-danger-500/20'
            }`}
          />
        )}
      </motion.div>
    )
  },
  (prevProps, nextProps) => {
    // Only re-render if price or change24h changed
    return (
      prevProps.crypto.price === nextProps.crypto.price &&
      prevProps.crypto.change24h === nextProps.crypto.change24h &&
      prevProps.crypto.volume24h === nextProps.crypto.volume24h &&
      prevProps.crypto.marketCap === nextProps.crypto.marketCap
    )
  }
)

CoinCell.displayName = 'CoinCell'

export default function InvestingView() {
  const [viewMode, setViewMode] = useState<ViewMode>('change')
  const [selectedCoin, setSelectedCoin] = useState<string | null>(null)

  // Get real-time market data from store
  const cryptos = useMarketStore((state) => state.getAllCryptos())
  const updateBatch = useMarketStore((state) => state.updateBatch)

  // Initialize WebSocket connection
  const { status } = useWebSocket()

  // Load view mode preference from localStorage
  useEffect(() => {
    const savedViewMode = localStorage.getItem('spectra_lastViewMode') as ViewMode
    if (savedViewMode) {
      setViewMode(savedViewMode)
    }
  }, [])

  // Initialize with mock data if store is empty (fallback while WebSocket connects)
  useEffect(() => {
    if (cryptos.length === 0 && status === 'connecting') {
      // Import mock data dynamically
      import('../data/mockData').then((module) => {
        const mockCryptos = module.mockCryptos.map((crypto) => ({
          symbol: crypto.symbol,
          name: crypto.name,
          productId: `${crypto.symbol}-USD`,
          price: crypto.price,
          change24h: crypto.change24h,
          volume24h: crypto.volume24h,
          marketCap: crypto.marketCap,
          high24h: crypto.high24h,
          low24h: crypto.low24h,
          lastUpdate: Date.now(),
        }))
        updateBatch(mockCryptos)
      })
    }
  }, [cryptos.length, status, updateBatch])

  // Save view mode preference to localStorage
  useEffect(() => {
    localStorage.setItem('spectra_lastViewMode', viewMode)
  }, [viewMode])

  // Calculate market stats from real data
  const marketStats = useMemo(() => {
    if (cryptos.length === 0) {
      return {
        totalMarketCap: 0,
        totalVolume: 0,
        marketCapChange: 0,
        volumeChange: 0,
      }
    }

    const totalMarketCap = cryptos.reduce((sum, crypto) => sum + crypto.marketCap, 0)
    const totalVolume = cryptos.reduce((sum, crypto) => sum + crypto.volume24h, 0)

    // Calculate average change for market cap change approximation
    const avgChange = cryptos.reduce((sum, crypto) => sum + crypto.change24h, 0) / cryptos.length

    return {
      totalMarketCap,
      totalVolume,
      marketCapChange: avgChange,
      volumeChange: avgChange * 1.5, // Volume typically moves more than price
    }
  }, [cryptos])

  // Sort cryptocurrencies based on view mode
  const sortedCryptos = useMemo(() => {
    const cryptosCopy = [...cryptos]
    if (viewMode === 'change') {
      return cryptosCopy.sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h))
    }
    if (viewMode === 'volume') {
      return cryptosCopy.sort((a, b) => b.volume24h - a.volume24h)
    }
    if (viewMode === 'marketCap') {
      return cryptosCopy.sort((a, b) => b.marketCap - a.marketCap)
    }
    if (viewMode === 'price') {
      return cryptosCopy.sort((a, b) => b.price - a.price)
    }
    if (viewMode === 'name') {
      return cryptosCopy.sort((a, b) => a.name.localeCompare(b.name))
    }
    return cryptosCopy
  }, [cryptos, viewMode])

  const handleCoinClick = (symbol: string) => {
    setSelectedCoin(symbol)
  }

  const handleCloseModal = () => {
    setSelectedCoin(null)
  }

  // Loading state
  const isLoading = cryptos.length === 0 && status === 'connecting'

  // Empty state
  const isEmpty = cryptos.length === 0 && status === 'connected'

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
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-white">Market Overview</h1>
              {/* Connection Status Indicator */}
              <div className="flex items-center gap-2">
                <div
                  className={`h-2 w-2 rounded-full ${
                    status === 'connected'
                      ? 'bg-success-500 animate-pulse'
                      : status === 'connecting' || status === 'reconnecting'
                      ? 'bg-warning-500 animate-pulse'
                      : 'bg-danger-500'
                  }`}
                />
                <span
                  className={`text-xs font-medium ${
                    status === 'connected'
                      ? 'text-success-400'
                      : status === 'connecting' || status === 'reconnecting'
                      ? 'text-warning-400'
                      : 'text-danger-400'
                  }`}
                >
                  {status === 'connected'
                    ? 'Live'
                    : status === 'connecting'
                    ? 'Connecting...'
                    : status === 'reconnecting'
                    ? 'Reconnecting...'
                    : 'Disconnected'}
                </span>
              </div>
            </div>
            <p className="text-dark-400">Real-time cryptocurrency prices and trends</p>
          </div>

          {/* View Mode Selector */}
          <div className="flex gap-2 bg-dark-800 p-1 rounded-xl overflow-x-auto">
            <button
              onClick={() => setViewMode('change')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                viewMode === 'change'
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                  : 'text-dark-400 hover:text-white hover:bg-dark-700'
              }`}
            >
              24h Change
            </button>
            <button
              onClick={() => setViewMode('volume')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                viewMode === 'volume'
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                  : 'text-dark-400 hover:text-white hover:bg-dark-700'
              }`}
            >
              Volume
            </button>
            <button
              onClick={() => setViewMode('marketCap')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                viewMode === 'marketCap'
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                  : 'text-dark-400 hover:text-white hover:bg-dark-700'
              }`}
            >
              Market Cap
            </button>
            <button
              onClick={() => setViewMode('price')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                viewMode === 'price'
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                  : 'text-dark-400 hover:text-white hover:bg-dark-700'
              }`}
            >
              Price
            </button>
            <button
              onClick={() => setViewMode('name')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                viewMode === 'name'
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                  : 'text-dark-400 hover:text-white hover:bg-dark-700'
              }`}
            >
              Name
            </button>
          </div>
        </div>

        {/* Market Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <span className="text-dark-400 text-sm font-medium">Total Market Cap</span>
            </div>
            <div className="text-2xl font-bold text-white font-mono tracking-tight">
              {marketStats.totalMarketCap > 0 
                ? formatNumber(marketStats.totalMarketCap) 
                : '--'}
            </div>
            <div className={`text-sm mt-1 font-medium ${
              marketStats.marketCapChange >= 0 ? 'text-success-400' : 'text-danger-400'
            }`}>
              {marketStats.totalMarketCap > 0 
                ? `${formatPercent(marketStats.marketCapChange)} (24h)` 
                : 'Loading...'}
            </div>
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
              <span className="text-dark-400 text-sm font-medium">24h Volume</span>
            </div>
            <div className="text-2xl font-bold text-white font-mono tracking-tight">
              {marketStats.totalVolume > 0 
                ? formatNumber(marketStats.totalVolume) 
                : '--'}
            </div>
            <div className={`text-sm mt-1 font-medium ${
              marketStats.volumeChange >= 0 ? 'text-success-400' : 'text-danger-400'
            }`}>
              {marketStats.totalVolume > 0 
                ? `${formatPercent(marketStats.volumeChange)} (24h)` 
                : 'Loading...'}
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
          {Array.from({ length: 12 }).map((_, index) => (
            <div
              key={index}
              className="rounded-2xl bg-dark-900 p-6 border border-dark-800 animate-pulse"
            >
              <div className="h-6 bg-dark-800 rounded w-20 mb-2"></div>
              <div className="h-4 bg-dark-800 rounded w-24 mb-4"></div>
              <div className="h-8 bg-dark-800 rounded w-32 mb-2"></div>
              <div className="h-4 bg-dark-800 rounded w-16 mb-4"></div>
              <div className="space-y-2">
                <div className="h-3 bg-dark-800 rounded"></div>
                <div className="h-3 bg-dark-800 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {isEmpty && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-dark-900 p-12 border border-dark-800 text-center"
        >
          <Activity className="h-16 w-16 text-dark-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Market Data Available</h3>
          <p className="text-dark-400 mb-4">
            Unable to load cryptocurrency data. Please check your connection.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Retry
          </button>
        </motion.div>
      )}

      {/* Heatmap Grid */}
      {!isLoading && !isEmpty && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4"
        >
          <AnimatePresence>
            {sortedCryptos.map((crypto, index) => (
              <CoinCell
                key={crypto.symbol}
                crypto={crypto}
                index={index}
                onClick={handleCoinClick}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Coin Detail Modal */}
      {selectedCoin && (
        <CoinDetailModal
          isOpen={!!selectedCoin}
          onClose={handleCloseModal}
          symbol={selectedCoin}
        />
      )}
    </div>
  )
}
