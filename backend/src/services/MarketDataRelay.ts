import { WebSocketManager } from './WebSocketManager.js'
import { FrontendWebSocketServer, type BroadcastMessage } from './FrontendWebSocketServer.js'
import logger from '../utils/logger.js'
import type { TickerMessage } from '../types/websocket.js'

interface EnrichedTickerUpdate extends BroadcastMessage {
  type: 'ticker_batch'
  updates: Array<{
    symbol: string
    name: string
    productId: string
    price: number
    change24h: number
    change24hPercent: number
    volume24h: number
    marketCap: number
    high24h: number
    low24h: number
    bestBid: number
    bestAsk: number
    timestamp: number
    formattedTimestamp: string
  }>
  batchTimestamp: number
}

interface ProductInfo {
  name: string
  baseIncrement: string
  quoteIncrement: string
}

// Top cryptocurrency pairs available on Coinbase
const TOP_CRYPTO_PAIRS = [
  'BTC-USD',
  'ETH-USD',
  'SOL-USD',
  'DOGE-USD',
  'XRP-USD',
  'LINK-USD',
  'LTC-USD',
  'BCH-USD',
  'AAVE-USD',
  'UNI-USD',
  'ADA-USD',
  'AVAX-USD',
]

export class MarketDataRelay {
  private coinbaseWs: WebSocketManager
  private frontendWs: FrontendWebSocketServer
  private updateQueue: Map<string, TickerMessage> = new Map()
  private latestTickerState: Map<string, EnrichedTickerUpdate['updates'][0]> = new Map()
  private productInfo: Map<string, ProductInfo> = new Map()
  private batchInterval: NodeJS.Timeout | null = null
  private readonly batchIntervalMs = 16 // ~60fps (16ms)
  private isRunning = false

  constructor(
    coinbaseWs: WebSocketManager,
    frontendWs: FrontendWebSocketServer
  ) {
    this.coinbaseWs = coinbaseWs
    this.frontendWs = frontendWs
    this.initializeProductInfo()

    // Register connection handler to send initial state
    this.frontendWs.onConnection((ws) => {
      this.sendInitialState(ws)
    })
  }

  /**
   * Send the latest state to a newly connected client
   */
  private sendInitialState(ws: unknown): void {
    if (this.latestTickerState.size === 0) {
      return
    }

    const updates = Array.from(this.latestTickerState.values())
    const batchMessage: EnrichedTickerUpdate = {
      type: 'ticker_batch',
      updates,
      batchTimestamp: Date.now(),
    }

    try {
      // Cast to WebSocket since we know it is one, but avoid importing the type to prevent circular deps if not needed
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ws as any).send(JSON.stringify(batchMessage))
      logger.debug('Sent initial state to new client', { updateCount: updates.length })
    } catch (error) {
      logger.error('Failed to send initial state', { error })
    }
  }

  /**
   * Initialize product information (names, etc.)
   */
  private initializeProductInfo(): void {
    // Cryptocurrency names mapping
    const cryptoNames: Record<string, string> = {
      'BTC-USD': 'Bitcoin',
      'ETH-USD': 'Ethereum',
      'SOL-USD': 'Solana',
      'DOGE-USD': 'Dogecoin',
      'XRP-USD': 'Ripple',
      'LINK-USD': 'Chainlink',
      'LTC-USD': 'Litecoin',
      'BCH-USD': 'Bitcoin Cash',
      'AAVE-USD': 'Aave',
      'UNI-USD': 'Uniswap',
      'ADA-USD': 'Cardano',
      'AVAX-USD': 'Avalanche',
    }

    TOP_CRYPTO_PAIRS.forEach((productId) => {
      this.productInfo.set(productId, {
        name: cryptoNames[productId] || productId.split('-')[0],
        baseIncrement: '0.00000001',
        quoteIncrement: '0.01',
      })
    })

    logger.info('Product information initialized', {
      productCount: this.productInfo.size,
    })
  }

  /**
   * Start the market data relay
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('MarketDataRelay is already running')
      return
    }

    try {
      // Connect to Coinbase WebSocket feed
      logger.info('Connecting to Coinbase WebSocket feed...')
      await this.coinbaseWs.connect()

      // Subscribe to ticker channel for top cryptocurrencies
      logger.info(`Subscribing to ticker channel for ${TOP_CRYPTO_PAIRS.length} pairs`)
      this.coinbaseWs.subscribe(TOP_CRYPTO_PAIRS, ['ticker'])

      // Register message handler
      this.coinbaseWs.onMessage((message) => {
        if (message.type === 'ticker') {
          this.handleTickerMessage(message)
        }
      })

      // Start batching mechanism
      this.startBatching()

      this.isRunning = true
      logger.info('MarketDataRelay started successfully')
    } catch (error) {
      logger.error('Failed to start MarketDataRelay', {
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }

  /**
   * Handle incoming ticker messages from Coinbase
   */
  private handleTickerMessage(message: TickerMessage): void {
    // Add to queue for batching
    this.updateQueue.set(message.productId, message)
  }

  /**
   * Start the batching mechanism
   */
  private startBatching(): void {
    this.batchInterval = setInterval(() => {
      this.processBatch()
    }, this.batchIntervalMs)

    logger.info('Market data batching started', {
      intervalMs: this.batchIntervalMs,
      targetFps: Math.round(1000 / this.batchIntervalMs),
    })
  }

  /**
   * Process and broadcast batched updates
   */
  private processBatch(): void {
    if (this.updateQueue.size === 0) {
      return
    }

    // Get all queued updates
    const updates = Array.from(this.updateQueue.values())
    this.updateQueue.clear()

    // Enrich data with calculated fields
    const enrichedUpdates = updates.map((update) => {
      const enriched = this.enrichTickerData(update)
      // Update cache
      this.latestTickerState.set(enriched.productId, enriched)
      return enriched
    })

    // Create batch message
    const batchMessage: EnrichedTickerUpdate = {
      type: 'ticker_batch',
      updates: enrichedUpdates,
      batchTimestamp: Date.now(),
    }

    // Broadcast to all connected frontend clients
    this.frontendWs.broadcast(batchMessage)

    logger.debug('Broadcasted ticker batch', {
      updateCount: enrichedUpdates.length,
      clientCount: this.frontendWs.getClientCount(),
    })
  }

  /**
   * Enrich ticker data with calculated fields
   */
  private enrichTickerData(ticker: TickerMessage) {
    // Calculate 24h change
    const change24h = ticker.price - ticker.open24h
    const change24hPercent = ticker.open24h > 0 
      ? (change24h / ticker.open24h) * 100 
      : 0

    // Extract symbol from productId (e.g., "BTC-USD" -> "BTC")
    const symbol = ticker.productId.split('-')[0]

    // Get product info
    const productInfo = this.productInfo.get(ticker.productId)
    const name = productInfo?.name || symbol

    // Calculate market cap using approximate circulating supply
    const marketCap = this.calculateMarketCap(symbol, ticker.price)

    // Format timestamp
    const formattedTimestamp = new Date(ticker.timestamp).toISOString()

    return {
      symbol,
      name,
      productId: ticker.productId,
      price: ticker.price,
      change24h: parseFloat(change24h.toFixed(2)),
      change24hPercent: parseFloat(change24hPercent.toFixed(2)),
      volume24h: ticker.volume24h,
      marketCap: parseFloat(marketCap.toFixed(2)),
      high24h: ticker.high24h,
      low24h: ticker.low24h,
      bestBid: ticker.bestBid,
      bestAsk: ticker.bestAsk,
      timestamp: ticker.timestamp,
      formattedTimestamp,
    }
  }

  /**
   * Calculate market cap using approximate circulating supply
   * In production, this should fetch real-time supply from CoinGecko or similar API
   */
  private calculateMarketCap(symbol: string, price: number): number {
    // Approximate circulating supply for major cryptocurrencies (as of 2024)
    const circulatingSupply: Record<string, number> = {
      'BTC': 19700000,
      'ETH': 120000000,
      'SOL': 400000000,
      'DOGE': 140000000000,
      'XRP': 53000000000,
      'LINK': 500000000,
      'LTC': 74000000,
      'BCH': 19700000,
      'AAVE': 16000000,
      'UNI': 750000000,
      'ADA': 35000000000,
      'AVAX': 350000000,
      'DOT': 1200000000,
      'SHIB': 589000000000000,
      'ATOM': 290000000,
      'ALGO': 7000000000,
    }

    const supply = circulatingSupply[symbol] || 0
    return supply * price
  }

  /**
   * Stop the batching mechanism
   */
  private stopBatching(): void {
    if (this.batchInterval) {
      clearInterval(this.batchInterval)
      this.batchInterval = null
      logger.info('Market data batching stopped')
    }
  }

  /**
   * Stop the market data relay
   */
  stop(): void {
    if (!this.isRunning) {
      return
    }

    this.stopBatching()
    this.coinbaseWs.disconnect()
    this.updateQueue.clear()
    this.isRunning = false

    logger.info('MarketDataRelay stopped')
  }

  /**
   * Get current connection status
   */
  getStatus(): {
    isRunning: boolean
    coinbaseStatus: string
    queueSize: number
    subscribedPairs: number
  } {
    return {
      isRunning: this.isRunning,
      coinbaseStatus: this.coinbaseWs.getConnectionStatus(),
      queueSize: this.updateQueue.size,
      subscribedPairs: TOP_CRYPTO_PAIRS.length,
    }
  }

  /**
   * Get list of subscribed cryptocurrency pairs
   */
  getSubscribedPairs(): string[] {
    return [...TOP_CRYPTO_PAIRS]
  }
}
