import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Info, AlertCircle, Loader2 } from 'lucide-react'
import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import CandlestickChart from '@/components/charts/CandlestickChart'
import CryptoDropdown from '../components/dropdowns/CryptoDropdown'
import OrderConfirmation from '../components/modals/OrderConfirmation'
import { useMarketStore } from '../stores/marketStore'
import { usePortfolioStore } from '../stores/portfolioStore'
import { useInstrumentWebSocket } from '../hooks/useInstrumentWebSocket'
import { useCandleData, CandleTimeframe } from '../hooks/useCandleData'
import { formatCurrency, formatNumber } from '../utils/formatters'
import CredentialsGate from '../components/CredentialsGate'
import { useAuth } from '../hooks/useAuth'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const MIN_ORDER_USD = 10
const FEE_RATE = 0.005

const STORAGE_KEY_SYMBOL = 'spectra_trading_symbol'
const STORAGE_KEY_TIMEFRAME = 'spectra_trading_timeframe'
const STORAGE_KEY_RANGE = 'spectra_trading_range'

const TIMEFRAME_OPTIONS: Array<{ label: string; value: CandleTimeframe; resolution: string; description: string }> = [
  { label: '1 Min', value: '1M', resolution: '1m', description: 'Scalping view' },
  { label: '2 Min', value: '2M', resolution: '2m', description: 'Scalping view' },
  { label: '3 Min', value: '3M', resolution: '3m', description: 'Scalping view' },
  { label: '4 Min', value: '4M', resolution: '4m', description: 'Scalping view' },
  { label: '5 Min', value: '5M', resolution: '5m', description: 'High-frequency view' },
  { label: '10 Min', value: '10M', resolution: '10m', description: 'Intraday view' },
  { label: '15 Min', value: '15M', resolution: '15m', description: 'Intraday view' },
  { label: '30 Min', value: '30M', resolution: '30m', description: 'Intraday view' },
  { label: '45 Min', value: '45M', resolution: '45m', description: 'Intraday view' },
  { label: '1 Hour', value: '1H', resolution: '1h', description: 'Short-term trend' },
  { label: '2 Hour', value: '2H', resolution: '2h', description: 'Short-term trend' },
  { label: '3 Hour', value: '3H', resolution: '3h', description: 'Short-term trend' },
  { label: '4 Hour', value: '4H', resolution: '4h', description: 'Swing trading' },
  { label: '1 Day', value: '1D', resolution: '1d', description: 'Macro trend' },
]

const RANGE_FILTERS = [
  { label: '1D', value: '1D', durationMs: 1 * 24 * 60 * 60 * 1000 },
  { label: '5D', value: '5D', durationMs: 5 * 24 * 60 * 60 * 1000 },
  { label: '1M', value: '1M', durationMs: 30 * 24 * 60 * 60 * 1000 },
  { label: '3M', value: '3M', durationMs: 90 * 24 * 60 * 60 * 1000 },
  { label: '6M', value: '6M', durationMs: 180 * 24 * 60 * 60 * 1000 },
  { label: '1Y', value: '1Y', durationMs: 365 * 24 * 60 * 60 * 1000 },
  { label: 'ALL', value: 'ALL', durationMs: null },
]

const RANGE_MAP = RANGE_FILTERS.reduce<Record<string, number | null>>((acc, filter) => {
  acc[filter.value] = filter.durationMs
  return acc
}, {})

const formatResolutionLabel = (resolution: string): string => {
  if (resolution.endsWith('m')) {
    return `${parseInt(resolution)} Min`
  }
  if (resolution.endsWith('h')) {
    return `${parseInt(resolution)} Hr`
  }
  if (resolution.endsWith('d')) {
    return `${parseInt(resolution)} Day`
  }
  return resolution.toUpperCase()
}

interface ValidationErrors {
  amount?: string
  limitPrice?: string
  balance?: string
}

export default function TradingView() {
  const { user, isLoading: isAuthLoading } = useAuth()
  const getAllCryptos = useMarketStore((state) => state.getAllCryptos)
  const cryptos = getAllCryptos()
  const getCashBalance = usePortfolioStore((state) => state.getCashBalance)
  const cashBalance = getCashBalance()

  // Load saved preferences
  const [selectedSymbol, setSelectedSymbol] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_SYMBOL) || 'BTC'
  })

  const [selectedTimeframe, setSelectedTimeframe] = useState<CandleTimeframe>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_TIMEFRAME) as CandleTimeframe | null
    if (saved && TIMEFRAME_OPTIONS.some((option) => option.value === saved)) {
      return saved
    }
    return '1D'
  })

  const [selectedRange, setSelectedRange] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_RANGE)
    if (saved && RANGE_MAP[saved] !== undefined) {
      return saved
    }
    return '6M'
  })

  // Order form state
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market')
  const [side, setSide] = useState<'buy' | 'sell'>('buy')
  const [amount, setAmount] = useState('')
  const [limitPrice, setLimitPrice] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [showConfirmation, setShowConfirmation] = useState(false)

  // Price animation
  const prevPriceRef = useRef<number>(0)
  const [priceFlash, setPriceFlash] = useState<'up' | 'down' | null>(null)

  // Real-time WebSocket data for selected instrument
  const { ticker: wsTicker, isConnected, lastUpdate: wsLastUpdate } = useInstrumentWebSocket({
    symbol: selectedSymbol,
    enabled: true,
  })

  // Historical candle data
  const { candles, isLoading: isCandlesLoading, error: candlesError, refetch } = useCandleData({
    symbol: selectedSymbol,
    timeframe: selectedTimeframe,
    enabled: true,
  })

  const filteredCandles = useMemo(() => {
    if (!candles.length) return candles
    const duration = RANGE_MAP[selectedRange]
    if (!duration) return candles

    const lastTimestamp = candles[candles.length - 1]?.timestamp ?? Date.now()
    const cutoff = lastTimestamp - duration
    return candles.filter((candle) => candle.timestamp >= cutoff)
  }, [candles, selectedRange])

  // Get current price - prefer WebSocket, fallback to market store
  const marketStoreCrypto = useMarketStore((state) => state.getCrypto(selectedSymbol))
  
  const currentPrice = useMemo(() => {
    if (wsTicker?.price) return wsTicker.price
    if (marketStoreCrypto?.price) return marketStoreCrypto.price
    return 0
  }, [wsTicker, marketStoreCrypto])

  const displayData = useMemo(() => {
    if (wsTicker) {
      return {
        price: wsTicker.price,
        change24h: wsTicker.change24hPercent,
        high24h: wsTicker.high24h,
        low24h: wsTicker.low24h,
        volume24h: wsTicker.volume24h,
      }
    }
    if (marketStoreCrypto) {
      return {
        price: marketStoreCrypto.price,
        change24h: marketStoreCrypto.change24h,
        high24h: marketStoreCrypto.high24h,
        low24h: marketStoreCrypto.low24h,
        volume24h: marketStoreCrypto.volume24h,
      }
    }
    return { price: 0, change24h: 0, high24h: 0, low24h: 0, volume24h: 0 }
  }, [wsTicker, marketStoreCrypto])

  const currentTimeframeMeta = useMemo(() => {
    return TIMEFRAME_OPTIONS.find((option) => option.value === selectedTimeframe) || TIMEFRAME_OPTIONS[1]
  }, [selectedTimeframe])

  // Price flash animation
  useEffect(() => {
    if (displayData.price > 0 && prevPriceRef.current > 0) {
      if (displayData.price > prevPriceRef.current) {
        setPriceFlash('up')
      } else if (displayData.price < prevPriceRef.current) {
        setPriceFlash('down')
      }
      const timeout = setTimeout(() => setPriceFlash(null), 500)
      return () => clearTimeout(timeout)
    }
    prevPriceRef.current = displayData.price
  }, [displayData.price])

  // Save symbol preference
  const handleSymbolChange = useCallback((symbol: string) => {
    setSelectedSymbol(symbol)
    localStorage.setItem(STORAGE_KEY_SYMBOL, symbol)
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TIMEFRAME, selectedTimeframe)
  }, [selectedTimeframe])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_RANGE, selectedRange)
  }, [selectedRange])

  // Update limit price when switching to limit order
  useEffect(() => {
    if (orderType === 'limit' && currentPrice > 0) {
      setLimitPrice(currentPrice.toFixed(2))
    }
  }, [orderType, currentPrice])

  // Order calculations
  const orderCalculation = useMemo(() => {
    const amountNum = parseFloat(amount) || 0
    const price = orderType === 'limit' ? (parseFloat(limitPrice) || 0) : currentPrice
    const subtotal = amountNum * price
    const feeAmount = subtotal * FEE_RATE
    const total = side === 'buy' ? subtotal + feeAmount : subtotal - feeAmount
    return { subtotal, feeAmount, total, amountNum, price }
  }, [amount, limitPrice, orderType, currentPrice, side])

  // Validation
  const validateOrder = useMemo(() => {
    const newErrors: ValidationErrors = {}
    const { amountNum, subtotal, total } = orderCalculation
    if (amount && amountNum <= 0) newErrors.amount = 'Amount must be greater than 0'
    if (amount && subtotal < MIN_ORDER_USD) newErrors.amount = `Minimum order is $${MIN_ORDER_USD}`
    if (orderType === 'limit') {
      const limitPriceNum = parseFloat(limitPrice) || 0
      if (limitPrice && limitPriceNum <= 0) newErrors.limitPrice = 'Limit price must be greater than 0'
    }
    if (side === 'buy' && amount && total > cashBalance) newErrors.balance = 'Insufficient balance'
    return newErrors
  }, [amount, limitPrice, orderType, side, orderCalculation, cashBalance])

  useEffect(() => {
    setErrors(validateOrder)
  }, [validateOrder])

  const isFormValid = useMemo(() => {
    return (
      amount &&
      parseFloat(amount) > 0 &&
      orderCalculation.subtotal >= MIN_ORDER_USD &&
      (orderType === 'market' || (limitPrice && parseFloat(limitPrice) > 0)) &&
      Object.keys(validateOrder).length === 0
    )
  }, [amount, limitPrice, orderType, orderCalculation.subtotal, validateOrder])

  const handleSubmitOrder = () => {
    if (!isFormValid || isSubmitting) return
    setShowConfirmation(true)
  }

  const handleConfirmOrder = useCallback(async (): Promise<{ success: boolean; orderId?: string; error?: string }> => {
    setIsSubmitting(true)
    try {
      const response = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          symbol: `${selectedSymbol}-USD`,
          side,
          type: orderType,
          amount: parseFloat(amount),
          limitPrice: orderType === 'limit' ? parseFloat(limitPrice) : undefined,
        }),
      })
      const data = await response.json()
      if (!response.ok) return { success: false, error: data.error || 'Failed to place order' }
      setAmount('')
      setLimitPrice('')
      return { success: true, orderId: data.orderId }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Network error' }
    } finally {
      setIsSubmitting(false)
    }
  }, [selectedSymbol, side, orderType, amount, limitPrice])

  const orderDetails = useMemo(() => ({
    symbol: `${selectedSymbol}-USD`,
    side,
    type: orderType,
    amount: parseFloat(amount) || 0,
    price: orderType === 'limit' ? parseFloat(limitPrice) || 0 : currentPrice,
    fees: orderCalculation.feeAmount,
    total: orderCalculation.total,
  }), [selectedSymbol, side, orderType, amount, limitPrice, currentPrice, orderCalculation])

  // Filter cryptos with data
  const availableCryptos = useMemo(() => {
    return cryptos.filter(c => c.price > 0)
  }, [cryptos])

  if (isAuthLoading) {
    return (
      <div className="h-[calc(100vh-120px)] flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
      </div>
    )
  }

  return (
    <CredentialsGate
      hasCredentials={Boolean(user?.hasCoinbaseKeys)}
      title="Trading requires Coinbase credentials"
      description="Connect your Coinbase Advanced Trade API keys in Settings to place orders and view live trading tools."
      ctaLabel="Manage credentials"
    >
      <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* Header with dropdowns */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 border-b border-dark-800 bg-dark-900/50">
        <div className="flex flex-wrap items-center gap-4">
          <CryptoDropdown
            selectedSymbol={selectedSymbol}
            onSelect={handleSymbolChange}
            cryptocurrencies={availableCryptos}
          />
          <div className="flex items-center gap-2">
            <div className="text-[10px] uppercase tracking-[0.2em] text-dark-400">Timeframe</div>
            <div className="relative">
              <select
                value={selectedTimeframe}
                onChange={(event) => setSelectedTimeframe(event.target.value as CandleTimeframe)}
                className="appearance-none rounded-lg border border-dark-700 bg-dark-800/80 px-4 py-2 pr-10 text-sm font-semibold text-white focus:border-primary-500 focus:outline-none"
              >
                {TIMEFRAME_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-dark-400">▾</span>
            </div>
          </div>
          <div className="text-xs text-dark-400">
            {currentTimeframeMeta.label} · {formatResolutionLabel(currentTimeframeMeta.resolution)}
          </div>
        </div>
        
        {/* Price Display */}
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className={`text-2xl font-bold font-mono transition-colors duration-300 ${
              priceFlash === 'up' ? 'text-success-400' : priceFlash === 'down' ? 'text-danger-400' : 'text-white'
            }`}>
              {displayData.price > 0 ? formatCurrency(displayData.price) : '—'}
            </div>
            <div className={`flex items-center gap-1 justify-end text-sm font-semibold ${
              displayData.change24h >= 0 ? 'text-success-400' : 'text-danger-400'
            }`}>
              {displayData.change24h >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {displayData.change24h >= 0 ? '+' : ''}{displayData.change24h.toFixed(2)}%
            </div>
          </div>
          
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success-400' : 'bg-danger-400'}`} />
            <span className="text-xs text-dark-400">{isConnected ? 'Live' : 'Offline'}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Chart Area - Takes most space */}
        <div className="flex-1 flex flex-col min-w-0 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex gap-1 overflow-x-auto pb-1">
              {RANGE_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setSelectedRange(filter.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                    filter.value === selectedRange
                      ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20'
                      : 'bg-dark-800 text-dark-400 hover:bg-dark-750 hover:text-dark-200'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => refetch()}
              className="text-xs font-semibold text-primary-300 hover:text-primary-100 transition-colors"
            >
              Refresh candles
            </button>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 rounded-xl bg-dark-900 border border-dark-800 overflow-hidden"
          >
            {isCandlesLoading && candles.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
              </div>
            ) : candlesError ? (
              <div className="h-full flex flex-col items-center justify-center text-dark-400">
                <AlertCircle className="h-8 w-8 mb-2" />
                <p className="text-sm">{candlesError}</p>
                <button onClick={() => refetch()} className="mt-2 text-primary-400 hover:text-primary-300 text-sm underline">
                  Retry
                </button>
              </div>
            ) : (
              <CandlestickChart
                symbol={selectedSymbol}
                interval={currentTimeframeMeta.resolution}
                candles={filteredCandles}
                currentPrice={currentPrice}
                isLoading={isCandlesLoading}
                height="100%"
              />
            )}
          </motion.div>

          {/* Market Stats */}
          <div className="grid grid-cols-4 gap-4 mt-4">
            {[
              { label: '24h High', value: displayData.high24h, format: formatCurrency },
              { label: '24h Low', value: displayData.low24h, format: formatCurrency },
              { label: '24h Volume', value: displayData.volume24h, format: formatNumber },
              { label: 'Last Update', value: wsLastUpdate, format: (v: number) => v > 0 ? `${Math.round((Date.now() - v) / 1000)}s ago` : '—' },
            ].map(({ label, value, format }) => (
              <div key={label} className="rounded-lg bg-dark-900 border border-dark-800 p-3">
                <div className="text-xs text-dark-400 mb-1">{label}</div>
                <div className="text-sm font-semibold text-white font-mono">
                  {value > 0 ? format(value) : '—'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Form Sidebar */}
        <div className="w-80 border-l border-dark-800 bg-dark-900/50 p-4 hidden lg:block overflow-y-auto">
          <h3 className="text-lg font-semibold text-white mb-4">Place Order</h3>

          {/* Buy/Sell Toggle */}
          <div className="grid grid-cols-2 gap-2 mb-4 bg-dark-800 p-1 rounded-xl">
            <button
              onClick={() => setSide('buy')}
              className={`py-2.5 rounded-lg font-semibold transition-all ${
                side === 'buy' ? 'bg-success-500 text-white' : 'text-dark-400 hover:text-white'
              }`}
            >
              Buy
            </button>
            <button
              onClick={() => setSide('sell')}
              className={`py-2.5 rounded-lg font-semibold transition-all ${
                side === 'sell' ? 'bg-danger-500 text-white' : 'text-dark-400 hover:text-white'
              }`}
            >
              Sell
            </button>
          </div>

          {/* Order Type */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-dark-300 mb-2">Order Type</label>
            <div className="grid grid-cols-2 gap-2 bg-dark-800 p-1 rounded-xl">
              <button
                onClick={() => setOrderType('market')}
                className={`py-2 rounded-lg text-sm font-medium transition-all ${
                  orderType === 'market' ? 'bg-primary-500 text-white' : 'text-dark-400 hover:text-white'
                }`}
              >
                Market
              </button>
              <button
                onClick={() => setOrderType('limit')}
                className={`py-2 rounded-lg text-sm font-medium transition-all ${
                  orderType === 'limit' ? 'bg-primary-500 text-white' : 'text-dark-400 hover:text-white'
                }`}
              >
                Limit
              </button>
            </div>
          </div>

          {/* Amount Input */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-dark-300 mb-2">Amount ({selectedSymbol})</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className={`w-full rounded-xl bg-dark-800 border px-4 py-2.5 text-white placeholder-dark-500 focus:outline-none focus:ring-2 font-mono ${
                errors.amount ? 'border-danger-500 focus:ring-danger-500/20' : 'border-dark-700 focus:border-primary-500 focus:ring-primary-500/20'
              }`}
            />
            {errors.amount && (
              <p className="mt-1 text-xs text-danger-400 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />{errors.amount}
              </p>
            )}
          </div>

          {/* Limit Price */}
          {orderType === 'limit' && (
            <div className="mb-3">
              <label className="block text-sm font-medium text-dark-300 mb-2">Limit Price (USD)</label>
              <input
                type="number"
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                placeholder={currentPrice.toFixed(2)}
                className={`w-full rounded-xl bg-dark-800 border px-4 py-2.5 text-white placeholder-dark-500 focus:outline-none focus:ring-2 font-mono ${
                  errors.limitPrice ? 'border-danger-500 focus:ring-danger-500/20' : 'border-dark-700 focus:border-primary-500 focus:ring-primary-500/20'
                }`}
              />
              {errors.limitPrice && (
                <p className="mt-1 text-xs text-danger-400 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />{errors.limitPrice}
                </p>
              )}
            </div>
          )}

          {/* Balance */}
          <div className={`mb-4 p-3 rounded-xl border ${
            errors.balance ? 'bg-danger-500/5 border-danger-500/20' : 'bg-dark-800/50 border-dark-700'
          }`}>
            <div className="flex items-center justify-between text-sm">
              <span className="text-dark-400">Available Balance</span>
              <span className={`font-semibold font-mono ${errors.balance ? 'text-danger-400' : 'text-white'}`}>
                {formatCurrency(cashBalance)}
              </span>
            </div>
          </div>

          {/* Order Summary */}
          {amount && parseFloat(amount) > 0 && (
            <div className="mb-4 p-3 rounded-xl bg-primary-500/5 border border-primary-500/20">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-dark-400">Price</span>
                  <span className="font-mono text-white">{formatCurrency(orderCalculation.price)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-400">Subtotal</span>
                  <span className="font-mono text-white">{formatCurrency(orderCalculation.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-400">Fee (0.5%)</span>
                  <span className="font-mono text-white">{side === 'buy' ? '+' : '-'}{formatCurrency(orderCalculation.feeAmount)}</span>
                </div>
                <div className="pt-1.5 border-t border-dark-700 flex justify-between">
                  <span className="font-semibold text-white">{side === 'buy' ? 'Total Cost' : 'You Receive'}</span>
                  <span className="font-mono font-bold text-white">{formatCurrency(orderCalculation.total)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmitOrder}
            disabled={!isFormValid || isSubmitting || currentPrice === 0}
            className={`w-full py-3 rounded-xl font-semibold text-white transition-all ${
              side === 'buy'
                ? 'bg-gradient-to-r from-success-500 to-success-600 hover:from-success-600 hover:to-success-700'
                : 'bg-gradient-to-r from-danger-500 to-danger-600 hover:from-danger-600 hover:to-danger-700'
            } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
          >
            {isSubmitting ? (
              <><Loader2 className="h-5 w-5 animate-spin" />Processing...</>
            ) : (
              <>{side === 'buy' ? 'Buy' : 'Sell'} {selectedSymbol}</>
            )}
          </button>

          {/* Info */}
          <div className="mt-3 flex items-start gap-2 p-2.5 rounded-lg bg-primary-500/5 border border-primary-500/20">
            <Info className="h-4 w-4 text-primary-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-dark-300">
              {orderType === 'market'
                ? 'Market orders execute immediately at the current market price.'
                : 'Limit orders execute only when the price reaches your specified limit.'}
            </p>
          </div>
        </div>
      </div>

      <OrderConfirmation
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleConfirmOrder}
        orderDetails={orderDetails}
      />
      </div>
    </CredentialsGate>
  )
}
