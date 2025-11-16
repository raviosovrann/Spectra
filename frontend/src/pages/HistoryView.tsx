import { motion } from 'framer-motion'
import { Download, Filter, Search, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { mockTrades } from '../data/mockData'
import { useState } from 'react'

export default function HistoryView() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'buy' | 'sell'>('all')

  const filteredTrades = mockTrades.filter((trade) => {
    const matchesSearch =
      trade.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trade.id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === 'all' || trade.type === filterType
    return matchesSearch && matchesType
  })

  const totalVolume = mockTrades.reduce((sum, t) => sum + t.total, 0)
  const totalFees = mockTrades.reduce((sum, t) => sum + t.fees, 0)
  const buyCount = mockTrades.filter((t) => t.type === 'buy').length
  const sellCount = mockTrades.filter((t) => t.type === 'sell').length

  const exportToCSV = () => {
    const headers = ['Date', 'ID', 'Symbol', 'Type', 'Amount', 'Price', 'Fees', 'Total', 'Status']
    const rows = filteredTrades.map((trade) => [
      trade.date.toISOString(),
      trade.id,
      trade.symbol,
      trade.type,
      trade.amount,
      trade.price,
      trade.fees,
      trade.total,
      trade.status,
    ])

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `trade-history-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

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
            <h1 className="text-3xl font-bold text-white mb-2">Trade History</h1>
            <p className="text-dark-400">View and export your trading history</p>
          </div>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold transition-all"
          >
            <Download className="h-5 w-5" />
            Export CSV
          </button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl bg-dark-900 p-6 border border-dark-800"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/10">
              <DollarSign className="h-5 w-5 text-primary-400" />
            </div>
            <span className="text-dark-400 text-sm">Total Volume</span>
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            ${totalVolume.toLocaleString()}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl bg-dark-900 p-6 border border-dark-800"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success-500/10">
              <TrendingUp className="h-5 w-5 text-success-400" />
            </div>
            <span className="text-dark-400 text-sm">Buy Orders</span>
          </div>
          <div className="text-2xl font-bold text-white">{buyCount}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl bg-dark-900 p-6 border border-dark-800"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-danger-500/10">
              <TrendingDown className="h-5 w-5 text-danger-400" />
            </div>
            <span className="text-dark-400 text-sm">Sell Orders</span>
          </div>
          <div className="text-2xl font-bold text-white">{sellCount}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl bg-dark-900 p-6 border border-dark-800"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning-500/10">
              <DollarSign className="h-5 w-5 text-warning-400" />
            </div>
            <span className="text-dark-400 text-sm">Total Fees</span>
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            ${totalFees.toLocaleString()}
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mb-6 rounded-2xl bg-dark-900 border border-dark-800 p-6"
      >
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-dark-500" />
              <input
                type="text"
                placeholder="Search by symbol or trade ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl bg-dark-800 border border-dark-700 pl-10 pr-4 py-3 text-white placeholder-dark-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
              />
            </div>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-2 bg-dark-800 p-1 rounded-xl">
            <button
              onClick={() => setFilterType('all')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filterType === 'all'
                  ? 'bg-primary-500 text-white'
                  : 'text-dark-400 hover:text-white'
              }`}
            >
              <Filter className="h-4 w-4" />
              All
            </button>
            <button
              onClick={() => setFilterType('buy')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filterType === 'buy'
                  ? 'bg-success-500 text-white'
                  : 'text-dark-400 hover:text-white'
              }`}
            >
              Buy
            </button>
            <button
              onClick={() => setFilterType('sell')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filterType === 'sell'
                  ? 'bg-danger-500 text-white'
                  : 'text-dark-400 hover:text-white'
              }`}
            >
              Sell
            </button>
          </div>
        </div>
      </motion.div>

      {/* Trades Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="rounded-2xl bg-dark-900 border border-dark-800 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-dark-800/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">
                  Trade ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">
                  Symbol
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-dark-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-dark-400 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-dark-400 uppercase tracking-wider">
                  Fees
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-dark-400 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800">
              {filteredTrades.map((trade, index) => (
                <motion.tr
                  key={trade.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.05 }}
                  className="hover:bg-dark-800/30 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white">
                      {trade.date.toLocaleDateString()}
                    </div>
                    <div className="text-xs text-dark-500">
                      {trade.date.toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-mono text-dark-300">{trade.id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-white">{trade.symbol}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        trade.type === 'buy'
                          ? 'bg-success-500/20 text-success-400'
                          : 'bg-danger-500/20 text-danger-400'
                      }`}
                    >
                      {trade.type === 'buy' ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {trade.type.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-mono text-white">{trade.amount}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-mono text-white">
                      ${trade.price.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-mono text-dark-400">
                      ${trade.fees.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-mono font-semibold text-white">
                      ${trade.total.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold bg-success-500/20 text-success-400">
                      {trade.status.toUpperCase()}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}

