import WebSocket from 'ws'
import logger from '../utils/logger.js'
import type {
  ConnectionStatus,
  TickerMessage,
  Level2Message,
  CoinbaseMessage,
  CoinbaseTickerMessage,
  CoinbaseLevel2Message,
  MessageHandler,
} from '../types/websocket.js'

export class WebSocketManager {
  private ws: WebSocket | null = null
  private readonly wsUrl: string
  private connectionStatus: ConnectionStatus = 'disconnected'
  private reconnectAttempts: number = 0
  private readonly maxReconnectAttempts: number = 10
  private readonly baseDelay: number = 1000 // 1 second
  private readonly maxDelay: number = 60000 // 60 seconds
  private reconnectTimeout: NodeJS.Timeout | null = null
  private messageHandlers: Set<MessageHandler> = new Set()
  private subscribedProducts: string[] = []
  private subscribedChannels: string[] = []

  constructor(wsUrl?: string) {
    this.wsUrl = wsUrl || 'wss://ws-feed.exchange.coinbase.com'
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus
  }

  /**
   * Register a message handler
   */
  onMessage(handler: MessageHandler): void {
    this.messageHandlers.add(handler)
  }

  /**
   * Remove a message handler
   */
  offMessage(handler: MessageHandler): void {
    this.messageHandlers.delete(handler)
  }

  /**
   * Connect to Coinbase WebSocket feed
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.wsUrl)

        const connectionTimeout = setTimeout(() => {
          if (this.connectionStatus !== 'connected') {
            reject(new Error('WebSocket connection timeout'))
            this.handleConnectionError(new Error('Connection timeout'))
          }
        }, 5000)

        this.ws.on('open', () => {
          clearTimeout(connectionTimeout)
          this.connectionStatus = 'connected'
          this.reconnectAttempts = 0
          logger.info('WebSocket connected to Coinbase')

          // Resubscribe to channels if reconnecting
          if (this.subscribedProducts.length > 0 && this.subscribedChannels.length > 0) {
            this.subscribe(this.subscribedProducts, this.subscribedChannels)
          }

          resolve()
        })

        this.ws.on('message', (data: WebSocket.Data) => {
          this.handleMessage(data)
        })

        this.ws.on('error', (error: Error) => {
          clearTimeout(connectionTimeout)
          logger.error('WebSocket error:', { message: error.message })
          this.handleConnectionError(error)
          reject(error)
        })

        this.ws.on('close', () => {
          clearTimeout(connectionTimeout)
          logger.info('WebSocket connection closed')
          this.handleConnectionClose()
        })
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Subscribe to channels for specified products
   * Note: level2/level3/full channels require authentication (not implemented)
   * Use ticker channel for real-time price updates (no auth required)
   */
  subscribe(productIds: string[], channels: string[] = ['ticker']): void {
    if (!this.ws || this.connectionStatus !== 'connected') {
      logger.warn('Cannot subscribe: WebSocket not connected')
      return
    }

    // Filter out channels that require authentication
    const authRequiredChannels = ['level2', 'level3', 'full']
    const filteredChannels = channels.filter(c => !authRequiredChannels.includes(c))
    
    if (filteredChannels.length !== channels.length) {
      const skipped = channels.filter(c => authRequiredChannels.includes(c))
      logger.warn(`Skipping authenticated channels: ${skipped.join(', ')}`)
    }

    this.subscribedProducts = productIds
    this.subscribedChannels = filteredChannels

    const subscribeMessage = {
      type: 'subscribe',
      product_ids: productIds,
      channels: filteredChannels,
    }

    this.ws.send(JSON.stringify(subscribeMessage))
    logger.info(`Subscribed to ${filteredChannels.join(', ')} for ${productIds.length} products`)
  }

  /**
   * Unsubscribe from channels
   */
  unsubscribe(productIds: string[], channels: string[]): void {
    if (!this.ws || this.connectionStatus !== 'connected') {
      return
    }

    const unsubscribeMessage = {
      type: 'unsubscribe',
      product_ids: productIds,
      channels: channels,
    }

    this.ws.send(JSON.stringify(unsubscribeMessage))
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    this.connectionStatus = 'disconnected'
    this.reconnectAttempts = 0
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(data: WebSocket.Data): void {
    try {
      const message = JSON.parse(data.toString()) as CoinbaseMessage

      if (message.type === 'ticker') {
        const normalized = this.normalizeTickerMessage(message as CoinbaseTickerMessage)
        this.notifyHandlers(normalized)
      } else if (message.type === 'l2update') {
        const normalized = this.normalizeLevel2Message(message as CoinbaseLevel2Message)
        this.notifyHandlers(normalized)
      } else if (message.type === 'subscriptions') {
        logger.info('Subscription confirmed', { 
          channels: message.channels 
        })
      } else if (message.type === 'error') {
        logger.error('Coinbase WebSocket error', { 
          message: message.message,
          reason: message.reason 
        })
      }
    } catch (error) {
      logger.error('Error parsing WebSocket message', { error })
    }
  }

  /**
   * Normalize Coinbase ticker message to internal format
   */
  private normalizeTickerMessage(message: CoinbaseTickerMessage): TickerMessage {
    return {
      type: 'ticker',
      productId: message.product_id,
      price: parseFloat(message.price),
      open24h: parseFloat(message.open_24h),
      volume24h: parseFloat(message.volume_24h),
      low24h: parseFloat(message.low_24h),
      high24h: parseFloat(message.high_24h),
      bestBid: parseFloat(message.best_bid),
      bestAsk: parseFloat(message.best_ask),
      timestamp: new Date(message.time).getTime(),
    }
  }

  /**
   * Normalize Coinbase level2 message to internal format
   */
  private normalizeLevel2Message(message: CoinbaseLevel2Message): Level2Message {
    const bids: [string, string][] = []
    const asks: [string, string][] = []

    message.changes.forEach(([side, price, size]) => {
      if (side === 'buy') {
        bids.push([price, size])
      } else {
        asks.push([price, size])
      }
    })

    return {
      type: 'level2',
      productId: message.product_id,
      bids,
      asks,
      timestamp: new Date(message.time).getTime(),
    }
  }

  /**
   * Notify all registered message handlers
   */
  private notifyHandlers(message: TickerMessage | Level2Message): void {
    this.messageHandlers.forEach((handler) => {
      try {
        handler(message)
      } catch (error) {
        logger.error('Error in message handler', { error })
      }
    })
  }

  /**
   * Handle connection errors
   */
  private handleConnectionError(error: Error): void {
    logger.error('WebSocket connection error', { message: error.message })
    this.connectionStatus = 'disconnected'
    this.attemptReconnect()
  }

  /**
   * Handle connection close
   */
  private handleConnectionClose(): void {
    this.connectionStatus = 'disconnected'
    this.attemptReconnect()
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('Max reconnection attempts reached')
      return
    }

    this.connectionStatus = 'reconnecting'
    this.reconnectAttempts++

    const delay = Math.min(
      this.baseDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.maxDelay
    )

    logger.info(
      `Attempting to reconnect in ${delay / 1000}s (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    )

    this.reconnectTimeout = setTimeout(() => {
      this.connect().catch((error) => {
        logger.error('Reconnection failed', { message: error.message })
      })
    }, delay)
  }
}
