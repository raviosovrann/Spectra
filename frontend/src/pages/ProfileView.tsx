import { motion } from 'framer-motion'
import {
  User,
  Key,
  Wallet,
  Shield,
  Bell,
  Palette,
  Save,
  LogOut,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '../stores/userStore'

export default function ProfileView() {
  const navigate = useNavigate()
  const {
    profile,
    notifications,
    theme,
    paperTradingMode,
    coinbaseCredentials,
    coinbaseConnected,
    setProfile,
    setNotifications,
    setTheme,
    setPaperTradingMode,
    setCoinbaseCredentials,
  } = useUserStore()

  const [saveSuccess, setSaveSuccess] = useState(false)
  const [localProfile, setLocalProfile] = useState(profile)
  const [localNotifications, setLocalNotifications] = useState(notifications)
  const [localTheme, setLocalTheme] = useState(theme)
  const [localPaperTrading, setLocalPaperTrading] = useState(paperTradingMode)
  const [apiCredentials, setApiCredentials] = useState({
    apiKey: coinbaseCredentials?.apiKey || '',
    apiSecret: coinbaseCredentials?.apiSecret || '',
  })

  const handleSaveSettings = () => {
    // Update Zustand store
    setProfile(localProfile)
    setNotifications(localNotifications)
    setTheme(localTheme)
    setPaperTradingMode(localPaperTrading)

    // Save Coinbase credentials if provided
    if (apiCredentials.apiKey && apiCredentials.apiSecret) {
      setCoinbaseCredentials(apiCredentials)
    }

    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
  }

  const handleDisconnectCoinbase = () => {
    setCoinbaseCredentials(null)
    setApiCredentials({ apiKey: '', apiSecret: '' })
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back Button and Header */}
      <div>
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-dark-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium">Back to Dashboard</span>
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Account Settings</h1>
            <p className="text-dark-400 mt-1">Manage your profile and preferences</p>
          </div>
          <button
            onClick={handleSaveSettings}
            className="flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-semibold transition-all"
          >
            <Save className="h-5 w-5" />
            Save Changes
          </button>
        </div>
      </div>

      {/* Success Message */}
      {saveSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 bg-success-500/10 border border-success-500/20 rounded-xl"
        >
          <CheckCircle className="h-5 w-5 text-success-400" />
          <span className="text-success-400 font-medium">Settings saved successfully!</span>
        </motion.div>
      )}

      {/* Profile Information */}
      <div className="bg-dark-800 border border-dark-700 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/10">
            <User className="h-5 w-5 text-primary-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Profile Information</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Full Name</label>
            <input
              type="text"
              value={localProfile.fullName}
              onChange={(e) => setLocalProfile({ ...localProfile, fullName: e.target.value })}
              className="w-full px-4 py-2.5 bg-dark-900 border border-dark-700 rounded-xl text-white focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Email</label>
            <input
              type="email"
              value={localProfile.email}
              onChange={(e) => setLocalProfile({ ...localProfile, email: e.target.value })}
              className="w-full px-4 py-2.5 bg-dark-900 border border-dark-700 rounded-xl text-white focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Timezone</label>
            <select
              value={localProfile.timezone}
              onChange={(e) => setLocalProfile({ ...localProfile, timezone: e.target.value })}
              className="w-full px-4 py-2.5 bg-dark-900 border border-dark-700 rounded-xl text-white focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
              <option value="Europe/London">London</option>
              <option value="Asia/Tokyo">Tokyo</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Currency</label>
            <select
              value={localProfile.currency}
              onChange={(e) => setLocalProfile({ ...localProfile, currency: e.target.value })}
              className="w-full px-4 py-2.5 bg-dark-900 border border-dark-700 rounded-xl text-white focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="JPY">JPY</option>
            </select>
          </div>
        </div>
      </div>

      {/* Coinbase Integration */}
      <div className="bg-dark-800 border border-dark-700 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/10">
            <Wallet className="h-5 w-5 text-primary-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white">Coinbase Integration</h2>
            <p className="text-sm text-dark-400 mt-1">
              Connect your Coinbase account to access real-time market data and trading
            </p>
          </div>
          {coinbaseConnected && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-success-500/10 rounded-lg">
              <CheckCircle className="h-4 w-4 text-success-400" />
              <span className="text-success-400 text-sm font-medium">Connected</span>
            </div>
          )}
        </div>

        {!coinbaseConnected && (
          <div className="mb-6 p-4 bg-warning-500/10 border border-warning-500/20 rounded-xl flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-warning-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-warning-400">
              <p className="font-medium mb-1">Coinbase account required</p>
              <p>
                You need to connect your Coinbase account to access real-time market data and
                execute trades. Without connection, you can only use paper trading mode with mock
                data.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Coinbase API Key
            </label>
            <input
              type="text"
              value={apiCredentials.apiKey}
              onChange={(e) =>
                setApiCredentials({ ...apiCredentials, apiKey: e.target.value })
              }
              placeholder="Enter your Coinbase API Key"
              className="w-full px-4 py-2.5 bg-dark-900 border border-dark-700 rounded-xl text-white placeholder-dark-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Coinbase API Secret
            </label>
            <input
              type="password"
              value={apiCredentials.apiSecret}
              onChange={(e) =>
                setApiCredentials({ ...apiCredentials, apiSecret: e.target.value })
              }
              placeholder="Enter your Coinbase API Secret"
              className="w-full px-4 py-2.5 bg-dark-900 border border-dark-700 rounded-xl text-white placeholder-dark-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
            />
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://www.coinbase.com/settings/api"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-primary-400 hover:text-primary-300 text-sm font-medium transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Get API credentials from Coinbase
            </a>
            {coinbaseConnected && (
              <button
                onClick={handleDisconnectCoinbase}
                className="ml-auto flex items-center gap-2 px-4 py-2 bg-danger-500/10 hover:bg-danger-500/20 text-danger-400 rounded-lg text-sm font-medium transition-all"
              >
                Disconnect Account
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Trading Mode */}
      <div className="bg-dark-800 border border-dark-700 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/10">
            <Shield className="h-5 w-5 text-primary-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Trading Mode</h2>
            <p className="text-sm text-dark-400 mt-1">Choose between paper trading and live trading</p>
          </div>
        </div>

        <div className="space-y-4">
          <label className="flex items-start gap-4 p-4 bg-dark-900 border border-dark-700 rounded-xl cursor-pointer hover:border-primary-500/50 transition-all">
            <input
              type="radio"
              name="tradingMode"
              checked={localPaperTrading}
              onChange={() => setLocalPaperTrading(true)}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="font-semibold text-white mb-1">Paper Trading (Simulated)</div>
              <p className="text-sm text-dark-400">
                Practice trading with virtual money ($10,000 virtual balance). Perfect for learning
                without financial risk. Uses real market prices.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-4 p-4 bg-dark-900 border border-dark-700 rounded-xl cursor-pointer hover:border-primary-500/50 transition-all">
            <input
              type="radio"
              name="tradingMode"
              checked={!localPaperTrading}
              onChange={() => setLocalPaperTrading(false)}
              disabled={!coinbaseConnected}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="font-semibold text-white mb-1 flex items-center gap-2">
                Live Trading
                {!coinbaseConnected && (
                  <span className="text-xs px-2 py-0.5 bg-warning-500/10 text-warning-400 rounded">
                    Requires Coinbase
                  </span>
                )}
              </div>
              <p className="text-sm text-dark-400">
                Execute real trades with your Coinbase account. All trades use real money and incur
                actual fees.
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-dark-800 border border-dark-700 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/10">
            <Bell className="h-5 w-5 text-primary-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Notification Preferences</h2>
        </div>

        <div className="space-y-4">
          {Object.entries(localNotifications).map(([key, value]) => (
            <label
              key={key}
              className="flex items-center justify-between p-4 bg-dark-900 border border-dark-700 rounded-xl cursor-pointer hover:border-primary-500/50 transition-all"
            >
              <span className="text-white font-medium capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </span>
              <input
                type="checkbox"
                checked={value}
                onChange={(e) =>
                  setLocalNotifications({ ...localNotifications, [key]: e.target.checked })
                }
                className="w-5 h-5"
              />
            </label>
          ))}
        </div>
      </div>

      {/* Appearance */}
      <div className="bg-dark-800 border border-dark-700 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/10">
            <Palette className="h-5 w-5 text-primary-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Appearance</h2>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label
            className={`p-6 border-2 rounded-xl cursor-pointer transition-all ${
              localTheme === 'dark'
                ? 'border-primary-500 bg-primary-500/10'
                : 'border-dark-700 bg-dark-900 hover:border-dark-600'
            }`}
          >
            <input
              type="radio"
              name="theme"
              value="dark"
              checked={localTheme === 'dark'}
              onChange={(e) => setLocalTheme(e.target.value as 'dark' | 'light')}
              className="sr-only"
            />
            <div className="flex flex-col items-center gap-3">
              <div className="w-full h-20 bg-gradient-to-br from-dark-950 to-dark-900 rounded-lg border border-dark-700" />
              <span className="text-white font-semibold">Dark Mode</span>
            </div>
          </label>

          <label
            className={`p-6 border-2 rounded-xl cursor-pointer transition-all ${
              localTheme === 'light'
                ? 'border-primary-500 bg-primary-500/10'
                : 'border-dark-700 bg-dark-900 hover:border-dark-600'
            }`}
          >
            <input
              type="radio"
              name="theme"
              value="light"
              checked={localTheme === 'light'}
              onChange={(e) => setLocalTheme(e.target.value as 'dark' | 'light')}
              className="sr-only"
            />
            <div className="flex flex-col items-center gap-3">
              <div className="w-full h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg border border-gray-300" />
              <span className="text-white font-semibold">Light Mode</span>
            </div>
          </label>
        </div>
      </div>

      {/* Security Section */}
      <div className="bg-dark-800 border border-dark-700 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/10">
            <Key className="h-5 w-5 text-primary-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Security</h2>
        </div>

        <div className="space-y-3">
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
      </div>

      {/* Danger Zone */}
      <div className="bg-dark-800 border border-danger-500/30 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-danger-500/10">
            <AlertCircle className="h-5 w-5 text-danger-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Danger Zone</h2>
        </div>

        <div className="space-y-3">
          <button className="w-full flex items-center justify-between p-4 bg-dark-900 border border-dark-700 rounded-xl hover:border-danger-500/50 transition-all text-left group">
            <div>
              <div className="text-white font-medium group-hover:text-danger-400 transition-colors">
                Sign Out
              </div>
              <p className="text-sm text-dark-400 mt-1">Sign out from your account</p>
            </div>
            <LogOut className="h-5 w-5 text-dark-400 group-hover:text-danger-400 transition-colors" />
          </button>

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
      </div>
    </div>
  )
}
