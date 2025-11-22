import { motion, AnimatePresence } from 'framer-motion'
import { Key, Save, AlertCircle, CheckCircle, Eye, EyeOff, Edit2, Shield, Lock, Trash2, ArrowLeft } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../hooks/useAuth'
import WalletSection from '../components/settings/WalletSection'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

interface DeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isLoading: boolean
}

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, isLoading }: DeleteModalProps) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-dark-800 rounded-xl border border-dark-700 shadow-2xl max-w-md w-full overflow-hidden"
      >
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0 border border-red-500/20">
              <AlertCircle className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Delete Credentials?</h3>
              <p className="text-sm text-dark-400">This action cannot be undone.</p>
            </div>
          </div>
          
          <p className="text-dark-300 mb-6 leading-relaxed">
            Are you sure you want to remove your Coinbase API keys? You will lose access to trading and portfolio tracking until you re-connect.
          </p>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-lg bg-dark-700 hover:bg-dark-600 text-white font-medium transition-colors border border-dark-600"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium transition-colors shadow-lg shadow-red-600/20 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                 <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete Credentials
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default function Settings() {
  const navigate = useNavigate()
  const { token, user, refreshUser } = useAuth()
  const [apiKey, setApiKey] = useState('')
  const [apiSecret, setApiSecret] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  // UI States
  const [isEditing, setIsEditing] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [showApiSecret, setShowApiSecret] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Initialize edit mode based on whether keys exist
  useEffect(() => {
    if (user && !user.hasCoinbaseKeys) {
      setIsEditing(true)
    }
  }, [user])

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
      await refreshUser() // Refresh user data to update hasCoinbaseKeys status
      
      // Close immediately after success
      setSuccess(false)
      setIsEditing(false)
      setApiKey('')
      setApiSecret('')
    } catch (err: unknown) {
      const errorMessage = axios.isAxiosError(err) ? err.response?.data?.error || err.message : 'Failed to update credentials'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    setError(null)
    setIsLoading(true)

    try {
      await axios.delete(`${API_URL}/api/users/coinbase-keys`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      await refreshUser() // Refresh user data to update hasCoinbaseKeys status
      setIsEditing(true) // Switch to edit mode (empty form)
      setShowDeleteConfirm(false)
      setApiKey('')
      setApiSecret('')
    } catch (err: unknown) {
      const errorMessage = axios.isAxiosError(err) ? err.response?.data?.error || err.message : 'Failed to delete credentials'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleEdit = () => {
    setIsEditing(!isEditing)
    setError(null)
    setSuccess(false)
    setShowDeleteConfirm(false)
    // Reset form when cancelling edit
    if (isEditing) {
      setApiKey('')
      setApiSecret('')
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-2 text-dark-400 hover:text-white transition-colors mb-4"
      >
        <ArrowLeft className="h-5 w-5" />
        <span className="font-medium">Back to Dashboard</span>
      </button>

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
          className="rounded-2xl bg-dark-800 border border-dark-700 overflow-hidden mb-8"
        >
          <div className="p-6 border-b border-dark-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-500/10 border border-primary-500/20">
                <Key className="h-5 w-5 text-primary-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Coinbase API Credentials</h2>
                <p className="text-sm text-dark-400">
                  Configure your Coinbase Advanced Trade API keys
                </p>
              </div>
            </div>
            
            {user?.hasCoinbaseKeys && !isEditing && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-2 rounded-lg bg-dark-700 hover:bg-red-500/10 hover:text-red-400 text-dark-400 transition-colors border border-dark-600"
                  title="Delete Credentials"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                
                <button
                  onClick={toggleEdit}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-dark-700 hover:bg-dark-600 text-white text-sm font-medium transition-colors border border-dark-600"
                >
                  <Edit2 className="h-4 w-4" />
                  Edit Credentials
                </button>
              </div>
            )}
          </div>

          <div className="p-6">
            {/* Configured State */}
            {user?.hasCoinbaseKeys && !isEditing ? (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-8 text-center"
              >
                <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4 border border-green-500/20">
                  <Shield className="h-8 w-8 text-green-400" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Credentials Configured & Encrypted</h3>
                <p className="text-dark-400 max-w-md mb-6">
                  Your API keys are securely stored using AES-256-GCM encryption. 
                  You can manage your wallet and trading features below.
                </p>
                <div className="flex items-center gap-2 text-xs text-dark-500 bg-dark-900/50 px-3 py-1.5 rounded-full border border-dark-700">
                  <Lock className="h-3 w-3" />
                  <span>End-to-end encrypted</span>
                </div>
              </motion.div>
            ) : (
              /* Edit/Create Form */
              <motion.form 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                onSubmit={handleSubmit} 
                className="space-y-6"
              >
                {/* Security Notice */}
                <div className="flex items-start gap-3 rounded-lg bg-blue-500/10 border border-blue-500/20 p-4">
                  <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-300">
                    <p className="font-semibold mb-1">Security First</p>
                    <p>Your API Secret is never displayed after saving. We use industry-standard AES-256-GCM encryption to secure your credentials.</p>
                  </div>
                </div>

                {/* Error Message */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400"
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Success Message */}
                <AnimatePresence>
                  {success && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="rounded-lg bg-green-500/10 border border-green-500/30 p-3 text-sm text-green-400 flex items-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Credentials saved successfully
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="apiKey" className="block text-sm font-medium text-dark-300 mb-2">
                      API Key Name
                    </label>
                    <div className="relative">
                      <input
                        id="apiKey"
                        type={showApiKey ? "text" : "password"}
                        value={apiKey}
                        onChange={(e) => {
                          setApiKey(e.target.value)
                          setError(null)
                        }}
                        placeholder="organizations/{org_id}/apiKeys/{key_id}"
                        className="w-full rounded-lg bg-dark-900 border border-dark-600 px-4 py-3 pr-12 text-white placeholder-dark-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all font-mono text-sm"
                        required
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white transition-colors"
                      >
                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="apiSecret" className="block text-sm font-medium text-dark-300 mb-2">
                      Private Key
                    </label>
                    <div className="relative">
                      <input
                        id="apiSecret"
                        type={showApiSecret ? "text" : "password"}
                        value={apiSecret}
                        onChange={(e) => {
                          setApiSecret(e.target.value)
                          setError(null)
                        }}
                        placeholder="-----BEGIN EC PRIVATE KEY-----..."
                        className="w-full rounded-lg bg-dark-900 border border-dark-600 px-4 py-3 pr-12 text-white placeholder-dark-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all font-mono text-sm"
                        required
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiSecret(!showApiSecret)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white transition-colors"
                      >
                        {showApiSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-dark-400 mt-2">
                      Paste your full PEM-formatted private key. It will be encrypted before storage.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  {user?.hasCoinbaseKeys && (
                    <button
                      type="button"
                      onClick={toggleEdit}
                      disabled={isLoading}
                      className="flex-1 px-4 py-3 rounded-lg bg-dark-700 hover:bg-dark-600 text-white font-medium transition-colors border border-dark-600"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isLoading || !apiKey || !apiSecret}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary-600 hover:bg-primary-500 px-4 py-3 text-white font-medium transition-all shadow-lg shadow-primary-600/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Encrypting...
                      </span>
                    ) : (
                      <>
                        <Save className="h-5 w-5" />
                        Save Credentials
                      </>
                    )}
                  </button>
                </div>
              </motion.form>
            )}
          </div>
        </motion.div>

        {/* Wallet Section */}
        <WalletSection />

        {/* Security Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl bg-dark-800 border border-dark-700 overflow-hidden mb-8"
        >
          <div className="p-6 border-b border-dark-700 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-500/10 border border-primary-500/20">
              <Key className="h-5 w-5 text-primary-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Security</h2>
          </div>
          <div className="p-6 space-y-3">
            <button className="w-full flex items-center justify-between p-4 bg-dark-900 border border-dark-700 rounded-xl hover:border-primary-500/50 transition-all text-left">
              <div>
                <div className="text-white font-medium">Change Password</div>
                <p className="text-sm text-dark-400 mt-1">Update your account password</p>
              </div>
              <Key className="h-5 w-5 text-dark-400" />
            </button>

            <button className="w-full flex items-center justify-between p-4 bg-dark-900 border border-dark-700 rounded-xl hover:border-primary-500/50 transition-all text-left">
              <div>
                <div className="text-white font-medium">Two-Factor Authentication</div>
                <p className="text-sm text-dark-400 mt-1">Add an extra layer of security</p>
              </div>
              <Shield className="h-5 w-5 text-dark-400" />
            </button>
          </div>
        </motion.div>

        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl bg-dark-800 border border-danger-500/30 overflow-hidden"
        >
          <div className="p-6 border-b border-dark-700 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-danger-500/10 border border-danger-500/20">
              <AlertCircle className="h-5 w-5 text-danger-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Danger Zone</h2>
          </div>
          <div className="p-6">
            <button className="w-full flex items-center justify-between p-4 bg-danger-500/10 border border-danger-500/30 rounded-xl hover:bg-danger-500/20 transition-all text-left">
              <div>
                <div className="text-danger-400 font-medium">Delete Account</div>
                <p className="text-sm text-danger-400/70 mt-1">
                  Permanently delete your account and all data
                </p>
              </div>
              <AlertCircle className="h-5 w-5 text-danger-400" />
            </button>
          </div>
        </motion.div>

      <AnimatePresence>
        {showDeleteConfirm && (
          <DeleteConfirmationModal
            isOpen={showDeleteConfirm}
            onClose={() => setShowDeleteConfirm(false)}
            onConfirm={handleDelete}
            isLoading={isLoading}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
