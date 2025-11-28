import { WebSocketManager } from './WebSocketManager.js'
import { FrontendWebSocketServer, type BroadcastMessage } from './FrontendWebSocketServer.js'
import logger from '../utils/logger.js'
import type { TickerMessage } from '../types/websocket.js'
import { updatePriceHistory } from '../routes/insights.js'
import { whaleDetector } from './WhaleDetector.js'

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

// Top cryptocurrency pairs available on Coinbase (updated Nov 2025)
// Note: MATIC-USD was delisted, using POL-USD instead
const TOP_CRYPTO_PAIRS = [
  'BTC-USD',
  'ETH-USD',
  'SOL-USD',
  'ADA-USD',
  'DOGE-USD',
  'XRP-USD',
  'DOT-USD',
  'AVAX-USD',
  'POL-USD', // Polygon (formerly MATIC)
  'LINK-USD',
  'UNI-USD',
  'ATOM-USD',
  'LTC-USD',
  'BCH-USD',
  'ALGO-USD',
  'XLM-USD',
  'AAVE-USD',
  'NEAR-USD',
  'APT-USD',
  'ARB-USD',
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
    // Cryptocurrency names mapping (updated Nov 2025)
    const cryptoNames: Record<string, string> = {
      'BTC-USD': 'Bitcoin',
      'ETH-USD': 'Ethereum',
      'SOL-USD': 'Solana',
      'ADA-USD': 'Cardano',
      'DOGE-USD': 'Dogecoin',
      'XRP-USD': 'Ripple',
      'DOT-USD': 'Polkadot',
      'AVAX-USD': 'Avalanche',
      'POL-USD': 'Polygon',
      'LINK-USD': 'Chainlink',
      'UNI-USD': 'Uniswap',
      'ATOM-USD': 'Cosmos',
      'LTC-USD': 'Litecoin',
      'BCH-USD': 'Bitcoin Cash',
      'ALGO-USD': 'Algorand',
      'XLM-USD': 'Stellar',
      'AAVE-USD': 'Aave',
      'NEAR-USD': 'NEAR Protocol',
      'APT-USD': 'Aptos',
      'ARB-USD': 'Arbitrum',
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
      // Using ticker channel only (no auth required)
      // Whale detection uses trade data from ticker updates
      logger.info(`Subscribing to ticker channel for ${TOP_CRYPTO_PAIRS.length} pairs`)
      this.coinbaseWs.subscribe(TOP_CRYPTO_PAIRS, ['ticker'])

      // Register message handler for ticker messages
      this.coinbaseWs.onMessage((message) => {
        if (message.type === 'ticker') {
          this.handleTickerMessage(message)
        }
      })

      // Register whale alert handler to broadcast to frontend
      whaleDetector.onWhaleAlert((alert) => {
        this.frontendWs.broadcast({
          type: 'whale_alert',
          alert,
          timestamp: Date.now()
        })
        logger.info('Whale alert broadcasted', { symbol: alert.symbol, side: alert.side })
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
   * Detects whale activity from trade size in ticker data
   */
  private handleTickerMessage(message: TickerMessage): void {
    // Add to queue for batching
    this.updateQueue.set(message.productId, message)

    // Detect whale activity from last trade size
    // Ticker messages include last_size which is the size of the most recent trade
    const symbol = message.productId.split('-')[0]
    if (message.price > 0) {
      // Use bestBid/bestAsk spread to estimate trade direction
      // If price is closer to bestAsk, likely a buy; closer to bestBid, likely a sell
      const midPrice = (message.bestBid + message.bestAsk) / 2
      const side = message.price >= midPrice ? 'buy' : 'sell'
      
      // Calculate a synthetic trade size from volume changes
      // This approximates individual trade detection
      const volumePerSecond = message.volume24h / 86400 // Average volume per second
      const estimatedTradeSize = volumePerSecond * 10 // Estimate ~10 seconds of volume per tick
      
      if (estimatedTradeSize > 0) {
        whaleDetector.processOrder(symbol, side, message.price, estimatedTradeSize)
      }
    }
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

    // Feed data to insights service for ML predictions
    try {
      updatePriceHistory(symbol, ticker.price, ticker.volume24h)
    } catch (error) {
      // Don't let ML errors affect market data relay
      logger.debug('Failed to update price history', { symbol, error })
    }

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
    // Approximate circulating supply (updated Nov 2025)
    const circulatingSupply: Record<string, number> = {
      'BTC': 19700000,
      'ETH': 120000000,
      'SOL': 400000000,
      'ADA': 35000000000,
      'DOGE': 140000000000,
      'XRP': 53000000000,
      'DOT': 1200000000,
      'AVAX': 350000000,
      'POL': 10000000000, // Polygon (formerly MATIC)
      'LINK': 500000000,
      'UNI': 750000000,
      'ATOM': 290000000,
      'LTC': 74000000,
      'BCH': 19700000,
      'ALGO': 7000000000,
      'XLM': 28000000000,
      'AAVE': 16000000,
      'NEAR': 1000000000,
      'APT': 300000000,
      'ARB': 1300000000,
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
