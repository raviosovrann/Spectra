import { useEffect, useRef, useState, useCallback } from 'react'
import { useMarketStore } from '../stores/marketStore'
import { Cryptocurrency } from '../types/market'

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting'

type MessageHandler = (data: Record<string, unknown>) => void

interface TickerData {
  symbol?: string
  name?: string
  productId?: string
  price?: number
  change24h?: number
  change24hPercent?: number
  volume24h?: number
  marketCap?: number
  high24h?: number
  low24h?: number
}

interface WebSocketMessage {
  type: string
  data?: Record<string, unknown>
  updates?: TickerData[]
}

interface UseWebSocketReturn {
  status: ConnectionStatus
  connect: () => void
  disconnect: () => void
  send: (message: Record<string, unknown>) => void
  onMessage: (type: string, handler: MessageHandler) => () => void
}

const CRYPTO_NAMES: Record<string, string> = {
  BTC: 'Bitcoin',
  ETH: 'Ethereum',
  SOL: 'Solana',
  ADA: 'Cardano',
  DOGE: 'Dogecoin',
  XRP: 'Ripple',
  DOT: 'Polkadot',
  AVAX: 'Avalanche',
  POL: 'Polygon',
  LINK: 'Chainlink',
  UNI: 'Uniswap',
  ATOM: 'Cosmos',
  LTC: 'Litecoin',
  BCH: 'Bitcoin Cash',
  ALGO: 'Algorand',
  XLM: 'Stellar',
  AAVE: 'Aave',
  NEAR: 'NEAR Protocol',
  APT: 'Aptos',
  ARB: 'Arbitrum',
}

export function useWebSocket(): UseWebSocketReturn {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const messageHandlersRef = useRef<Map<string, MessageHandler[]>>(new Map())
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastMessageTimeRef = useRef<number>(Date.now())
  const isUnmountingRef = useRef(false)
  
  const maxReconnectAttempts = 5
  const baseDelay = 2000 // 2 seconds
  const maxDelay = 30000 // 30 seconds
  const heartbeatInterval = 30000 // 30 seconds
  const messageTimeout = 60000 // 60 seconds - consider disconnected if no message

  const marketStore = useMarketStore()

  const calculateBackoffDelay = useCallback(() => {
    const delay = Math.min(
      baseDelay * Math.pow(2, reconnectAttemptsRef.current),
      maxDelay
    )
    return delay
  }, [])

  const startHeartbeat = useCallback(() => {
    // Clear existing heartbeat
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current)
    }

    // Send ping every 30 seconds and check for stale connection
    heartbeatIntervalRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        // Check if we've received any messages recently
        const timeSinceLastMessage = Date.now() - lastMessageTimeRef.current
        
        if (timeSinceLastMessage > messageTimeout) {
          // Connection appears stale, reconnect
          if (wsRef.current) {
            wsRef.current.close()
          }
        } else {
          // Send ping to keep connection alive
          try {
            wsRef.current.send(JSON.stringify({ type: 'ping' }))
          } catch (error) {
            // Connection is broken, will be handled by onclose
          }
        }
      }
    }, heartbeatInterval)
  }, [])

  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current)
      heartbeatIntervalRef.current = null
    }
  }, [])

  const handleMessage = useCallback((event: MessageEvent) => {
    lastMessageTimeRef.current = Date.now()
    
    try {
      const message = JSON.parse(event.data) as WebSocketMessage
      
      // Handle pong response
      if (message.type === 'pong') {
        return
      }
      
      // Handle ticker batch updates from MarketDataRelay
      if (message.type === 'ticker_batch' && message.updates && Array.isArray(message.updates)) {
        const cryptos: Cryptocurrency[] = message.updates.map((ticker) => {
          const symbol = ticker.symbol || ticker.productId?.split('-')[0] || ''
          const crypto = {
            symbol,
            name: ticker.name || CRYPTO_NAMES[symbol] || symbol,
            productId: ticker.productId || `${symbol}-USD`,
            price: parseFloat(String(ticker.price)) || 0,
            change24h: parseFloat(String(ticker.change24hPercent || ticker.change24h)) || 0,
            volume24h: parseFloat(String(ticker.volume24h)) || 0,
            marketCap: parseFloat(String(ticker.marketCap)) || 0,
            high24h: parseFloat(String(ticker.high24h || ticker.price)) || 0,
            low24h: parseFloat(String(ticker.low24h || ticker.price)) || 0,
            lastUpdate: Date.now(),
          }
          
          return crypto
        })
        
        // Batch update to reduce re-renders
        if (cryptos.length > 0) {
          marketStore.updateBatch(cryptos)
        }
      }
      
      // Route message to registered handlers
      const handlers = messageHandlersRef.current.get(message.type)
      if (handlers && message.data) {
        handlers.forEach((handler) => handler(message.data as Record<string, unknown>))
      }
    } catch (error) {
      // Silently ignore parse errors
    }
  }, [marketStore])

  const connect = useCallback(() => {
    // Reset unmounting flag when trying to connect
    isUnmountingRef.current = false
    
    // Don't connect if already connected or connecting
    if (
      wsRef.current?.readyState === WebSocket.OPEN ||
      wsRef.current?.readyState === WebSocket.CONNECTING
    ) {
      return
    }

    // Clear any existing connection first
    if (wsRef.current) {
      wsRef.current.onclose = null // Prevent reconnection logic
      wsRef.current.close()
      wsRef.current = null
    }

    // Get JWT token from localStorage
    const token = localStorage.getItem('spectra_auth_token')
    if (!token) {
      setStatus('disconnected')
      return
    }

    const baseWsUrl = import.meta.env.VITE_BACKEND_WS_URL || 'ws://localhost:3002'
    const wsUrl = `${baseWsUrl}?token=${encodeURIComponent(token)}`
    
    setStatus('connecting')
    
    try {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        setStatus('connected')
        reconnectAttemptsRef.current = 0
        lastMessageTimeRef.current = Date.now()
        
        // Clear any pending reconnect timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
          reconnectTimeoutRef.current = null
        }

        // Start heartbeat
        startHeartbeat()
      }

      ws.onmessage = handleMessage

      ws.onerror = () => {
        // Error will be handled by onclose
      }

      ws.onclose = (event) => {
        // Only handle if this is still the current connection
        if (wsRef.current !== ws) {
          return
        }
        
        setStatus('disconnected')
        wsRef.current = null
        stopHeartbeat()

        // Don't attempt reconnection if component is unmounting
        if (isUnmountingRef.current) {
          return
        }

        // Attempt reconnection if not a normal closure and under max attempts
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = calculateBackoffDelay()
          setStatus('reconnecting')
          reconnectAttemptsRef.current++
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, delay)
        }
      }
    } catch {
      // Silently handle connection errors during page transitions
      if (!isUnmountingRef.current) {
        setStatus('disconnected')
      }
    }
  }, [handleMessage, calculateBackoffDelay, startHeartbeat, stopHeartbeat])

  const disconnect = useCallback(() => {
    isUnmountingRef.current = true
    stopHeartbeat()
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'Client disconnect')
      wsRef.current = null
    }

    setStatus('disconnected')
    reconnectAttemptsRef.current = 0
  }, [stopHeartbeat])

  const send = useCallback((message: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    }
  }, [])

  const onMessage = useCallback((type: string, handler: MessageHandler) => {
    const handlers = messageHandlersRef.current.get(type) || []
    handlers.push(handler)
    messageHandlersRef.current.set(type, handlers)

    // Return cleanup function
    return () => {
      const currentHandlers = messageHandlersRef.current.get(type) || []
      const filteredHandlers = currentHandlers.filter((h) => h !== handler)
      if (filteredHandlers.length > 0) {
        messageHandlersRef.current.set(type, filteredHandlers)
      } else {
        messageHandlersRef.current.delete(type)
      }
    }
  }, [])

  // Auto-connect on mount (only once)
  useEffect(() => {
    connect()

    // Cleanup on unmount
    return () => {
      disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty dependency array - connect only once on mount

  return {
    status,
    connect,
    disconnect,
    send,
    onMessage,
  }
}
