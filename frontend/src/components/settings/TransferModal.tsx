import { useEffect, useMemo, useState } from 'react'
import { X, Loader2, AlertCircle, ShieldCheck } from 'lucide-react'
import axios from 'axios'
import { useAuth } from '../../hooks/useAuth'
import type { CoinbaseAccount, CoinbasePaymentMethod } from '../../types/wallet'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

type TransferMode = 'deposit' | 'withdraw'

interface TransferModalProps {
  isOpen: boolean
  mode: TransferMode
  accounts: CoinbaseAccount[]
  onClose: () => void
  onCompleted: () => Promise<void> | void
}

export default function TransferModal({ isOpen, mode, accounts, onClose, onCompleted }: TransferModalProps) {
  const { token } = useAuth()
  const [paymentMethods, setPaymentMethods] = useState<CoinbasePaymentMethod[]>([])
  const [selectedAccount, setSelectedAccount] = useState<string>('')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('')
  const [amount, setAmount] = useState('')
  const [isLoadingMethods, setIsLoadingMethods] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const fiatAccounts = useMemo(() => {
    return accounts.filter((account) => account.type !== 'ACCOUNT_TYPE_CRYPTO')
  }, [accounts])

  const activeAccount = useMemo(() => {
    return fiatAccounts.find((account) => account.uuid === selectedAccount)
  }, [fiatAccounts, selectedAccount])

  const hasFiatAccounts = fiatAccounts.length > 0

  useEffect(() => {
    if (!isOpen) {
      setAmount('')
      setError(null)
      setSuccessMessage(null)
      return
    }

    const defaultAccount = fiatAccounts[0]
    setSelectedAccount(defaultAccount?.uuid || '')

    const loadPaymentMethods = async () => {
      setIsLoadingMethods(true)
      setError(null)

      try {
        const response = await axios.get(`${API_URL}/api/wallet/payment-methods`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const methods: CoinbasePaymentMethod[] = response.data.paymentMethods || []
        const filtered = methods.filter((method) => {
          if (mode === 'deposit') {
            return method.allow_deposit !== false
          }
          return method.allow_withdraw !== false
        })

        setPaymentMethods(filtered)
        setSelectedPaymentMethod(filtered[0]?.id || '')
      } catch (err: unknown) {
        const message = axios.isAxiosError(err) ? err.response?.data?.error || err.message : 'Failed to load payment methods'
        setError(message)
      } finally {
        setIsLoadingMethods(false)
      }
    }

    loadPaymentMethods()
  }, [isOpen, mode, fiatAccounts, token])

  if (!isOpen) {
    return null
  }

  const title = mode === 'deposit' ? 'Deposit funds' : 'Withdraw funds'
  const actionLabel = mode === 'deposit' ? 'Deposit' : 'Withdraw'
  const isActionDisabled =
    !amount ||
    parseFloat(amount) <= 0 ||
    !selectedAccount ||
    !selectedPaymentMethod ||
    isSubmitting ||
    isLoadingMethods

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (isActionDisabled) return

    setIsSubmitting(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const endpoint = mode === 'deposit' ? '/api/wallet/deposits' : '/api/wallet/withdrawals'
      await axios.post(
        `${API_URL}${endpoint}`,
        {
          accountId: selectedAccount,
          paymentMethodId: selectedPaymentMethod,
          amount,
          currency: activeAccount?.currency || 'USD',
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      setSuccessMessage(`${actionLabel} request submitted successfully.`)
      await onCompleted()
    } catch (err: unknown) {
      const message = axios.isAxiosError(err) ? err.response?.data?.error || err.message : `Failed to ${mode}`
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg rounded-2xl bg-dark-900 border border-dark-700 shadow-2xl">
        <div className="flex items-center justify-between border-b border-dark-700 px-6 py-4">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-primary-300">{mode === 'deposit' ? 'Add funds' : 'Move funds'}</p>
            <h2 className="text-2xl font-semibold text-white mt-1">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-dark-800 text-dark-300 hover:text-white hover:bg-dark-700 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-danger-500/30 bg-danger-500/10 p-3 text-danger-200 text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-start gap-2 rounded-xl border border-success-500/30 bg-success-500/10 p-3 text-success-200 text-sm">
              <ShieldCheck className="h-4 w-4 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          <div>
            <label className="flex items-center justify-between text-sm font-medium text-dark-300 mb-1">
              Select account
              <span className="text-xs text-dark-500">Fiat balances only</span>
            </label>
            <select
              value={selectedAccount}
              onChange={(event) => setSelectedAccount(event.target.value)}
              className="w-full rounded-xl bg-dark-800 border border-dark-700 px-4 py-2.5 text-white focus:border-primary-500 focus:outline-none"
              disabled={!hasFiatAccounts}
            >
              {!hasFiatAccounts && <option value="">No fiat accounts detected</option>}
              {fiatAccounts.map((account) => (
                <option key={account.uuid} value={account.uuid}>
                  {account.name || account.currency} · Available {account.available_balance.value} {account.currency}
                </option>
              ))}
            </select>
            {!hasFiatAccounts && (
              <p className="mt-2 text-xs text-warning-300">
                Coinbase did not return any fiat funding accounts. Create or enable a USD wallet inside Coinbase and refresh.
              </p>
            )}
          </div>

          <div>
            <label className="flex items-center justify-between text-sm font-medium text-dark-300 mb-1">
              Payment method
              {isLoadingMethods && <span className="text-xs text-dark-500">Loading…</span>}
            </label>
            <select
              value={selectedPaymentMethod}
              onChange={(event) => setSelectedPaymentMethod(event.target.value)}
              className="w-full rounded-xl bg-dark-800 border border-dark-700 px-4 py-2.5 text-white focus:border-primary-500 focus:outline-none disabled:opacity-50"
              disabled={isLoadingMethods || paymentMethods.length === 0}
            >
              {paymentMethods.length === 0 && <option value="">No eligible payment methods</option>}
              {paymentMethods.map((method) => (
                <option key={method.id} value={method.id}>
                  {(method.name || method.type || 'Payment method').concat(method.currency ? ` · ${method.currency}` : '')}
                </option>
              ))}
            </select>
            {paymentMethods.length === 0 && !isLoadingMethods && !error && (
              <p className="mt-2 text-xs text-warning-300">
                Connect an ACH-enabled bank account or card inside Coinbase, then return here and tap Refresh.
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-dark-300 mb-1 block">Amount ({activeAccount?.currency || 'USD'})</label>
            <input
              type="number"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              min="0"
              step="0.01"
              placeholder="0.00"
              className="w-full rounded-xl bg-dark-800 border border-dark-700 px-4 py-2.5 text-white focus:border-primary-500 focus:outline-none"
            />
          </div>

          <div className="rounded-xl bg-dark-800/60 border border-dark-700 p-3 text-xs text-dark-300">
            Requests are sent securely to Coinbase using your personal API keys. Funds move using the payment
            method you selected. Processing time depends on your bank and Coinbase policies.
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-dark-600 text-sm font-medium text-dark-300 hover:text-white hover:border-dark-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isActionDisabled}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors ${
                isActionDisabled
                  ? 'bg-dark-600 text-dark-300 cursor-not-allowed'
                  : mode === 'deposit'
                    ? 'bg-success-500 text-white hover:bg-success-600'
                    : 'bg-danger-500 text-white hover:bg-danger-600'
              }`}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isSubmitting ? 'Processing' : `${actionLabel} now`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
