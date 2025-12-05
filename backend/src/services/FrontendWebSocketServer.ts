import { WebSocketServer, WebSocket } from 'ws'
import { IncomingMessage } from 'http'
import logger from '../utils/logger.js'
import jwt from 'jsonwebtoken'

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string
  isAlive?: boolean
}

interface ClientInfo {
  userId: string
  connectedAt: number
  subscriptions: Set<string> // Product IDs this client is subscribed to
}

export interface BroadcastMessage {
  type: string
  [key: string]: unknown
}

export class FrontendWebSocketServer {
  private wss: WebSocketServer | null = null
  private clients: Map<WebSocket, ClientInfo> = new Map()
  private heartbeatInterval: NodeJS.Timeout | null = null
  private readonly heartbeatIntervalMs = 30000 // 30 seconds
  private readonly port: number
  private onConnectionCallbacks: Array<(ws: WebSocket, userId: string) => void> = []

  constructor(port: number = 3002) {
    this.port = port
  }

  /**
   * Register a callback for new connections
   */
  onConnection(callback: (ws: WebSocket, userId: string) => void): void {
    this.onConnectionCallbacks.push(callback)
  }

  /**
   * Start the WebSocket server
   */
  start(): void {
    this.wss = new WebSocketServer({ port: this.port })

    this.wss.on('connection', (ws: AuthenticatedWebSocket, req: IncomingMessage) => {
      this.handleConnection(ws, req)
    })

    this.wss.on('error', (error: Error) => {
      logger.error('WebSocket server error', { message: error.message })
    })

    // Start heartbeat mechanism
    this.startHeartbeat()

    logger.info(`Frontend WebSocket server started on port ${this.port}`)
  }

  /**
   * Handle new client connection
   */
  private handleConnection(ws: AuthenticatedWebSocket, req: IncomingMessage): void {
    // Authenticate the connection using JWT token from query params or headers
    const userId = this.authenticateConnection(req)

    if (!userId) {
      logger.warn('WebSocket connection rejected: authentication failed')
      ws.close(1008, 'Authentication failed')
      return
    }

    // Mark connection as alive
    ws.isAlive = true
    ws.userId = userId

    // Store client info
    this.clients.set(ws, {
      userId,
      connectedAt: Date.now(),
      subscriptions: new Set(),
    })

    // Notify callbacks
    this.onConnectionCallbacks.forEach((callback) => {
      try {
        callback(ws, userId)
      } catch (error) {
        logger.error('Error in onConnection callback', { error })
      }
    })

    logger.info('Frontend client connected', {
      userId,
      clientCount: this.clients.size,
    })

    // Handle pong responses for heartbeat
    ws.on('pong', () => {
      ws.isAlive = true
    })

    // Handle client messages
    ws.on('message', (data: Buffer) => {
      this.handleMessage(ws, data)
    })

    // Handle client disconnect
    ws.on('close', () => {
      this.handleDisconnect(ws)
    })

    // Handle errors
    ws.on('error', (error: Error) => {
      logger.error('WebSocket client error', {
        userId,
        message: error.message,
      })
    })

    // Send welcome message
    this.sendToClient(ws, {
      type: 'connected',
      message: 'Connected to Spectra WebSocket server',
      timestamp: Date.now(),
    })
  }

  /**
   * Authenticate WebSocket connection using JWT token
   */
  private authenticateConnection(req: IncomingMessage): string | null {
    try {
      // Try to get token from query params
      const url = new URL(req.url || '', `http://${req.headers.host}`)
      const token = url.searchParams.get('token')

      if (token) {
        return this.verifyToken(token)
      }

      // Try to get token from Authorization header
      const authHeader = req.headers.authorization
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const headerToken = authHeader.substring(7)
        return this.verifyToken(headerToken)
      }

      // Try to get token from cookies
      const cookieHeader = req.headers.cookie
      if (cookieHeader) {
        const cookies = this.parseCookies(cookieHeader)
        const cookieToken = cookies['auth_token']
        if (cookieToken) {
          return this.verifyToken(cookieToken)
        }
      }

      return null
    } catch (error) {
      logger.error('Error authenticating WebSocket connection', { error })
      return null
    }
  }

  /**
   * Parse cookie header string into key-value pairs
   */
  private parseCookies(cookieHeader: string): Record<string, string> {
    const cookies: Record<string, string> = {}
    cookieHeader.split(';').forEach((cookie) => {
      const [name, ...rest] = cookie.split('=')
      const value = rest.join('=').trim()
      if (name && value) {
        cookies[name.trim()] = decodeURIComponent(value)
      }
    })
    return cookies
  }

  /**
   * Verify JWT token and extract userId
   */
  private verifyToken(token: string): string | null {
    try {
      const jwtSecret = process.env.JWT_SECRET
      if (!jwtSecret) {
        logger.error('JWT_SECRET not configured')
        return null
      }

      const decoded = jwt.verify(token, jwtSecret) as { userId: string }
      return decoded.userId || null
    } catch (error) {
      logger.error('JWT verification failed', { error })
      return null
    }
  }

  /**
   * Handle incoming messages from clients
   */
  private handleMessage(ws: AuthenticatedWebSocket, data: Buffer): void {
    try {
      const message = JSON.parse(data.toString())
      const clientInfo = this.clients.get(ws)

      logger.debug('Received message from client', {
        userId: clientInfo?.userId,
        messageType: message.type,
      })

      // Handle different message types
      switch (message.type) {
        case 'ping':
          this.sendToClient(ws, { type: 'pong', timestamp: Date.now() })
          break
        case 'subscribe':
          this.handleSubscribe(ws, message.productId)
          break
        case 'unsubscribe':
          this.handleUnsubscribe(ws, message.productId)
          break
        default:
          logger.warn('Unknown message type', { type: message.type })
      }
    } catch (error) {
      logger.error('Error handling client message', { error })
    }
  }

  /**
   * Handle subscribe request from client
   */
  private handleSubscribe(ws: WebSocket, productId: string): void {
    const clientInfo = this.clients.get(ws)
    if (!clientInfo || !productId) return

    clientInfo.subscriptions.add(productId)
    
    logger.debug('Client subscribed to product', {
      userId: clientInfo.userId,
      productId,
      subscriptionCount: clientInfo.subscriptions.size,
    })

    this.sendToClient(ws, {
      type: 'subscribed',
      productId,
      timestamp: Date.now(),
    })
  }

  /**
   * Handle unsubscribe request from client
   */
  private handleUnsubscribe(ws: WebSocket, productId: string): void {
    const clientInfo = this.clients.get(ws)
    if (!clientInfo || !productId) return

    clientInfo.subscriptions.delete(productId)
    
    logger.debug('Client unsubscribed from product', {
      userId: clientInfo.userId,
      productId,
      subscriptionCount: clientInfo.subscriptions.size,
    })

    this.sendToClient(ws, {
      type: 'unsubscribed',
      productId,
      timestamp: Date.now(),
    })
  }

  /**
   * Handle client disconnect
   */
  private handleDisconnect(ws: WebSocket): void {
    const clientInfo = this.clients.get(ws)
    if (clientInfo) {
      const { userId } = clientInfo
      logger.info('Frontend client disconnected', {
        userId,
        clientCount: this.clients.size - 1,
      })
    }
    this.clients.delete(ws)
  }

  /**
   * Broadcast message to all connected clients
   */
  broadcast(message: BroadcastMessage): void {
    const messageStr = JSON.stringify(message)
    let sentCount = 0

    this.clients.forEach((clientInfo, ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(messageStr)
          sentCount++
        } catch (error) {
          logger.error('Error broadcasting to client', {
            userId: clientInfo.userId,
            error,
          })
        }
      }
    })

    logger.debug('Broadcast message sent', {
      messageType: message.type,
      clientCount: sentCount,
    })
  }

  /**
   * Broadcast ticker to subscribed clients only
   * Throttled to 1 message per second per product
   */
  private lastTickerBroadcast: Map<string, number> = new Map()
  private readonly tickerThrottleMs = 1000 // 1 second

  broadcastTicker(productId: string, ticker: BroadcastMessage): void {
    // Throttle broadcasts to 1 per second per product
    const now = Date.now()
    const lastBroadcast = this.lastTickerBroadcast.get(productId) || 0
    
    if (now - lastBroadcast < this.tickerThrottleMs) {
      return // Skip this broadcast, too soon
    }
    
    this.lastTickerBroadcast.set(productId, now)

    const message = {
      type: 'ticker',
      productId,
      data: ticker,
      timestamp: now,
    }
    const messageStr = JSON.stringify(message)
    let sentCount = 0

    this.clients.forEach((clientInfo, ws) => {
      // Only send to clients subscribed to this product
      if (clientInfo.subscriptions.has(productId) && ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(messageStr)
          sentCount++
        } catch (error) {
          logger.error('Error broadcasting ticker to client', {
            userId: clientInfo.userId,
            productId,
            error,
          })
        }
      }
    })

    if (sentCount > 0) {
      logger.debug('Ticker broadcast sent', {
        productId,
        clientCount: sentCount,
      })
    }
  }

  /**
   * Send message to specific client
   */
  private sendToClient(ws: WebSocket, message: BroadcastMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message))
      } catch (error) {
        logger.error('Error sending message to client', { error })
      }
    }
  }

  /**
   * Send message to specific user (all their connections)
   */
  sendToUser(userId: string, message: BroadcastMessage): void {
    const messageStr = JSON.stringify(message)
    let sentCount = 0

    this.clients.forEach((clientInfo, ws) => {
      if (clientInfo.userId === userId && ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(messageStr)
          sentCount++
        } catch (error) {
          logger.error('Error sending message to user', { userId, error })
        }
      }
    })

    logger.debug('Message sent to user', { userId, connectionCount: sentCount })
  }

  /**
   * Start heartbeat mechanism to detect dead connections
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.clients.forEach((clientInfo, ws: AuthenticatedWebSocket) => {
        if (ws.isAlive === false) {
          logger.info('Terminating dead connection', { userId: clientInfo.userId })
          this.clients.delete(ws)
          return ws.terminate()
        }

        ws.isAlive = false
        ws.ping()
      })
    }, this.heartbeatIntervalMs)

    logger.info('Heartbeat mechanism started', {
      intervalMs: this.heartbeatIntervalMs,
    })
  }

  /**
   * Stop heartbeat mechanism
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
      logger.info('Heartbeat mechanism stopped')
    }
  }

  /**
   * Get number of connected clients
   */
  getClientCount(): number {
    return this.clients.size
  }

  /**
   * Get connected user IDs
   */
  getConnectedUsers(): string[] {
    const userIds = new Set<string>()
    this.clients.forEach((clientInfo) => {
      userIds.add(clientInfo.userId)
    })
    return Array.from(userIds)
  }

  /**
   * Stop the WebSocket server
   */
  stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.stopHeartbeat()

      if (!this.wss) {
        resolve()
        return
      }

      // Close all client connections
      this.clients.forEach((_clientInfo, ws) => {
        ws.close(1000, 'Server shutting down')
      })
      this.clients.clear()

      // Close the server
      this.wss.close((error) => {
        if (error) {
          logger.error('Error closing WebSocket server', { message: error.message })
          reject(error)
        } else {
          logger.info('Frontend WebSocket server stopped')
          this.wss = null
          resolve()
        }
      })
    })
  }
}
