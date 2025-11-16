// WebSocket Message Type Definitions

export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting'

export interface TickerMessage {
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

export interface Level2Message {
  type: 'level2'
  productId: string
  bids: [string, string][] // [price, size]
  asks: [string, string][] // [price, size]
  timestamp: number
}

// Coinbase WebSocket message types (incoming)
export interface CoinbaseTickerMessage {
  type: 'ticker'
  product_id: string
  price: string
  open_24_h: string
  volume_24_h: string
  low_24_h: string
  high_24_h: string
  volume_30_d: string
  best_bid: string
  best_ask: string
  side: string
  time: string
  trade_id: number
  last_size: string
}

export interface CoinbaseLevel2Message {
  type: 'l2update'
  product_id: string
  changes: [string, string, string][] // [side, price, size]
  time: string
}

export interface CoinbaseSubscribeMessage {
  type: 'subscribe'
  product_ids: string[]
  channels: string[]
}

export interface CoinbaseUnsubscribeMessage {
  type: 'unsubscribe'
  product_ids: string[]
  channels: string[]
}

export interface CoinbaseSubscriptionsMessage {
  type: 'subscriptions'
  channels: Array<{
    name: string
    product_ids: string[]
  }>
}

export interface CoinbaseErrorMessage {
  type: 'error'
  message: string
  reason?: string
}

export type CoinbaseMessage =
  | CoinbaseTickerMessage
  | CoinbaseLevel2Message
  | CoinbaseSubscriptionsMessage
  | CoinbaseErrorMessage

export type MessageHandler = (message: TickerMessage | Level2Message) => void
