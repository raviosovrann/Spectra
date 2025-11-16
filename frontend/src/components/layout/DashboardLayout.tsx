import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Zap,
  Search,
  Sun,
  Moon,
  TrendingUp,
  DollarSign,
  PieChart,
  Lightbulb,
  Bell,
  History,
  Menu,
  X,
} from 'lucide-react'
import { useState, useEffect } from 'react'

const tabs = [
  { id: 'investing', label: 'Investing', path: '/dashboard', icon: TrendingUp },
  { id: 'trading', label: 'Trading', path: '/dashboard/trading', icon: DollarSign },
  { id: 'portfolio', label: 'Portfolio', path: '/dashboard/portfolio', icon: PieChart },
  { id: 'insights', label: 'Insights', path: '/dashboard/insights', icon: Lightbulb },
  { id: 'alerts', label: 'Alerts', path: '/dashboard/alerts', icon: Bell },
  { id: 'history', label: 'History', path: '/dashboard/history', icon: History },
]

export default function DashboardLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null
    if (savedTheme) {
      setTheme(savedTheme)
      document.documentElement.classList.toggle('dark', savedTheme === 'dark')
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
  }

  const getActiveTab = () => {
    const path = location.pathname
    if (path === '/dashboard') return 'investing'
    const tab = tabs.find((t) => t.path === path)
    return tab?.id || 'investing'
  }

  const activeTab = getActiveTab()

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-dark-800 bg-dark-900/95 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-8">
              <div
                className="flex cursor-pointer items-center gap-2"
                onClick={() => navigate('/dashboard')}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary-500/50">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-white to-primary-200 bg-clip-text text-transparent">
                  Spectra
                </span>
              </div>

              {/* Desktop Search */}
              <div className="hidden md:block">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-dark-500" />
                  <input
                    type="text"
                    placeholder="Search cryptocurrencies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64 rounded-xl bg-dark-800 border border-dark-700 pl-10 pr-4 py-2 text-sm text-white placeholder-dark-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-4">
              {/* Connection Status */}
              <div className="hidden md:flex items-center gap-2 rounded-lg bg-success-500/10 px-3 py-1.5 text-sm">
                <div className="h-2 w-2 rounded-full bg-success-400 animate-pulse" />
                <span className="text-success-400 font-medium">Connected</span>
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
              <div className="hidden md:flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white font-semibold cursor-pointer hover:scale-105 transition-transform">
                U
              </div>
            </div>
          </div>

          {/* Desktop Tab Navigation */}
          <nav className="hidden md:flex gap-2 -mb-px">
            {tabs.map((tab) => {
              const Icon = tab.icon
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
                  <Icon className="h-5 w-5" strokeWidth={2.5} />
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
            {/* Mobile Search */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-dark-500" />
                <input
                  type="text"
                  placeholder="Search cryptocurrencies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl bg-dark-800 border border-dark-700 pl-10 pr-4 py-2 text-sm text-white placeholder-dark-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                />
              </div>
            </div>

            {/* Mobile Navigation */}
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon
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
                    <Icon className="h-6 w-6" strokeWidth={2.5} />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </nav>

            {/* Mobile Connection Status */}
            <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-success-500/10 px-3 py-2 text-sm">
              <div className="h-2 w-2 rounded-full bg-success-400 animate-pulse" />
              <span className="text-success-400 font-medium">Connected</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-dark-800 bg-dark-900/95 backdrop-blur-sm">
        <div className="grid grid-cols-6 gap-1 px-2 py-3">
          {tabs.map((tab) => {
            const Icon = tab.icon
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
                <Icon className="h-6 w-6" strokeWidth={2.5} />
                <span className="text-xs font-semibold">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* Bottom padding for mobile navigation */}
      <div className="md:hidden h-24" />
    </div>
  )
}
