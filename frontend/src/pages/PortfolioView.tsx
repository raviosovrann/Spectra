import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, DollarSign, PieChart as PieChartIcon } from 'lucide-react'
import { mockHoldings, generatePriceHistory } from '../data/mockData'
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

export default function PortfolioView() {
  const totalValue = mockHoldings.reduce((sum, h) => sum + h.currentValue, 0)
  const totalPnL = mockHoldings.reduce((sum, h) => sum + h.unrealizedPnL, 0)
  const totalPnLPercent = (totalPnL / (totalValue - totalPnL)) * 100
  const cashBalance = 15234.56

  // Portfolio allocation data for pie chart
  const allocationData = mockHoldings.map((h) => ({
    name: h.symbol,
    value: h.currentValue,
  }))

  const COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

  // Generate portfolio history
  const portfolioHistory = generatePriceHistory(totalValue, 30)

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-bold text-white mb-2">Portfolio</h1>
        <p className="text-dark-400">Track your holdings and performance</p>
      </motion.div>

      {/* Portfolio Summary */}
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
            ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 text-lg font-semibold ${totalPnL >= 0 ? 'text-success-400' : 'text-danger-400'}`}>
              {totalPnL >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
              <span>
                {totalPnL >= 0 ? '+' : ''}${Math.abs(totalPnL).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-sm">
                ({totalPnL >= 0 ? '+' : ''}{totalPnLPercent.toFixed(2)}%)
              </span>
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
            ${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <button className="w-full rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 transition-colors">
            Add Funds
          </button>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Portfolio History Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 rounded-2xl bg-dark-900 p-6 border border-dark-800"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Portfolio Performance (30 Days)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={portfolioHistory}>
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
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#fff',
                }}
                labelFormatter={(ts) => new Date(ts).toLocaleDateString()}
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Value']}
              />
              <Line type="monotone" dataKey="price" stroke="#0ea5e9" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Allocation Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl bg-dark-900 p-6 border border-dark-800"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Asset Allocation</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={allocationData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {allocationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#fff',
                }}
                formatter={(value: number) => `$${value.toLocaleString()}`}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {allocationData.map((item, index) => (
              <div key={item.name} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-sm text-dark-300">{item.name}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Holdings Table */}
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
                <th className="px-6 py-4 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">
                  Asset
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-dark-400 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-dark-400 uppercase tracking-wider">
                  Avg Buy Price
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-dark-400 uppercase tracking-wider">
                  Current Price
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-dark-400 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-dark-400 uppercase tracking-wider">
                  P&L
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800">
              {mockHoldings.map((holding, index) => (
                <motion.tr
                  key={holding.symbol}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="hover:bg-dark-800/30 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/10 text-primary-400 font-bold">
                        {holding.symbol[0]}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{holding.symbol}</div>
                        <div className="text-xs text-dark-400">{holding.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-mono text-white">{holding.quantity}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-mono text-white">
                      ${holding.averageBuyPrice.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-mono text-white">
                      ${holding.currentPrice.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-mono font-semibold text-white">
                      ${holding.currentValue.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div
                      className={`text-sm font-mono font-semibold ${
                        holding.unrealizedPnL >= 0 ? 'text-success-400' : 'text-danger-400'
                      }`}
                    >
                      {holding.unrealizedPnL >= 0 ? '+' : ''}$
                      {Math.abs(holding.unrealizedPnL).toLocaleString()}
                      <div className="text-xs">
                        ({holding.unrealizedPnL >= 0 ? '+' : ''}
                        {holding.unrealizedPnLPercent.toFixed(2)}%)
                      </div>
                    </div>
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
