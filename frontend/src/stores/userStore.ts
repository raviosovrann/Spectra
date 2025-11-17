import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface NotificationSettings {
  priceAlerts: boolean
  tradeExecutions: boolean
  portfolioUpdates: boolean
  marketNews: boolean
}

interface UserProfile {
  fullName: string
  email: string
  timezone: string
  currency: string
}

interface CoinbaseCredentials {
  apiKey: string
  apiSecret: string
}

interface UserState {
  profile: UserProfile
  notifications: NotificationSettings
  theme: 'dark' | 'light'
  paperTradingMode: boolean
  coinbaseCredentials: CoinbaseCredentials | null
  coinbaseConnected: boolean

  // Actions
  setProfile: (profile: Partial<UserProfile>) => void
  setNotifications: (notifications: Partial<NotificationSettings>) => void
  setTheme: (theme: 'dark' | 'light') => void
  setPaperTradingMode: (enabled: boolean) => void
  setCoinbaseCredentials: (credentials: CoinbaseCredentials | null) => void
  setCoinbaseConnected: (connected: boolean) => void
  resetToDefaults: () => void
}

const defaultState = {
  profile: {
    fullName: 'User',
    email: 'user@example.com',
    timezone: 'UTC',
    currency: 'USD',
  },
  notifications: {
    priceAlerts: true,
    tradeExecutions: true,
    portfolioUpdates: false,
    marketNews: true,
  },
  theme: 'dark' as const,
  paperTradingMode: true,
  coinbaseCredentials: null,
  coinbaseConnected: false,
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      ...defaultState,

      setProfile: (profile) =>
        set((state) => ({
          profile: { ...state.profile, ...profile },
        })),

      setNotifications: (notifications) =>
        set((state) => ({
          notifications: { ...state.notifications, ...notifications },
        })),

      setTheme: (theme) => {
        set({ theme })
        // Update document class for theme
        document.documentElement.classList.toggle('dark', theme === 'dark')
      },

      setPaperTradingMode: (enabled) =>
        set({ paperTradingMode: enabled }),

      setCoinbaseCredentials: (credentials) =>
        set({
          coinbaseCredentials: credentials,
          coinbaseConnected: credentials !== null,
        }),

      setCoinbaseConnected: (connected) =>
        set({ coinbaseConnected: connected }),

      resetToDefaults: () => set(defaultState),
    }),
    {
      name: 'spectra-user-settings',
      // Exclude sensitive data from persistence
      partialize: (state) => ({
        profile: state.profile,
        notifications: state.notifications,
        theme: state.theme,
        paperTradingMode: state.paperTradingMode,
        coinbaseConnected: state.coinbaseConnected,
        // Don't persist actual credentials in localStorage
        coinbaseCredentials: state.coinbaseCredentials
          ? { apiKey: state.coinbaseCredentials.apiKey, apiSecret: '' }
          : null,
      }),
    }
  )
)
