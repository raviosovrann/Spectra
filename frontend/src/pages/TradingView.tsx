import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Info } from 'lucide-react'
import { mockCryptos } from '../data/mockData'
import { useState } from 'react'
import CandlestickChart from '../components/charts/CandlestickChart'

export default function TradingView() {
  const [selectedCrypto, setSelectedCrypto] = useState(mockCryptos[0])
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market')
  const [side, setSide] = useState<'buy' | 'sell'>('buy')
  const [amount, setAmount] = useState('')
  const [limitPrice, setLimitPrice] = useState('')

  const balance = 15234.56
  const fee = 0.005 // 0.5%

  const calculateTotal = () => {
    const amountNum = parseFloat(amount) || 0
    const price = orderType === 'limit' ? parseFloat(limitPrice) || 0 : selectedCrypto.price
    const subtotal = amountNum * price
    const feeAmount = subtotal * fee
    return { subtotal, feeAmount, total: subtotal + feeAmount }
  }

  const { subtotal, feeAmount, total } = calculateTotal()

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-bold text-white mb-2">Trading</h1>
        <p className="text-dark-400">Place buy and sell orders for cryptocurrencies</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Chart and Market Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Selected Crypto Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl bg-dark-900 border border-dark-800 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-500/10 text-primary-400 font-bold text-3xl">
                  {selectedCrypto.icon}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedCrypto.name}</h2>
                  <p className="text-dark-400">{selectedCrypto.symbol}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-white font-mono">
                  ${selectedCrypto.price.toLocaleString()}
                </div>
                <div
                  className={`flex items-center gap-1 justify-end text-lg font-semibold ${
                    selectedCrypto.change24h >= 0 ? 'text-success-400' : 'text-danger-400'
                  }`}
                >
                  {selectedCrypto.change24h >= 0 ? (
                    <TrendingUp className="h-5 w-5" />
                  ) : (
                    <TrendingDown className="h-5 w-5" />
                  )}
                  {selectedCrypto.change24h >= 0 ? '+' : ''}
                  {selectedCrypto.change24h.toFixed(2)}%
                </div>
              </div>
            </div>

            {/* Candlestick Chart */}
            <div className="mb-4">
              <div className="flex gap-2 mb-4">
                {['1H', '24H', '7D', '30D', '1Y'].map((period) => (
                  <button
                    key={period}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      period === '24H'
                        ? 'bg-primary-500 text-white'
                        : 'bg-dark-800 text-dark-400 hover:bg-dark-750 hover:text-dark-200'
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
              <CandlestickChart height={350} />
            </div>

            {/* Market Stats */}
            <div className="grid grid-cols-4 gap-4 pt-6 border-t border-dark-800">
              <div>
                <div className="text-xs text-dark-400 mb-1">24h High</div>
                <div className="text-sm font-semibold text-white font-mono">
                  ${selectedCrypto.high24h.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-xs text-dark-400 mb-1">24h Low</div>
                <div className="text-sm font-semibold text-white font-mono">
                  ${selectedCrypto.low24h.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-xs text-dark-400 mb-1">24h Volume</div>
                <div className="text-sm font-semibold text-white font-mono">
                  ${(selectedCrypto.volume24h / 1e9).toFixed(2)}B
                </div>
              </div>
              <div>
                <div className="text-xs text-dark-400 mb-1">Market Cap</div>
                <div className="text-sm font-semibold text-white font-mono">
                  ${(selectedCrypto.marketCap / 1e9).toFixed(2)}B
                </div>
              </div>
            </div>
          </motion.div>

          {/* Crypto Selector */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl bg-dark-900 border border-dark-800 p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Select Cryptocurrency</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {mockCryptos.slice(0, 8).map((crypto) => (
                <button
                  key={crypto.symbol}
                  onClick={() => setSelectedCrypto(crypto)}
                  className={`p-4 rounded-xl border transition-all ${
                    selectedCrypto.symbol === crypto.symbol
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-dark-700 bg-dark-800/50 hover:border-dark-600'
                  }`}
                >
                  <div className="text-2xl mb-2">{crypto.icon}</div>
                  <div className="text-sm font-semibold text-white">{crypto.symbol}</div>
                  <div
                    className={`text-xs font-semibold ${
                      crypto.change24h >= 0 ? 'text-success-400' : 'text-danger-400'
                    }`}
                  >
                    {crypto.change24h >= 0 ? '+' : ''}
                    {crypto.change24h.toFixed(2)}%
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right Column - Order Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl bg-dark-900 border border-dark-800 p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-6">Place Order</h3>

          {/* Buy/Sell Toggle */}
          <div className="grid grid-cols-2 gap-2 mb-6 bg-dark-800 p-1 rounded-xl">
            <button
              onClick={() => setSide('buy')}
              className={`py-3 rounded-lg font-semibold transition-all ${
                side === 'buy' ? 'bg-success-500 text-white' : 'text-dark-400 hover:text-white'
              }`}
            >
              Buy
            </button>
            <button
              onClick={() => setSide('sell')}
              className={`py-3 rounded-lg font-semibold transition-all ${
                side === 'sell' ? 'bg-danger-500 text-white' : 'text-dark-400 hover:text-white'
              }`}
            >
              Sell
            </button>
          </div>

          {/* Order Type */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-dark-300 mb-2">Order Type</label>
            <div className="grid grid-cols-2 gap-2 bg-dark-800 p-1 rounded-xl">
              <button
                onClick={() => setOrderType('market')}
                className={`py-2 rounded-lg text-sm font-medium transition-all ${
                  orderType === 'market'
                    ? 'bg-primary-500 text-white'
                    : 'text-dark-400 hover:text-white'
                }`}
              >
                Market
              </button>
              <button
                onClick={() => setOrderType('limit')}
                className={`py-2 rounded-lg text-sm font-medium transition-all ${
                  orderType === 'limit'
                    ? 'bg-primary-500 text-white'
                    : 'text-dark-400 hover:text-white'
                }`}
              >
                Limit
              </button>
            </div>
          </div>

          {/* Amount Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Amount ({selectedCrypto.symbol})
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-xl bg-dark-800 border border-dark-700 px-4 py-3 text-white placeholder-dark-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all font-mono"
            />
          </div>

          {/* Limit Price Input */}
          {orderType === 'limit' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Limit Price (USD)
              </label>
              <input
                type="number"
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                placeholder={selectedCrypto.price.toString()}
                className="w-full rounded-xl bg-dark-800 border border-dark-700 px-4 py-3 text-white placeholder-dark-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all font-mono"
              />
            </div>
          )}

          {/* Balance */}
          <div className="mb-6 p-4 rounded-xl bg-dark-800/50 border border-dark-700">
            <div className="flex items-center justify-between text-sm">
              <span className="text-dark-400">Available Balance</span>
              <span className="font-semibold text-white font-mono">
                ${balance.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Order Summary */}
          {amount && (
            <div className="mb-6 p-4 rounded-xl bg-primary-500/5 border border-primary-500/20">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-dark-400">Subtotal</span>
                  <span className="font-mono text-white">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-400">Fee (0.5%)</span>
                  <span className="font-mono text-white">${feeAmount.toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t border-dark-700 flex justify-between">
                  <span className="font-semibold text-white">Total</span>
                  <span className="font-mono font-bold text-white">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            className={`w-full py-4 rounded-xl font-semibold text-white transition-all ${
              side === 'buy'
                ? 'bg-gradient-to-r from-success-500 to-success-600 hover:from-success-600 hover:to-success-700'
                : 'bg-gradient-to-r from-danger-500 to-danger-600 hover:from-danger-600 hover:to-danger-700'
            } shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed`}
            disabled={!amount || (orderType === 'limit' && !limitPrice)}
          >
            {side === 'buy' ? 'Buy' : 'Sell'} {selectedCrypto.symbol}
          </button>

          {/* Info */}
          <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-primary-500/5 border border-primary-500/20">
            <Info className="h-4 w-4 text-primary-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-dark-300">
              {orderType === 'market'
                ? 'Market orders execute immediately at the current market price.'
                : 'Limit orders execute only when the price reaches your specified limit.'}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
