import { motion } from 'framer-motion'
import { Wallet, RefreshCw, AlertCircle, ExternalLink } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { useAuth } from '../../hooks/useAuth'
import TransferModal from './TransferModal'

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
  const hasCredentials = Boolean(user?.hasCoinbaseKeys)
  const [accounts, setAccounts] = useState<CoinbaseAccount[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false)
  const [transferMode, setTransferMode] = useState<'deposit' | 'withdraw'>('deposit')

  const fetchAccounts = useCallback(async () => {
    if (!hasCredentials) {
      setAccounts([])
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
  }, [hasCredentials, token])

  const openTransferModal = (mode: 'deposit' | 'withdraw') => {
    setTransferMode(mode)
    setIsTransferModalOpen(true)
  }

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

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

        {hasCredentials && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => openTransferModal('deposit')}
              className="rounded-lg bg-primary-500/90 hover:bg-primary-500 text-white text-sm font-semibold px-4 py-2 transition-colors shadow-lg shadow-primary-500/20"
            >
              Deposit
            </button>
            <button
              onClick={() => openTransferModal('withdraw')}
              className="rounded-lg bg-dark-700 hover:bg-dark-600 text-white text-sm font-semibold px-4 py-2 border border-dark-600 transition-colors"
            >
              Withdraw
            </button>
            <button
              onClick={fetchAccounts}
              disabled={isLoading}
              className="flex items-center gap-2 rounded-lg bg-dark-700 border border-dark-600 px-3 py-2 text-xs font-semibold text-white hover:bg-dark-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => {
            const availableBalance = parseFloat(account.available_balance.value)
            const heldBalance = parseFloat(account.hold.value)
            const totalBalance = availableBalance + heldBalance

            // Only show accounts with non-zero balance to avoid clutter
            if (totalBalance <= 0) return null

            return (
              <motion.div
                key={account.uuid}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-xl bg-dark-700/50 border border-dark-600 p-5 hover:border-primary-500/50 hover:bg-dark-700 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {/* Crypto Icon Placeholder */}
                    <div className="h-10 w-10 rounded-full bg-dark-600 flex items-center justify-center text-white font-bold text-sm border border-dark-500 group-hover:border-primary-500/30 transition-colors">
                      {account.currency.substring(0, 3)}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white leading-none mb-1">{account.currency}</h3>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-dark-600 text-dark-300 border border-dark-500/50">
                        {account.type === 'ACCOUNT_TYPE_CRYPTO' ? 'Crypto' : 'Fiat'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-2xl font-bold text-white tracking-tight">
                    {formatBalance(account.available_balance.value)}
                  </p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-dark-400">Available Balance</span>
                    {heldBalance > 0 && (
                      <span className="text-yellow-400 font-medium flex items-center gap-1">
                        {formatBalance(account.hold.value)} held
                      </span>
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
      {hasCredentials && (
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

      {hasCredentials && (
        <TransferModal
          isOpen={isTransferModalOpen}
          mode={transferMode}
          accounts={accounts}
          onClose={() => setIsTransferModalOpen(false)}
          onCompleted={fetchAccounts}
        />
      )}
    </motion.div>
  )
}
