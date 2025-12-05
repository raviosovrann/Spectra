import { motion } from 'framer-motion'
import { Bell, Plus, Trash2, Check, Clock, AlertTriangle, Loader2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import CredentialsGate from '../components/CredentialsGate'
import { useAuth } from '../hooks/useAuth'
import { useNotificationStore } from '../stores/notificationStore'
import { useRef } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const SUPPORTED_SYMBOLS = [
  'BTC-USD', 'ETH-USD', 'SOL-USD', 'ADA-USD', 'DOGE-USD', 'XRP-USD', 'DOT-USD', 'AVAX-USD',
  'POL-USD', 'LINK-USD', 'UNI-USD', 'ATOM-USD', 'LTC-USD', 'BCH-USD', 'ALGO-USD', 'XLM-USD',
  'AAVE-USD', 'NEAR-USD', 'APT-USD', 'ARB-USD'
]
const ALERT_TYPE_LABELS: Record<string, string> = {
  price: 'Price Alert',
  rsi: 'RSI Alert',
  volume: 'Volume Spike',
  sma_crossover: 'SMA Crossover',
  volatility: 'Volatility Alert',
}

interface AlertRecord {
  alertId: string
  symbol: string
  alertType: string
  condition: Record<string, unknown>
  status: string
  createdAt: string
  triggeredAt?: string | null
}

interface FormState {
  symbol: string
  alertType: string
  direction: 'above' | 'below'
  target: string
}
interface RawAlert {
  alertId?: string
  alert_id?: string
  symbol?: string
  alertType?: string
  alert_type?: string
  condition?: Record<string, unknown>
  status?: string
  createdAt?: string
  created_at?: string
  triggeredAt?: string | null
  triggered_at?: string | null
}

const normalizeAlert = (alert: RawAlert): AlertRecord => ({
  alertId: String(alert.alertId ?? alert.alert_id ?? ''),
  symbol: String(alert.symbol ?? ''),
  alertType: String(alert.alertType ?? alert.alert_type ?? ''),
  condition: alert.condition ?? {},
  status: String(alert.status ?? 'active'),
  createdAt: String(alert.createdAt ?? alert.created_at ?? ''),
  triggeredAt: alert.triggeredAt ?? alert.triggered_at ?? null,
})

export default function AlertsView() {
  const { user, isLoading: authLoading } = useAuth()
  const hasCoinbaseKeys = Boolean(user?.hasCoinbaseKeys)
  const { push } = useNotificationStore()
  const prevStatusMap = useRef<Map<string, string>>(new Map())

  const [alerts, setAlerts] = useState<AlertRecord[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [bannerError, setBannerError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [refreshCounter, setRefreshCounter] = useState(0)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [formState, setFormState] = useState<FormState>({
    symbol: SUPPORTED_SYMBOLS[0],
    alertType: 'price',
    direction: 'above',
    target: '',
  })

  useEffect(() => {
    let isMounted = true

    const fetchAlerts = async () => {
      if (!hasCoinbaseKeys) {
        setAlerts([])
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setFetchError(null)

      try {
        const response = await fetch(`${API_URL}/api/alerts`, { credentials: 'include' })

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}))
          throw new Error(payload.error || 'Failed to load alerts')
        }

        const data = await response.json()
        if (!isMounted) return

        const normalized: AlertRecord[] = (data.alerts ?? []).map((alert: RawAlert) => normalizeAlert(alert))

        // Detect newly triggered alerts and raise toast (fallback if websocket missed)
        normalized.forEach((alert) => {
          const prevStatus = prevStatusMap.current.get(alert.alertId)
          if (alert.status === 'triggered' && prevStatus !== 'triggered') {
            const priceText = alert.condition?.target ? `$${Number(alert.condition.target).toLocaleString()}` : ''
            push({
              title: `${alert.symbol} alert triggered`,
              message: priceText ? `${alert.symbol} crossed ${priceText}` : 'Price condition met',
              variant: 'warning',
            })
          }
          prevStatusMap.current.set(alert.alertId, alert.status)
        })

        setAlerts(normalized)
      } catch (err) {
        if (!isMounted) return
        setFetchError(err instanceof Error ? err.message : 'Failed to load alerts')
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    if (!authLoading) {
      fetchAlerts()
    }

    return () => {
      isMounted = false
    }
  }, [authLoading, hasCoinbaseKeys, refreshCounter])

  const stats = useMemo(() => {
    const active = alerts.filter((alert) => alert.status === 'active').length
    const triggeredToday = alerts.filter((alert) => {
      if (!alert.triggeredAt) return false
      const triggeredDate = new Date(alert.triggeredAt)
      const now = new Date()
      return triggeredDate.toDateString() === now.toDateString()
    }).length

    return { active, triggeredToday, total: alerts.length }
  }, [alerts])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success-500/20 text-success-400 border-success-500/30'
      case 'triggered':
        return 'bg-warning-500/20 text-warning-400 border-warning-500/30'
      case 'snoozed':
        return 'bg-primary-500/10 text-primary-300 border-primary-500/30'
      default:
        return 'bg-dark-700 text-dark-400 border-dark-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return Clock
      case 'triggered':
        return Bell
      default:
        return Check
    }
  }

  const formatCondition = (alert: AlertRecord) => {
    const condition = alert.condition || {}
    const direction = (condition.direction as string) || 'above'
    const target = Number(condition.target ?? condition.price ?? condition.value)
    if (alert.alertType === 'price' && Number.isFinite(target)) {
      return `Price ${direction === 'below' ? 'below' : 'above'} $${target.toLocaleString()}`
    }

    if (alert.alertType === 'rsi' && Number.isFinite(target)) {
      return `RSI ${direction === 'below' ? '<' : '>'} ${target}`
    }

    return `${ALERT_TYPE_LABELS[alert.alertType] || alert.alertType}`
  }

  const handleCreateAlert = async () => {
    if (!formState.target || Number(formState.target) <= 0) {
      setFormError('Please provide a valid target value')
      return
    }

    setSubmitting(true)
    setFormError(null)
    setBannerError(null)

    try {
      const response = await fetch(`${API_URL}/api/alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          symbol: formState.symbol,
          alertType: formState.alertType,
          condition: {
            direction: formState.direction,
            target: Number(formState.target),
          },
        }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error || 'Failed to create alert')
      }

      const data = await response.json()
      if (data.alert) {
        const normalized = normalizeAlert(data.alert as RawAlert)
        setAlerts((prev) => [normalized, ...prev])
      }

      setShowCreateForm(false)
      setFormState({ symbol: SUPPORTED_SYMBOLS[0], alertType: 'price', direction: 'above', target: '' })
    } catch (err) {
      setBannerError(err instanceof Error ? err.message : 'Failed to create alert')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteAlert = async (alertId: string) => {
    setDeletingId(alertId)
    setBannerError(null)

    try {
      const response = await fetch(`${API_URL}/api/alerts/${alertId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error || 'Failed to delete alert')
      }

      setAlerts((prev) => prev.filter((alert) => alert.alertId !== alertId))
    } catch (err) {
      setBannerError(err instanceof Error ? err.message : 'Failed to delete alert')
    } finally {
      setDeletingId(null)
    }
  }

  const handleUpdateStatus = async (alertId: string, status: string) => {
    setBannerError(null)

    try {
      const response = await fetch(`${API_URL}/api/alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error || 'Failed to update alert')
      }

      const data = await response.json()
      if (data.alert) {
        const normalized = normalizeAlert(data.alert as RawAlert)
        setAlerts((prev) => prev.map((alert) => (alert.alertId === alertId ? normalized : alert)))
      } else {
        setRefreshCounter((count) => count + 1)
      }
    } catch (err) {
      setBannerError(err instanceof Error ? err.message : 'Failed to update alert')
    }
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
      <>
        {bannerError && (
          <div className="mb-4 flex items-start justify-between gap-4 rounded-2xl border border-warning-500/30 bg-warning-500/10 px-4 py-3 text-warning-100">
            <span className="text-sm">{bannerError}</span>
            <button onClick={() => setBannerError(null)} className="text-xs font-semibold uppercase tracking-wide text-warning-200">
              Dismiss
            </button>
          </div>
        )}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Alerts</h1>
              <p className="text-dark-400">Manage your price alerts and notifications</p>
            </div>
            <button
              onClick={() =>
                setShowCreateForm((prev) => {
                  const next = !prev
                  if (!next) {
                    setFormError(null)
                  }
                  return next
                })
              }
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold transition-all"
            >
              <Plus className="h-5 w-5" />
              {showCreateForm ? 'Hide Form' : 'Create Alert'}
            </button>
          </div>
        </motion.div>

        {showCreateForm && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 rounded-2xl bg-dark-900 border border-dark-800 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Create New Alert</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Instrument</label>
                <select
                  value={formState.symbol}
                  onChange={(e) => setFormState((prev) => ({ ...prev, symbol: e.target.value }))}
                  className="w-full rounded-xl bg-dark-800 border border-dark-700 px-4 py-3 text-white focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                >
                  {SUPPORTED_SYMBOLS.map((symbol) => (
                    <option key={symbol} value={symbol}>
                      {symbol}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Alert Type</label>
                <select
                  value={formState.alertType}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, alertType: e.target.value, direction: 'above' }))
                  }
                  className="w-full rounded-xl bg-dark-800 border border-dark-700 px-4 py-3 text-white focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                >
                  {Object.entries(ALERT_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Condition</label>
                <select
                  value={formState.direction}
                  onChange={(e) => setFormState((prev) => ({ ...prev, direction: e.target.value as FormState['direction'] }))}
                  className="w-full rounded-xl bg-dark-800 border border-dark-700 px-4 py-3 text-white focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                >
                  <option value="above">Price Above</option>
                  <option value="below">Price Below</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Target Value</label>
                <input
                  type="number"
                  value={formState.target}
                  onChange={(e) => setFormState((prev) => ({ ...prev, target: e.target.value }))}
                  placeholder="45000"
                  className="w-full rounded-xl bg-dark-800 border border-dark-700 px-4 py-3 text-white placeholder-dark-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all font-mono"
                />
              </div>
            </div>
            {formError && <p className="text-sm text-danger-400 mt-3">{formError}</p>}
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleCreateAlert}
                disabled={submitting}
                className="flex-1 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold transition-all"
              >
                {submitting ? 'Creating...' : 'Create Alert'}
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(false)
                  setFormError(null)
                }}
                className="px-6 py-3 rounded-xl bg-dark-800 hover:bg-dark-700 text-white font-semibold transition-all"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl bg-dark-900 p-6 border border-dark-800">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success-500/10">
                <Clock className="h-5 w-5 text-success-400" />
              </div>
              <span className="text-dark-400 text-sm">Active Alerts</span>
            </div>
            <div className="text-3xl font-bold text-white">{stats.active}</div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl bg-dark-900 p-6 border border-dark-800">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning-500/10">
                <Bell className="h-5 w-5 text-warning-400" />
              </div>
              <span className="text-dark-400 text-sm">Triggered Today</span>
            </div>
            <div className="text-3xl font-bold text-white">{stats.triggeredToday}</div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-2xl bg-dark-900 p-6 border border-dark-800">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/10">
                <Check className="h-5 w-5 text-primary-400" />
              </div>
              <span className="text-dark-400 text-sm">Total Alerts</span>
            </div>
            <div className="text-3xl font-bold text-white">{stats.total}</div>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="rounded-2xl bg-dark-900 border border-dark-800 overflow-hidden">
          <div className="p-6 border-b border-dark-800 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Your Alerts</h3>
            <span className="text-xs text-dark-400">Synced with Coinbase Advanced Trade</span>
          </div>
          {alerts.length === 0 ? (
            <div className="p-12 text-center text-dark-400 text-sm">No alerts yet. Create one to get notified.</div>
          ) : (
            <div className="divide-y divide-dark-800">
              {alerts.map((alert, index) => {
                const StatusIcon = getStatusIcon(alert.status)
                return (
                  <motion.div key={alert.alertId} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + index * 0.05 }} className="p-6 hover:bg-dark-800/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500/10 text-primary-400 font-bold text-lg">
                          {alert.symbol.slice(0, 3)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-lg font-semibold text-white">{alert.symbol}</span>
                            <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${getStatusColor(alert.status)}`}>
                              <StatusIcon className="h-3.5 w-3.5" />
                              {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                            </span>
                          </div>
                          <div className="text-sm text-dark-300 mb-1">{formatCondition(alert)}</div>
                          <div className="text-xs text-dark-500">
                            Created {new Date(alert.createdAt).toLocaleDateString()}
                            {alert.triggeredAt && ` • Triggered ${new Date(alert.triggeredAt).toLocaleDateString()}`}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {alert.status === 'triggered' && (
                          <button
                            onClick={() => handleUpdateStatus(alert.alertId, 'snoozed')}
                            className="px-4 py-2 rounded-lg bg-primary-500/10 text-primary-400 hover:bg-primary-500/20 text-sm font-semibold transition-all"
                          >
                            Snooze
                          </button>
                        )}
                        {alert.status === 'snoozed' && (
                          <button
                            onClick={() => handleUpdateStatus(alert.alertId, 'active')}
                            className="px-4 py-2 rounded-lg bg-dark-800 text-white hover:bg-dark-700 text-sm font-semibold transition-all"
                          >
                            Activate
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteAlert(alert.alertId)}
                          disabled={deletingId === alert.alertId}
                          className="p-2 rounded-lg bg-danger-500/10 text-danger-400 hover:bg-danger-500/20 disabled:opacity-50 transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>

        {alerts.length === 0 && !showCreateForm && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="rounded-2xl bg-dark-900 border border-dark-800 p-12 text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-500/10 mb-4">
              <Bell className="h-8 w-8 text-primary-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No Alerts Yet</h3>
            <p className="text-dark-400 mb-6">Create your first alert to get notified about important market moves.</p>
            <button onClick={() => setShowCreateForm(true)} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold transition-all">
              <Plus className="h-5 w-5" />
              Create Your First Alert
            </button>
          </motion.div>
        )}
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
    <CredentialsGate hasCredentials={hasCoinbaseKeys} title="Connect Coinbase to manage alerts" description="Spectra syncs alerts directly with Coinbase Advanced Trade. Add your API keys to create and monitor alerts.">
      {renderContent()}
    </CredentialsGate>
  )
}

