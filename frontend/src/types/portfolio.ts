// Portfolio type definitions

export interface Holding {
  symbol: string
  quantity: number
  averageBuyPrice: number
  currentPrice: number
  currentValue: number
  unrealizedPnL: number
  unrealizedPnLPercent: number
}

export interface Portfolio {
  userId: string
  totalValue: number // USD
  cash: number // available USD
  holdings: Holding[]
  change24h: number // USD
  change24hPercent: number
  lastUpdate: number
}

export interface PortfolioSummary {
  totalValue: number
  cash: number
  change24h: number
  change24hPercent: number
  holdingsCount: number
}
