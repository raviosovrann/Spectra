import { create } from 'zustand'
import { Portfolio, Holding, PortfolioSummary } from '../types/portfolio'

interface PortfolioState {
  portfolio: Portfolio | null
  
  // Actions
  setPortfolio: (portfolio: Portfolio) => void
  updateHolding: (symbol: string, updates: Partial<Holding>) => void
  addHolding: (holding: Holding) => void
  removeHolding: (symbol: string) => void
  updateCashBalance: (amount: number) => void
  calculateTotalValue: () => void
  
  // Selectors
  getHoldings: () => Holding[]
  getHolding: (symbol: string) => Holding | undefined
  getCashBalance: () => number
  getTotalValue: () => number
  getSummary: () => PortfolioSummary
}

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
  portfolio: null,

  setPortfolio: (portfolio: Portfolio) => {
    set({ portfolio })
  },

  updateHolding: (symbol: string, updates: Partial<Holding>) => {
    set((state) => {
      if (!state.portfolio) return state
      
      const holdings = state.portfolio.holdings.map((holding) =>
        holding.symbol === symbol
          ? { ...holding, ...updates }
          : holding
      )
      
      return {
        portfolio: {
          ...state.portfolio,
          holdings,
          lastUpdate: Date.now(),
        },
      }
    })
    
    // Recalculate total value after updating holding
    get().calculateTotalValue()
  },

  addHolding: (holding: Holding) => {
    set((state) => {
      if (!state.portfolio) {
        // Initialize portfolio if it doesn't exist
        return {
          portfolio: {
            userId: '',
            totalValue: holding.currentValue,
            cash: 0,
            holdings: [holding],
            change24h: 0,
            change24hPercent: 0,
            lastUpdate: Date.now(),
          },
        }
      }
      
      // Check if holding already exists
      const existingIndex = state.portfolio.holdings.findIndex(
        (h) => h.symbol === holding.symbol
      )
      
      if (existingIndex >= 0) {
        // Update existing holding
        const holdings = [...state.portfolio.holdings]
        holdings[existingIndex] = holding
        
        return {
          portfolio: {
            ...state.portfolio,
            holdings,
            lastUpdate: Date.now(),
          },
        }
      }
      
      // Add new holding
      return {
        portfolio: {
          ...state.portfolio,
          holdings: [...state.portfolio.holdings, holding],
          lastUpdate: Date.now(),
        },
      }
    })
    
    // Recalculate total value after adding holding
    get().calculateTotalValue()
  },

  removeHolding: (symbol: string) => {
    set((state) => {
      if (!state.portfolio) return state
      
      const holdings = state.portfolio.holdings.filter(
        (holding) => holding.symbol !== symbol
      )
      
      return {
        portfolio: {
          ...state.portfolio,
          holdings,
          lastUpdate: Date.now(),
        },
      }
    })
    
    // Recalculate total value after removing holding
    get().calculateTotalValue()
  },

  updateCashBalance: (amount: number) => {
    set((state) => {
      if (!state.portfolio) {
        // Initialize portfolio if it doesn't exist
        return {
          portfolio: {
            userId: '',
            totalValue: amount,
            cash: amount,
            holdings: [],
            change24h: 0,
            change24hPercent: 0,
            lastUpdate: Date.now(),
          },
        }
      }
      
      return {
        portfolio: {
          ...state.portfolio,
          cash: amount,
          lastUpdate: Date.now(),
        },
      }
    })
    
    // Recalculate total value after updating cash
    get().calculateTotalValue()
  },

  calculateTotalValue: () => {
    set((state) => {
      if (!state.portfolio) return state
      
      const holdingsValue = state.portfolio.holdings.reduce(
        (sum, holding) => sum + holding.currentValue,
        0
      )
      
      const totalValue = holdingsValue + state.portfolio.cash
      
      return {
        portfolio: {
          ...state.portfolio,
          totalValue,
          lastUpdate: Date.now(),
        },
      }
    })
  },

  getHoldings: () => {
    return get().portfolio?.holdings || []
  },

  getHolding: (symbol: string) => {
    return get().portfolio?.holdings.find((h) => h.symbol === symbol)
  },

  getCashBalance: () => {
    return get().portfolio?.cash || 0
  },

  getTotalValue: () => {
    return get().portfolio?.totalValue || 0
  },

  getSummary: () => {
    const portfolio = get().portfolio
    
    if (!portfolio) {
      return {
        totalValue: 0,
        cash: 0,
        change24h: 0,
        change24hPercent: 0,
        holdingsCount: 0,
      }
    }
    
    return {
      totalValue: portfolio.totalValue,
      cash: portfolio.cash,
      change24h: portfolio.change24h,
      change24hPercent: portfolio.change24hPercent,
      holdingsCount: portfolio.holdings.length,
    }
  },
}))
