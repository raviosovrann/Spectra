import { motion } from 'framer-motion'
import { Download, Filter, Search, TrendingUp, TrendingDown, DollarSign, AlertTriangle, Loader2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import CredentialsGate from '../components/CredentialsGate'
import { useAuth } from '../hooks/useAuth'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

interface TradeRecord {
  tradeId: string
  orderId: string
  symbol: string
  side: 'buy' | 'sell'
  amount: number
  price: number
  fees: number
  totalValue: number
  executedAt: number | null
  status: string
}

interface RawTrade {
  tradeId?: string
  trade_id?: string
  orderId?: string
  order_id?: string
  symbol?: string
  side?: string
  type?: string
  amount?: number | string | null
  price?: number | string | null
  fees?: number | string | null
  totalValue?: number | string | null
  total_value?: number | string | null
  executedAt?: number | string | null
  executed_at?: number | string | null
  status?: string
}

export default function HistoryView() {
  const { user, isLoading: authLoading } = useAuth()
  const hasCoinbaseKeys = Boolean(user?.hasCoinbaseKeys)

  const [trades, setTrades] = useState<TradeRecord[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'buy' | 'sell'>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [refreshCounter, setRefreshCounter] = useState(0)

  useEffect(() => {
    let isMounted = true

    const fetchTrades = async () => {
      if (!hasCoinbaseKeys) {
        setTrades([])
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setFetchError(null)

      try {
        const response = await fetch(`${API_URL}/api/trades`, { credentials: 'include' })
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}))
          throw new Error(payload.error || 'Failed to load trade history')
        }

        const data = await response.json()
        if (!isMounted) return

        const normalized: TradeRecord[] = (data.trades ?? []).map((trade: RawTrade) => {
          const executedRaw = trade.executedAt ?? trade.executed_at
          const executedAt = executedRaw ? new Date(executedRaw).getTime() : null

          return {
            tradeId: String(trade.tradeId ?? trade.trade_id ?? ''),
            orderId: String(trade.orderId ?? trade.order_id ?? ''),
            symbol: String(trade.symbol ?? ''),
            side: ((trade.side ?? trade.type ?? 'buy').toLowerCase() === 'sell' ? 'sell' : 'buy') as 'buy' | 'sell',
            amount: Number(trade.amount) || 0,
            price: Number(trade.price) || 0,
            fees: Number(trade.fees) || 0,
            totalValue: Number(trade.totalValue ?? trade.total_value) || 0,
            executedAt,
            status: String(trade.status ?? 'filled'),
          }
        })

        setTrades(normalized)
      } catch (err) {
        if (!isMounted) return
        setFetchError(err instanceof Error ? err.message : 'Failed to load trade history')
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    if (!authLoading) {
      fetchTrades()
    }

    return () => {
      isMounted = false
    }
  }, [authLoading, hasCoinbaseKeys, refreshCounter])

  const filteredTrades = useMemo(() => {
    const lowercaseQuery = searchQuery.toLowerCase()
    return trades.filter((trade) => {
      const matchesSearch =
        trade.symbol.toLowerCase().includes(lowercaseQuery) ||
        trade.tradeId.toLowerCase().includes(lowercaseQuery) ||
        trade.orderId.toLowerCase().includes(lowercaseQuery)
      const matchesType = filterType === 'all' || trade.side === filterType
      return matchesSearch && matchesType
    })
  }, [trades, searchQuery, filterType])

  const stats = useMemo(() => {
    const totalVolume = trades.reduce((sum, trade) => sum + trade.totalValue, 0)
    const totalFees = trades.reduce((sum, trade) => sum + trade.fees, 0)
    const buyCount = trades.filter((trade) => trade.side === 'buy').length
    const sellCount = trades.filter((trade) => trade.side === 'sell').length
    return { totalVolume, totalFees, buyCount, sellCount }
  }, [trades])

  const exportToCSV = () => {
    if (filteredTrades.length === 0) {
      return
    }

    const headers = ['Executed At', 'Trade ID', 'Order ID', 'Symbol', 'Side', 'Amount', 'Price', 'Fees', 'Total', 'Status']
    const rows = filteredTrades.map((trade) => [
      trade.executedAt ? new Date(trade.executedAt).toISOString() : '',
      trade.tradeId,
      trade.orderId,
      trade.symbol,
      trade.side,
      trade.amount,
      trade.price,
      trade.fees,
      trade.totalValue,
      trade.status,
    ])

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `trade-history-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const renderContent = () => {
    if (isLoading || authLoading) {
      return (
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      )
    }

    if (fetchError) {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center text-dark-300">
          <AlertTriangle className="h-8 w-8 mb-3 text-warning-400" />
          <p className="text-sm mb-4">{fetchError}</p>
          <button
            onClick={() => {
              setFetchError(null)
              setRefreshCounter((count) => count + 1)
            }}
            className="px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold"
          >
            Retry
          </button>
        </div>
      )
    }

    return (
      <div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Trade History</h1>
              <p className="text-dark-400">View and export your trading history</p>
            </div>
            <button
              onClick={exportToCSV}
              disabled={filteredTrades.length === 0}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-all"
            >
              <Download className="h-5 w-5" />
              Export CSV
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl bg-dark-900 p-6 border border-dark-800">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/10">
                <DollarSign className="h-5 w-5 text-primary-400" />
              </div>
              <span className="text-dark-400 text-sm">Total Volume</span>
            </div>
            <div className="text-2xl font-bold text-white font-mono">${stats.totalVolume.toLocaleString()}</div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl bg-dark-900 p-6 border border-dark-800">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success-500/10">
                <TrendingUp className="h-5 w-5 text-success-400" />
              </div>
              <span className="text-dark-400 text-sm">Buy Orders</span>
            </div>
            <div className="text-2xl font-bold text-white">{stats.buyCount}</div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-2xl bg-dark-900 p-6 border border-dark-800">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-danger-500/10">
                <TrendingDown className="h-5 w-5 text-danger-400" />
              </div>
              <span className="text-dark-400 text-sm">Sell Orders</span>
            </div>
            <div className="text-2xl font-bold text-white">{stats.sellCount}</div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="rounded-2xl bg-dark-900 p-6 border border-dark-800">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning-500/10">
                <DollarSign className="h-5 w-5 text-warning-400" />
              </div>
              <span className="text-dark-400 text-sm">Total Fees</span>
            </div>
            <div className="text-2xl font-bold text-white font-mono">${stats.totalFees.toLocaleString()}</div>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mb-6 rounded-2xl bg-dark-900 border border-dark-800 p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-dark-500" />
                <input
                  type="text"
                  placeholder="Search by symbol, trade ID, or order ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl bg-dark-800 border border-dark-700 pl-10 pr-4 py-3 text-white placeholder-dark-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 bg-dark-800 p-1 rounded-xl">
              <button
                onClick={() => setFilterType('all')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filterType === 'all' ? 'bg-primary-500 text-white' : 'text-dark-400 hover:text-white'
                }`}
              >
                <Filter className="h-4 w-4" />
                All
              </button>
              <button
                onClick={() => setFilterType('buy')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filterType === 'buy' ? 'bg-success-500 text-white' : 'text-dark-400 hover:text-white'
                }`}
              >
                Buy
              </button>
              <button
                onClick={() => setFilterType('sell')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filterType === 'sell' ? 'bg-danger-500 text-white' : 'text-dark-400 hover:text-white'
                }`}
              >
                Sell
              </button>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="rounded-2xl bg-dark-900 border border-dark-800 overflow-hidden">
          {filteredTrades.length === 0 ? (
            <div className="p-12 text-center text-dark-400 text-sm">No trades match your filters yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-dark-800/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">Trade ID</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">Symbol</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-dark-400 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-dark-400 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-dark-400 uppercase tracking-wider">Fees</th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-dark-400 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-800">
                  {filteredTrades.map((trade, index) => (
                    <motion.tr key={trade.tradeId} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 + index * 0.03 }} className="hover:bg-dark-800/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">
                          {trade.executedAt ? new Date(trade.executedAt).toLocaleDateString() : '—'}
                        </div>
                        <div className="text-xs text-dark-500">
                          {trade.executedAt ? new Date(trade.executedAt).toLocaleTimeString() : ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono text-dark-300">{trade.tradeId}</div>
                        <div className="text-xs text-dark-500">{trade.orderId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-white">{trade.symbol}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                          trade.side === 'buy' ? 'bg-success-500/20 text-success-400' : 'bg-danger-500/20 text-danger-400'
                        }`}>
                          {trade.side === 'buy' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {trade.side.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-mono text-white">{trade.amount}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-mono text-white">${trade.price.toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-mono text-dark-400">${trade.fees.toFixed(2)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-mono font-semibold text-white">${trade.totalValue.toLocaleString()}</div>
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
          )}
        </motion.div>
      </div>
    )
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    )
  }

  return (
    <CredentialsGate hasCredentials={hasCoinbaseKeys} title="Connect Coinbase to view trade history" description="Spectra pulls filled orders from Coinbase Advanced Trade once your API keys are connected.">
      {renderContent()}
    </CredentialsGate>
  )
}

