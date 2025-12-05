import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Sun, Moon, Menu, X, Settings, LogOut } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useUserStore } from '../../stores/userStore'
import { useAuth } from '../../hooks/useAuth'
import { useWebSocket } from '../../hooks/useWebSocket'
import { useNotificationStore } from '../../stores/notificationStore'
import { useAlertsStore } from '../../stores/alertsStore'
import NotificationCenter from '../NotificationCenter'
import Loader from '../Loader'

// Page icons
import investingIcon from '../../assets/investing-page.svg'
import tradingIcon from '../../assets/trading-page.svg'
import portfolioIcon from '../../assets/portfolio-page.svg'
import alertsIcon from '../../assets/alerts-page.svg'
import historyIcon from '../../assets/history-page.svg'

const tabs = [
  { id: 'investing', label: 'Investing', path: '/dashboard', iconSrc: investingIcon },
  { id: 'trading', label: 'Trading', path: '/dashboard/trading', iconSrc: tradingIcon },
  { id: 'portfolio', label: 'Portfolio', path: '/dashboard/portfolio', iconSrc: portfolioIcon },
  { id: 'alerts', label: 'Alerts', path: '/dashboard/alerts', iconSrc: alertsIcon },
  { id: 'history', label: 'History', path: '/dashboard/history', iconSrc: historyIcon },
]

export default function DashboardLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { theme, setTheme } = useUserStore()
  const { logout, user } = useAuth()
  const { status: wsStatus, onMessage } = useWebSocket()
  const { push } = useNotificationStore()
  const { triggerAlert } = useAlertsStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const accountMenuRef = useRef<HTMLDivElement>(null)
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [isNavigating, setIsNavigating] = useState(false)
  const previousPath = useRef(location.pathname)

  // Initial page load
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageLoading(false)
    }, 800)
    return () => clearTimeout(timer)
  }, [])

  // Route change detection
  useEffect(() => {
    if (previousPath.current !== location.pathname) {
      setIsNavigating(true)
      const timer = setTimeout(() => {
        setIsNavigating(false)
      }, 600)
      previousPath.current = location.pathname
      return () => clearTimeout(timer)
    }
  }, [location.pathname])

  // Close account menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setAccountMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Listen for alert trigger events from WebSocket
  useEffect(() => {
    const unsubscribe = onMessage('alert_triggered', (data) => {
      const payload = data as { alertId?: string; symbol?: string; price?: number; triggeredAt?: number }
      if (payload?.alertId) {
        triggerAlert(payload.alertId)
      }

      const priceDisplay = payload?.price ? `$${Number(payload.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''
      const symbol = payload?.symbol || 'Alert'

      push({
        title: `${symbol} alert triggered`,
        message: priceDisplay ? `${symbol} crossed ${priceDisplay}` : 'Price condition met',
        variant: 'warning',
      })
    })

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [onMessage, push, triggerAlert])

  const getActiveTab = () => {
    const path = location.pathname
    if (path === '/dashboard') return 'investing'
    if (path === '/dashboard/profile' || path === '/dashboard/settings') return null // No active tab on profile/settings page
    const tab = tabs.find((t) => t.path === path)
    return tab?.id || 'investing'
  }

  const activeTab = getActiveTab()
  const hideNavigation = location.pathname === '/dashboard/profile' || location.pathname === '/dashboard/settings'

  // Get connection status display properties
  const getConnectionStatus = () => {
    switch (wsStatus) {
      case 'connected':
        return {
          bgClass: 'bg-success-500/10',
          dotClass: 'bg-success-400',
          textClass: 'text-success-400',
          label: 'Connected',
          animate: true,
        }
      case 'connecting':
        return {
          bgClass: 'bg-warning-500/10',
          dotClass: 'bg-warning-400',
          textClass: 'text-warning-400',
          label: 'Connecting...',
          animate: true,
        }
      case 'reconnecting':
        return {
          bgClass: 'bg-warning-500/10',
          dotClass: 'bg-warning-400',
          textClass: 'text-warning-400',
          label: 'Reconnecting...',
          animate: true,
        }
      case 'disconnected':
        return {
          bgClass: 'bg-error-500/10',
          dotClass: 'bg-error-400',
          textClass: 'text-error-400',
          label: 'Disconnected',
          animate: false,
        }
      default:
        return {
          bgClass: 'bg-error-500/10',
          dotClass: 'bg-error-400',
          textClass: 'text-error-400',
          label: 'Disconnected',
          animate: false,
        }
    }
  }

  const connectionStatus = getConnectionStatus()

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
      <NotificationCenter />
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-dark-800 bg-dark-900/95 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div
              className="flex cursor-pointer items-center gap-2"
              onClick={() => navigate('/dashboard')}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary-500/50">
                <svg className="h-6 w-6 text-white" viewBox="0 0 46 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0 33L4.60606 25H12.2448C17.2569 25 21.4947 28.7103 22.1571 33.6784L23 40H13L11.5585 36.6365C10.613 34.4304 8.44379 33 6.04362 33H0Z" fill="currentColor" />
                  <path d="M46 33L41.3939 25H33.7552C28.7431 25 24.5053 28.7103 23.8429 33.6784L23 40H33L34.4415 36.6365C35.387 34.4304 37.5562 33 39.9564 33H46Z" fill="currentColor" />
                  <path d="M4.60606 25L18.9999 0H23L22.6032 9.52405C22.2608 17.7406 15.7455 24.3596 7.53537 24.8316L4.60606 25Z" fill="currentColor" />
                  <path d="M41.3939 25L27.0001 0H23L23.3968 9.52405C23.7392 17.7406 30.2545 24.3596 38.4646 24.8316L41.3939 25Z" fill="currentColor" />
                </svg>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-white to-primary-200 bg-clip-text text-transparent">
                Spectra
              </span>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-4">
              {/* Connection Status */}
              <div className={`hidden md:flex items-center gap-2 rounded-lg ${connectionStatus.bgClass} px-3 py-1.5 text-sm`}>
                <div className={`h-2 w-2 rounded-full ${connectionStatus.dotClass} ${connectionStatus.animate ? 'animate-pulse' : ''}`} />
                <span className={`${connectionStatus.textClass} font-medium`}>{connectionStatus.label}</span>
              </div>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-dark-800 text-dark-300 hover:bg-dark-750 hover:text-white transition-all"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden flex h-10 w-10 items-center justify-center rounded-xl bg-dark-800 text-dark-300 hover:bg-dark-750 hover:text-white transition-all"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>

              {/* Account Menu (Desktop) */}
              <div className="relative" ref={accountMenuRef}>
                <button
                  onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                  className="hidden md:flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white font-semibold cursor-pointer hover:scale-105 transition-transform"
                  aria-label="Account menu"
                >
                  {user?.fullName.charAt(0).toUpperCase() || 'U'}
                </button>

                {/* Dropdown Menu */}
                {accountMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-48 rounded-xl bg-dark-800 border border-dark-700 shadow-xl z-50"
                  >
                    <div className="p-3 border-b border-dark-700">
                      <p className="text-sm font-semibold text-white">{user?.fullName}</p>
                      <p className="text-xs text-dark-400">{user?.emailAddress}</p>
                    </div>

                    <div className="p-2 space-y-1">
                      <button
                        onClick={() => {
                          navigate('/dashboard/profile')
                          setAccountMenuOpen(false)
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-dark-300 hover:bg-dark-700 hover:text-white transition-colors"
                      >
                        <div className="h-4 w-4 rounded-full bg-primary-500/20 flex items-center justify-center text-xs">👤</div>
                        Profile
                      </button>

                      <button
                        onClick={() => {
                          navigate('/dashboard/settings')
                          setAccountMenuOpen(false)
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-dark-300 hover:bg-dark-700 hover:text-white transition-colors"
                      >
                        <Settings className="h-4 w-4" />
                        Settings
                      </button>

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          {/* Desktop Tab Navigation - Hide on profile/settings page */}
          {!hideNavigation && (
            <nav className="hidden md:flex gap-2 -mb-px">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => navigate(tab.path)}
                    className={`relative flex items-center gap-3 px-6 py-4 text-base font-semibold transition-all rounded-t-xl ${
                      isActive
                        ? 'text-primary-400 bg-dark-800/50'
                        : 'text-dark-400 hover:text-dark-200 hover:bg-dark-800/30'
                    }`}
                  >
                    <img src={tab.iconSrc} alt={`${tab.label} icon`} className="h-5 w-5 object-contain" />
                    <span>{tab.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-1 bg-primary-500 rounded-t-sm"
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                  </button>
                )
              })}
            </nav>
          )}
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="md:hidden fixed inset-x-0 top-16 z-40 border-b border-dark-800 bg-dark-900 shadow-xl"
        >
          <div className="container mx-auto px-4 py-4">
            {/* Mobile Navigation */}
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      navigate(tab.path)
                      setMobileMenuOpen(false)
                    }}
                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl text-base font-semibold transition-colors ${
                      isActive
                        ? 'bg-primary-500/10 text-primary-400'
                        : 'text-dark-400 hover:bg-dark-800 hover:text-dark-200'
                    }`}
                  >
                    <img src={tab.iconSrc} alt={`${tab.label} icon`} className="h-6 w-6 object-contain" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </nav>
            {/* Mobile Connection Status */}
            <div className={`mt-4 flex items-center justify-center gap-2 rounded-lg ${connectionStatus.bgClass} px-3 py-2 text-sm`}>
              <div className={`h-2 w-2 rounded-full ${connectionStatus.dotClass} ${connectionStatus.animate ? 'animate-pulse' : ''}`} />
              <span className={`${connectionStatus.textClass} font-medium`}>{connectionStatus.label}</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 relative">
        <AnimatePresence mode="wait">
          {(isPageLoading || isNavigating) ? (
            <motion.div
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center py-24"
            >
              <Loader text={isPageLoading ? "Loading dashboard..." : undefined} />
            </motion.div>
          ) : (
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Outlet />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Navigation - Hide on profile/settings page */}
      {!hideNavigation && (
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-dark-800 bg-dark-900/95 backdrop-blur-sm">
          <div className="grid grid-cols-6 gap-1 px-2 py-3">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => navigate(tab.path)}
                  className={`flex flex-col items-center gap-1.5 px-2 py-2.5 rounded-xl transition-all ${
                    isActive
                      ? 'bg-primary-500/10 text-primary-400'
                      : 'text-dark-400 active:bg-dark-800'
                  }`}
                >
                  <img src={tab.iconSrc} alt={`${tab.label} icon`} className="h-6 w-6 object-contain" />
                  <span className="text-xs font-semibold">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </nav>
      )}

      {/* Bottom padding for mobile navigation */}
      {!hideNavigation && <div className="md:hidden h-24" />}
    </div>
  )
}
