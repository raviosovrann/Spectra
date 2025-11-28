import { create } from 'zustand'
import { Cryptocurrency } from '../types/market'

interface MarketState {
  cryptocurrencies: Map<string, Cryptocurrency>
  
  // Actions
  updateBatch: (updates: Cryptocurrency[]) => void
  updateSingle: (symbol: string, data: Partial<Cryptocurrency>) => void
  
  // Selectors
  getCrypto: (symbol: string) => Cryptocurrency | undefined
  getAllCryptos: () => Cryptocurrency[]
  getTopMovers: (limit?: number) => Cryptocurrency[]
}

// Initial cryptocurrency data to prevent empty state
// Same 20 coins as backend SUPPORTED_SYMBOLS and Insights view
const INITIAL_CRYPTOS: Cryptocurrency[] = [
  { symbol: 'BTC', name: 'Bitcoin', productId: 'BTC-USD', price: 0, change24h: 0, volume24h: 0, marketCap: 0, high24h: 0, low24h: 0, lastUpdate: Date.now() },
  { symbol: 'ETH', name: 'Ethereum', productId: 'ETH-USD', price: 0, change24h: 0, volume24h: 0, marketCap: 0, high24h: 0, low24h: 0, lastUpdate: Date.now() },
  { symbol: 'SOL', name: 'Solana', productId: 'SOL-USD', price: 0, change24h: 0, volume24h: 0, marketCap: 0, high24h: 0, low24h: 0, lastUpdate: Date.now() },
  { symbol: 'ADA', name: 'Cardano', productId: 'ADA-USD', price: 0, change24h: 0, volume24h: 0, marketCap: 0, high24h: 0, low24h: 0, lastUpdate: Date.now() },
  { symbol: 'DOGE', name: 'Dogecoin', productId: 'DOGE-USD', price: 0, change24h: 0, volume24h: 0, marketCap: 0, high24h: 0, low24h: 0, lastUpdate: Date.now() },
  { symbol: 'XRP', name: 'Ripple', productId: 'XRP-USD', price: 0, change24h: 0, volume24h: 0, marketCap: 0, high24h: 0, low24h: 0, lastUpdate: Date.now() },
  { symbol: 'DOT', name: 'Polkadot', productId: 'DOT-USD', price: 0, change24h: 0, volume24h: 0, marketCap: 0, high24h: 0, low24h: 0, lastUpdate: Date.now() },
  { symbol: 'AVAX', name: 'Avalanche', productId: 'AVAX-USD', price: 0, change24h: 0, volume24h: 0, marketCap: 0, high24h: 0, low24h: 0, lastUpdate: Date.now() },
  { symbol: 'POL', name: 'Polygon', productId: 'POL-USD', price: 0, change24h: 0, volume24h: 0, marketCap: 0, high24h: 0, low24h: 0, lastUpdate: Date.now() },
  { symbol: 'LINK', name: 'Chainlink', productId: 'LINK-USD', price: 0, change24h: 0, volume24h: 0, marketCap: 0, high24h: 0, low24h: 0, lastUpdate: Date.now() },
  { symbol: 'UNI', name: 'Uniswap', productId: 'UNI-USD', price: 0, change24h: 0, volume24h: 0, marketCap: 0, high24h: 0, low24h: 0, lastUpdate: Date.now() },
  { symbol: 'ATOM', name: 'Cosmos', productId: 'ATOM-USD', price: 0, change24h: 0, volume24h: 0, marketCap: 0, high24h: 0, low24h: 0, lastUpdate: Date.now() },
  { symbol: 'LTC', name: 'Litecoin', productId: 'LTC-USD', price: 0, change24h: 0, volume24h: 0, marketCap: 0, high24h: 0, low24h: 0, lastUpdate: Date.now() },
  { symbol: 'BCH', name: 'Bitcoin Cash', productId: 'BCH-USD', price: 0, change24h: 0, volume24h: 0, marketCap: 0, high24h: 0, low24h: 0, lastUpdate: Date.now() },
  { symbol: 'ALGO', name: 'Algorand', productId: 'ALGO-USD', price: 0, change24h: 0, volume24h: 0, marketCap: 0, high24h: 0, low24h: 0, lastUpdate: Date.now() },
  { symbol: 'XLM', name: 'Stellar', productId: 'XLM-USD', price: 0, change24h: 0, volume24h: 0, marketCap: 0, high24h: 0, low24h: 0, lastUpdate: Date.now() },
  { symbol: 'AAVE', name: 'Aave', productId: 'AAVE-USD', price: 0, change24h: 0, volume24h: 0, marketCap: 0, high24h: 0, low24h: 0, lastUpdate: Date.now() },
  { symbol: 'NEAR', name: 'NEAR Protocol', productId: 'NEAR-USD', price: 0, change24h: 0, volume24h: 0, marketCap: 0, high24h: 0, low24h: 0, lastUpdate: Date.now() },
  { symbol: 'APT', name: 'Aptos', productId: 'APT-USD', price: 0, change24h: 0, volume24h: 0, marketCap: 0, high24h: 0, low24h: 0, lastUpdate: Date.now() },
  { symbol: 'ARB', name: 'Arbitrum', productId: 'ARB-USD', price: 0, change24h: 0, volume24h: 0, marketCap: 0, high24h: 0, low24h: 0, lastUpdate: Date.now() },
]

const createInitialCryptoMap = (): Map<string, Cryptocurrency> => {
  const map = new Map<string, Cryptocurrency>()
  INITIAL_CRYPTOS.forEach(crypto => map.set(crypto.symbol, crypto))
  return map
}

export const useMarketStore = create<MarketState>((set, get) => ({
  cryptocurrencies: createInitialCryptoMap(),

  updateBatch: (updates: Cryptocurrency[]) => {
    set((state) => {
      const newMap = new Map(state.cryptocurrencies)
      
      updates.forEach((crypto) => {
        newMap.set(crypto.symbol, {
          ...crypto,
          lastUpdate: Date.now(),
        })
      })
      
      return { cryptocurrencies: newMap }
    })
  },

  updateSingle: (symbol: string, data: Partial<Cryptocurrency>) => {
    set((state) => {
      const newMap = new Map(state.cryptocurrencies)
      const existing = newMap.get(symbol)
      
      if (existing) {
        newMap.set(symbol, {
          ...existing,
          ...data,
          lastUpdate: Date.now(),
        })
      } else {
        // If crypto doesn't exist, create a new entry with defaults
        newMap.set(symbol, {
          symbol,
          name: data.name || symbol,
          productId: data.productId || `${symbol}-USD`,
          price: data.price || 0,
          change24h: data.change24h || 0,
          volume24h: data.volume24h || 0,
          marketCap: data.marketCap || 0,
          high24h: data.high24h || 0,
          low24h: data.low24h || 0,
          lastUpdate: Date.now(),
        })
      }
      
      return { cryptocurrencies: newMap }
    })
  },

  getCrypto: (symbol: string) => {
    return get().cryptocurrencies.get(symbol)
  },

  getAllCryptos: () => {
    return Array.from(get().cryptocurrencies.values())
  },

  getTopMovers: (limit: number = 10) => {
    const cryptos = Array.from(get().cryptocurrencies.values())
    
    // Sort by absolute change percentage (biggest movers)
    return cryptos
      .sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h))
      .slice(0, limit)
  },
}))
