import { motion } from 'framer-motion'
import { Bell, Plus, Trash2, Check, Clock } from 'lucide-react'
import { mockAlerts, mockCryptos } from '../data/mockData'
import { useState } from 'react'

export default function AlertsView() {
  const [showCreateForm, setShowCreateForm] = useState(false)

  const getStatusColor = (status: string) => {
    if (status === 'active') return 'bg-success-500/20 text-success-400 border-success-500/30'
    if (status === 'triggered') return 'bg-warning-500/20 text-warning-400 border-warning-500/30'
    return 'bg-dark-700 text-dark-400 border-dark-600'
  }

  const getStatusIcon = (status: string) => {
    if (status === 'active') return Clock
    if (status === 'triggered') return Bell
    return Check
  }

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Alerts</h1>
            <p className="text-dark-400">Manage your price alerts and notifications</p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold transition-all"
          >
            <Plus className="h-5 w-5" />
            Create Alert
          </button>
        </div>
      </motion.div>

      {/* Create Alert Form */}
      {showCreateForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-2xl bg-dark-900 border border-dark-800 p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Create New Alert</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Cryptocurrency
              </label>
              <select className="w-full rounded-xl bg-dark-800 border border-dark-700 px-4 py-3 text-white focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all">
                {mockCryptos.slice(0, 6).map((crypto) => (
                  <option key={crypto.symbol} value={crypto.symbol}>
                    {crypto.name} ({crypto.symbol})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Alert Type</label>
              <select className="w-full rounded-xl bg-dark-800 border border-dark-700 px-4 py-3 text-white focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all">
                <option value="price">Price Alert</option>
                <option value="rsi">RSI Alert</option>
                <option value="volume">Volume Spike</option>
                <option value="sma">SMA Crossover</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Condition</label>
              <select className="w-full rounded-xl bg-dark-800 border border-dark-700 px-4 py-3 text-white focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all">
                <option value="above">Price Above</option>
                <option value="below">Price Below</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Target Value
              </label>
              <input
                type="number"
                placeholder="45000"
                className="w-full rounded-xl bg-dark-800 border border-dark-700 px-4 py-3 text-white placeholder-dark-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all font-mono"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button className="flex-1 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold transition-all">
              Create Alert
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              className="px-6 py-3 rounded-xl bg-dark-800 hover:bg-dark-700 text-white font-semibold transition-all"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl bg-dark-900 p-6 border border-dark-800"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success-500/10">
              <Clock className="h-5 w-5 text-success-400" />
            </div>
            <span className="text-dark-400 text-sm">Active Alerts</span>
          </div>
          <div className="text-3xl font-bold text-white">2</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl bg-dark-900 p-6 border border-dark-800"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning-500/10">
              <Bell className="h-5 w-5 text-warning-400" />
            </div>
            <span className="text-dark-400 text-sm">Triggered Today</span>
          </div>
          <div className="text-3xl font-bold text-white">1</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl bg-dark-900 p-6 border border-dark-800"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/10">
              <Check className="h-5 w-5 text-primary-400" />
            </div>
            <span className="text-dark-400 text-sm">Total Alerts</span>
          </div>
          <div className="text-3xl font-bold text-white">3</div>
        </motion.div>
      </div>

      {/* Alerts List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-2xl bg-dark-900 border border-dark-800 overflow-hidden"
      >
        <div className="p-6 border-b border-dark-800">
          <h3 className="text-lg font-semibold text-white">Your Alerts</h3>
        </div>
        <div className="divide-y divide-dark-800">
          {mockAlerts.map((alert, index) => {
            const StatusIcon = getStatusIcon(alert.status)
            const crypto = mockCryptos.find((c) => c.symbol === alert.symbol)

            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="p-6 hover:bg-dark-800/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500/10 text-primary-400 font-bold text-lg">
                      {crypto?.icon || alert.symbol[0]}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-lg font-semibold text-white">{alert.symbol}</span>
                        <span
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${getStatusColor(
                            alert.status
                          )}`}
                        >
                          <StatusIcon className="h-3.5 w-3.5" />
                          {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                        </span>
                      </div>
                      <div className="text-sm text-dark-300 mb-1">{alert.condition}</div>
                      <div className="text-xs text-dark-500">
                        Created {alert.createdAt.toLocaleDateString()}
                        {alert.triggeredAt &&
                          ` • Triggered ${alert.triggeredAt.toLocaleDateString()}`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {alert.status === 'triggered' && (
                      <button className="px-4 py-2 rounded-lg bg-primary-500/10 text-primary-400 hover:bg-primary-500/20 text-sm font-semibold transition-all">
                        Snooze
                      </button>
                    )}
                    <button className="p-2 rounded-lg bg-danger-500/10 text-danger-400 hover:bg-danger-500/20 transition-all">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* Empty State (if no alerts) */}
      {mockAlerts.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl bg-dark-900 border border-dark-800 p-12 text-center"
        >
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-500/10 mb-4">
            <Bell className="h-8 w-8 text-primary-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No Alerts Yet</h3>
          <p className="text-dark-400 mb-6">
            Create your first alert to get notified about important market movements
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold transition-all"
          >
            <Plus className="h-5 w-5" />
            Create Your First Alert
          </button>
        </motion.div>
      )}
    </div>
  )
}

