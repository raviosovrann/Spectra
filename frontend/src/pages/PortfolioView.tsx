import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, DollarSign, Loader2, AlertCircle } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import CredentialsGate from '../components/CredentialsGate'
import { useAuth } from '../hooks/useAuth'
import { usePortfolioStore } from '../stores/portfolioStore'
import type { Holding as HoldingType } from '../types/portfolio'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

interface PortfolioSummaryState {
  totalValue: number
  cashBalance: number
  change24h: number
  change24hPercent: number
}

interface HistoryPoint {
  timestamp: number
  value: number
  netFlow: number
}

interface RawHolding {
  symbol: string
  quantity?: number | string | null
  averageBuyPrice?: number | string | null
  average_buy_price?: number | string | null
  currentPrice?: number | string | null
  current_price?: number | string | null
  currentValue?: number | string | null
  current_value?: number | string | null
  unrealizedPnL?: number | string | null
  unrealized_pnl?: number | string | null
  unrealizedPnLPercent?: number | string | null
  unrealized_pnl_percent?: number | string | null
}

export default function PortfolioView() {
  const { user, isLoading: authLoading } = useAuth()
  const hasCoinbaseKeys = Boolean(user?.hasCoinbaseKeys)
  const setPortfolioStore = usePortfolioStore((state) => state.setPortfolio)

  const [summary, setSummary] = useState<PortfolioSummaryState>({
    totalValue: 0,
    cashBalance: 0,
    change24h: 0,
    change24hPercent: 0,
  })
  const [holdings, setHoldings] = useState<HoldingType[]>([])
  const [history, setHistory] = useState<HistoryPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshCounter, setRefreshCounter] = useState(0)

  useEffect(() => {
    let isMounted = true

    const fetchPortfolio = async () => {
      if (!hasCoinbaseKeys) {
        setSummary({ totalValue: 0, cashBalance: 0, change24h: 0, change24hPercent: 0 })
        setHoldings([])
        setHistory([])
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const [portfolioResponse, historyResponse] = await Promise.all([
          fetch(`${API_URL}/api/portfolio`, { credentials: 'include' }),
          fetch(`${API_URL}/api/portfolio/history`, { credentials: 'include' }),
        ])

        if (!portfolioResponse.ok) {
          const payload = await portfolioResponse.json().catch(() => ({}))
          throw new Error(payload.error || 'Failed to load portfolio data')
        }

        if (!historyResponse.ok) {
          const payload = await historyResponse.json().catch(() => ({}))
          throw new Error(payload.error || 'Failed to load portfolio history')
        }

        const portfolioData = await portfolioResponse.json()
        const historyData = await historyResponse.json()

        if (!isMounted) return

        const mappedHoldings: HoldingType[] = (portfolioData.holdings ?? []).map((holding: RawHolding) => ({
          symbol: holding.symbol,
          quantity: Number(holding.quantity) || 0,
          averageBuyPrice: Number(holding.averageBuyPrice ?? holding.average_buy_price) || 0,
          currentPrice: Number(holding.currentPrice ?? holding.current_price) || 0,
          currentValue: Number(holding.currentValue ?? holding.current_value) || 0,
          unrealizedPnL: Number(holding.unrealizedPnL ?? holding.unrealized_pnl) || 0,
          unrealizedPnLPercent: Number(holding.unrealizedPnLPercent ?? holding.unrealized_pnl_percent) || 0,
        }))

        const summaryState: PortfolioSummaryState = {
          totalValue: Number(portfolioData.portfolio?.totalValue) || 0,
          cashBalance: Number(portfolioData.portfolio?.cashBalance) || 0,
          change24h: Number(portfolioData.portfolio?.change24h) || 0,
          change24hPercent: Number(portfolioData.portfolio?.change24hPercent) || 0,
        }

        setSummary(summaryState)
        setHoldings(mappedHoldings)
        setHistory(Array.isArray(historyData.history) ? historyData.history : [])

        setPortfolioStore({
          userId: user?.userId ?? '',
          totalValue: summaryState.totalValue,
          cash: summaryState.cashBalance,
          holdings: mappedHoldings,
          change24h: summaryState.change24h,
          change24hPercent: summaryState.change24hPercent,
          lastUpdate: Date.now(),
        })
      } catch (err) {
        if (!isMounted) return
        setError(err instanceof Error ? err.message : 'Failed to load portfolio data')
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    if (!authLoading) {
      fetchPortfolio()
    }

    return () => {
      isMounted = false
    }
  }, [authLoading, hasCoinbaseKeys, refreshCounter, setPortfolioStore, user?.userId])

  const allocationData = useMemo(
    () =>
      holdings
        .filter((holding) => holding.currentValue > 0)
        .map((holding) => ({ name: holding.symbol, value: holding.currentValue })),
    [holdings]
  )

  const chartData = useMemo(
    () =>
      history.map((point) => ({
        timestamp: point.timestamp,
        value: point.value,
      })),
    [history]
  )

  const totalPnL = summary.change24h
  const totalPnLPercent = summary.change24hPercent

  const renderContent = () => {
    if (isLoading || authLoading) {
      return (
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center text-dark-300">
          <AlertCircle className="h-8 w-8 mb-2 text-warning-400" />
          <p className="text-sm mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null)
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
      <>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Portfolio</h1>
          <p className="text-dark-400">Track your holdings and performance</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="md:col-span-2 rounded-2xl bg-gradient-to-br from-primary-500/10 to-primary-600/10 p-8 border border-primary-500/20"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500/20">
                <DollarSign className="h-6 w-6 text-primary-400" />
              </div>
              <span className="text-dark-300">Total Portfolio Value</span>
            </div>
            <div className="text-5xl font-bold text-white mb-2 font-mono">
              ${summary.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 text-lg font-semibold ${totalPnL >= 0 ? 'text-success-400' : 'text-danger-400'}`}>
                {totalPnL >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                <span>
                  {totalPnL >= 0 ? '+' : ''}${Math.abs(totalPnL).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-sm">({totalPnL >= 0 ? '+' : ''}{totalPnLPercent.toFixed(2)}%)</span>
              </div>
              <span className="text-dark-400 text-sm">24h</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl bg-dark-900 p-6 border border-dark-800"
          >
            <div className="text-dark-400 text-sm mb-2">Available Cash</div>
            <div className="text-3xl font-bold text-white mb-4 font-mono">
              ${summary.cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <button className="w-full rounded-xl bg-primary-500/20 text-primary-200 font-semibold py-3 cursor-not-allowed">
              Managed via Coinbase
            </button>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 rounded-2xl bg-dark-900 p-6 border border-dark-800"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Portfolio Performance (30 Days)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(ts) => new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  stroke="#64748b"
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  stroke="#64748b"
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                  labelFormatter={(ts) => new Date(ts).toLocaleDateString()}
                  formatter={(value: number) => [`$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, 'Value']}
                />
                <Line type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-2xl bg-dark-900 p-6 border border-dark-800"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Asset Allocation</h3>
            {allocationData.length === 0 ? (
              <div className="h-[250px] flex flex-col items-center justify-center text-dark-400 text-sm">
                No holdings available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={allocationData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value">
                    {allocationData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                    formatter={(value: number) => `$${value.toLocaleString()}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="grid grid-cols-2 gap-2 mt-4">
              {allocationData.map((item, index) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-sm text-dark-300">{item.name}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl bg-dark-900 border border-dark-800 overflow-hidden"
        >
          <div className="p-6 border-b border-dark-800">
            <h3 className="text-lg font-semibold text-white">Your Holdings</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-800/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">Asset</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-dark-400 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-dark-400 uppercase tracking-wider">Avg Buy Price</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-dark-400 uppercase tracking-wider">Current Price</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-dark-400 uppercase tracking-wider">Value</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-dark-400 uppercase tracking-wider">P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-800">
                {holdings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-dark-400 text-sm">
                      No holdings synced yet
                    </td>
                  </tr>
                ) : (
                  holdings.map((holding, index) => (
                    <motion.tr
                      key={`${holding.symbol}-${index}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + index * 0.05 }}
                      className="hover:bg-dark-800/30 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/10 text-primary-400 font-bold">
                            {holding.symbol[0]}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-white">{holding.symbol}</div>
                            <div className="text-xs text-dark-400">Spot</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-mono text-white">{holding.quantity}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-mono text-white">${holding.averageBuyPrice.toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-mono text-white">${holding.currentPrice.toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-mono font-semibold text-white">
                          ${holding.currentValue.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className={`text-sm font-mono font-semibold ${holding.unrealizedPnL >= 0 ? 'text-success-400' : 'text-danger-400'}`}>
                          {holding.unrealizedPnL >= 0 ? '+' : ''}${Math.abs(holding.unrealizedPnL).toLocaleString()}
                          <div className="text-xs">({holding.unrealizedPnL >= 0 ? '+' : ''}{holding.unrealizedPnLPercent.toFixed(2)}%)</div>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </>
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
    <CredentialsGate
      hasCredentials={hasCoinbaseKeys}
      title="Connect Coinbase to view your portfolio"
      description="We need your Coinbase Advanced Trade API keys to pull positions, balances, and performance."
    >
      {renderContent()}
    </CredentialsGate>
  )
}
