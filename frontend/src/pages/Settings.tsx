import { motion } from 'framer-motion'
import { Key, Save, AlertCircle, CheckCircle } from 'lucide-react'
import { useState } from 'react'
import axios from 'axios'
import { useAuth } from '../hooks/useAuth'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export default function Settings() {
  const { token, user } = useAuth()
  const [apiKey, setApiKey] = useState('')
  const [apiSecret, setApiSecret] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showSecretInput, setShowSecretInput] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!apiKey || !apiSecret) {
      setError('Both API key and secret are required')
      return
    }

    setIsLoading(true)

    try {
      await axios.patch(
        `${API_URL}/api/users/coinbase-keys`,
        {
          apiKey,
          apiSecret,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      setSuccess(true)
      setApiKey('')
      setApiSecret('')
      setShowSecretInput(false)

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: unknown) {
      const errorMessage = axios.isAxiosError(err) ? err.response?.data?.error || err.message : 'Failed to update credentials'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-900 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-dark-400">Manage your account and API credentials</p>
        </motion.div>

        {/* Coinbase API Credentials Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl bg-dark-800 border border-dark-700 p-8 mb-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-500/10 border border-primary-500/20">
              <Key className="h-5 w-5 text-primary-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Coinbase API Credentials</h2>
              <p className="text-sm text-dark-400">
                {user?.hasCoinbaseKeys ? 'API credentials configured' : 'No API credentials configured'}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          {user?.hasCoinbaseKeys && (
            <div className="mb-6 flex items-center gap-2 rounded-lg bg-green-500/10 border border-green-500/30 p-3">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span className="text-sm text-green-400">API credentials are configured and encrypted</span>
            </div>
          )}

          {/* Warning */}
          <div className="mb-6 flex items-start gap-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 p-4">
            <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-yellow-400">
              <p className="font-semibold mb-1">Security Notice</p>
              <p>Your API credentials are encrypted with AES-256-GCM and stored securely. Never share your API secret.</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400"
              >
                {error}
              </motion.div>
            )}

            {/* Success Message */}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg bg-green-500/10 border border-green-500/30 p-3 text-sm text-green-400 flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Credentials updated successfully
              </motion.div>
            )}

            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium text-dark-300 mb-2">
                Coinbase API Key
              </label>
              <input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value)
                  setError(null)
                }}
                placeholder="Enter your Coinbase API key"
                className="w-full rounded-lg bg-dark-700 border border-dark-600 px-4 py-3 text-white placeholder-dark-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all disabled:opacity-50"
                required
                disabled={isLoading}
              />
              <p className="text-xs text-dark-400 mt-1">From Coinbase Advanced Trade API settings</p>
            </div>

            <div>
              <label htmlFor="apiSecret" className="block text-sm font-medium text-dark-300 mb-2">
                Coinbase API Secret
              </label>
              <div className="relative">
                <input
                  id="apiSecret"
                  type={showSecretInput ? 'text' : 'password'}
                  value={apiSecret}
                  onChange={(e) => {
                    setApiSecret(e.target.value)
                    setError(null)
                  }}
                  placeholder="Enter your Coinbase API secret"
                  className="w-full rounded-lg bg-dark-700 border border-dark-600 px-4 py-3 text-white placeholder-dark-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all disabled:opacity-50"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowSecretInput(!showSecretInput)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-300 text-sm"
                  disabled={isLoading}
                >
                  {showSecretInput ? 'Hide' : 'Show'}
                </button>
              </div>
              <p className="text-xs text-dark-400 mt-1">Keep this secret safe and never share it</p>
            </div>

            <button
              type="submit"
              disabled={isLoading || !apiKey || !apiSecret}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-3 text-base font-semibold text-white hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-5 w-5" />
              {isLoading ? 'Saving...' : 'Save Credentials'}
            </button>
          </form>
        </motion.div>

        {/* Account Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl bg-dark-800 border border-dark-700 p-8"
        >
          <h2 className="text-xl font-semibold text-white mb-6">Account Information</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-400 mb-1">Full Name</label>
              <p className="text-white">{user?.fullName}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-400 mb-1">Username</label>
              <p className="text-white">{user?.username}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-400 mb-1">Email Address</label>
              <p className="text-white">{user?.emailAddress}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-400 mb-1">Member Since</label>
              <p className="text-white">{new Date(user?.createdAt || '').toLocaleDateString()}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
