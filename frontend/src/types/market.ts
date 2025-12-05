// Market data type definitions

export interface Cryptocurrency {
  symbol: string // e.g., 'BTC'
  name: string // e.g., 'Bitcoin'
  productId: string // e.g., 'BTC-USD'
  price: number
  change24h: number // percentage
  volume24h: number
  marketCap: number
  high24h: number
  low24h: number
  lastUpdate: number // timestamp
}

export interface Candle {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface PriceHistory {
  symbol: string
  interval: '1m' | '5m' | '15m' | '1h' | '4h' | '1d'
  candles: Candle[]
}

export interface TickerUpdate {
  type: 'ticker'
  productId: string
  price: number
  open24h: number
  volume24h: number
  low24h: number
  high24h: number
  bestBid: number
  bestAsk: number
  timestamp: number
}
