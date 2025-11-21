import { motion } from 'framer-motion'
import { Wallet, RefreshCw, AlertCircle, ExternalLink } from 'lucide-react'
import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../../hooks/useAuth'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

interface CoinbaseAccount {
  uuid: string
  name: string
  currency: string
  available_balance: {
    value: string
    currency: string
  }
  hold: {
    value: string
    currency: string
  }
  type: string
  active: boolean
}

export default function WalletSection() {
  const { token, user } = useAuth()
  const [accounts, setAccounts] = useState<CoinbaseAccount[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAccounts = async () => {
    if (!user?.hasCoinbaseKeys) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await axios.get(`${API_URL}/api/wallet/accounts`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setAccounts(response.data.accounts || [])
    } catch (err: unknown) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.error || err.message
        : 'Failed to fetch account balances'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAccounts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.hasCoinbaseKeys])

  const formatBalance = (value: string) => {
    const num = parseFloat(value)
    if (num === 0) return '0.00'
    if (num < 0.01) return num.toFixed(8)
    return num.toFixed(2)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="rounded-2xl bg-dark-800 border border-dark-700 p-8 mb-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-500/10 border border-primary-500/20">
            <Wallet className="h-5 w-5 text-primary-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Wallet Balances</h2>
            <p className="text-sm text-dark-400">View your Coinbase account balances</p>
          </div>
        </div>

        {user?.hasCoinbaseKeys && (
          <button
            onClick={fetchAccounts}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-lg bg-dark-700 border border-dark-600 px-4 py-2 text-sm font-medium text-white hover:bg-dark-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        )}
      </div>

      {/* No API Keys State */}
      {!user?.hasCoinbaseKeys && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-dark-700 border border-dark-600 mb-4">
            <Wallet className="h-8 w-8 text-dark-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No API Keys Configured</h3>
          <p className="text-sm text-dark-400 max-w-md mb-4">
            Configure your Coinbase API credentials above to view your wallet balances and enable trading.
          </p>
        </div>
      )}

      {/* Error State */}
      {error && user?.hasCoinbaseKeys && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg bg-red-500/10 border border-red-500/30 p-4 mb-4 flex items-start gap-3"
        >
          <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-red-400">
            <p className="font-semibold mb-1">Failed to Load Balances</p>
            <p>{error}</p>
          </div>
        </motion.div>
      )}

      {/* Loading State */}
      {isLoading && user?.hasCoinbaseKeys && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg bg-dark-700 border border-dark-600 p-4 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-dark-600 rounded w-24"></div>
                  <div className="h-3 bg-dark-600 rounded w-32"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-5 bg-dark-600 rounded w-20"></div>
                  <div className="h-3 bg-dark-600 rounded w-16"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Accounts List */}
      {!isLoading && !error && accounts.length > 0 && (
        <div className="space-y-3">
          {accounts.map((account) => {
            const availableBalance = parseFloat(account.available_balance.value)
            const heldBalance = parseFloat(account.hold.value)
            const totalBalance = availableBalance + heldBalance

            // Only show accounts with non-zero balance or active accounts
            if (totalBalance === 0 && !account.active) return null

            return (
              <motion.div
                key={account.uuid}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg bg-dark-700 border border-dark-600 p-4 hover:border-dark-500 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-semibold text-white">{account.currency}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-dark-600 text-dark-300">
                        {account.type}
                      </span>
                    </div>
                    <p className="text-sm text-dark-400">{account.name}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-bold text-white">
                      {formatBalance(account.available_balance.value)}
                    </p>
                    <p className="text-xs text-dark-400">Available</p>
                    {heldBalance > 0 && (
                      <p className="text-xs text-yellow-400 mt-1">
                        {formatBalance(account.hold.value)} held
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Empty State - No Balances */}
      {!isLoading && !error && accounts.length === 0 && user?.hasCoinbaseKeys && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-dark-700 border border-dark-600 mb-4">
            <Wallet className="h-8 w-8 text-dark-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No Balances Found</h3>
          <p className="text-sm text-dark-400 max-w-md">
            Your Coinbase account doesn&apos;t have any active balances. Deposit funds to start trading.
          </p>
        </div>
      )}

      {/* Helpful Information */}
      {user?.hasCoinbaseKeys && (
        <div className="mt-6 rounded-lg bg-blue-500/10 border border-blue-500/30 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-400">
              <p className="font-semibold mb-2">Managing Your Funds</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Deposit and withdraw funds directly through your Coinbase account</li>
                <li>Balances shown here are fetched in real-time from Coinbase</li>
                <li>Held funds are temporarily unavailable due to pending orders</li>
              </ul>
              <a
                href="https://www.coinbase.com/settings/payment-methods"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-3 text-blue-300 hover:text-blue-200 transition-colors"
              >
                Manage on Coinbase
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
