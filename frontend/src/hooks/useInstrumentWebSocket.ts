import { useEffect, useRef, useState, useCallback } from 'react'

export interface TickerData {
  symbol: string
  productId: string
  price: number
  change24h: number
  change24hPercent: number
  volume24h: number
  high24h: number
  low24h: number
  bestBid: number
  bestAsk: number
  timestamp: number
}

interface UseInstrumentWebSocketOptions {
  symbol: string
  enabled?: boolean
}

interface UseInstrumentWebSocketReturn {
  ticker: TickerData | null
  isConnected: boolean
  lastUpdate: number
}

/**
 * Hook for subscribing to real-time ticker updates for a specific instrument
 * Uses WebSocket subscription/unsubscription for per-instrument updates
 */
export function useInstrumentWebSocket({
  symbol,
  enabled = true,
}: UseInstrumentWebSocketOptions): UseInstrumentWebSocketReturn {
  const [ticker, setTicker] = useState<TickerData | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(0)
  
  const wsRef = useRef<WebSocket | null>(null)
  const currentSymbolRef = useRef<string>(symbol)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const isUnmountingRef = useRef(false)

  const maxReconnectAttempts = 5
  const baseDelay = 1000

  // Update ref when symbol changes
  useEffect(() => {
    currentSymbolRef.current = symbol
    setTicker(null) // Reset ticker data when symbol changes to avoid stale data
  }, [symbol])

  const subscribe = useCallback((ws: WebSocket, productId: string) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'subscribe', productId }))
    }
  }, [])

  const unsubscribe = useCallback((ws: WebSocket, productId: string) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'unsubscribe', productId }))
    }
  }, [])

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message = JSON.parse(event.data)
      
      // Handle ticker updates
      if (message.type === 'ticker' && message.data) {
        const productId = message.productId
        const expectedProductId = `${currentSymbolRef.current}-USD`
        
        // Only update if this is for our current symbol
        if (productId === expectedProductId) {
          setTicker(message.data as TickerData)
          setLastUpdate(Date.now())
        }
      }
      
      // Handle subscription confirmations
      if (message.type === 'subscribed') {
        // Subscription confirmed
      }
      
      if (message.type === 'unsubscribed') {
        // Unsubscription confirmed
      }
    } catch {
      // Ignore parse errors
    }
  }, [])

  const connect = useCallback(() => {
    if (isUnmountingRef.current) return
    if (!enabled) return
    
    // Get JWT token
    const token = localStorage.getItem('spectra_auth_token')
    if (!token) {
      setIsConnected(false)
      return
    }

    const baseWsUrl = import.meta.env.VITE_BACKEND_WS_URL || 'ws://localhost:3002'
    const wsUrl = `${baseWsUrl}?token=${encodeURIComponent(token)}`

    try {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        setIsConnected(true)
        reconnectAttemptsRef.current = 0
        
        // Subscribe to current symbol
        const productId = `${currentSymbolRef.current}-USD`
        subscribe(ws, productId)
      }

      ws.onmessage = handleMessage

      ws.onerror = () => {
        // Error handled by onclose
      }

      ws.onclose = (event) => {
        if (wsRef.current !== ws) return
        
        setIsConnected(false)
        wsRef.current = null

        if (isUnmountingRef.current) return

        // Reconnect with backoff
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = baseDelay * Math.pow(2, reconnectAttemptsRef.current)
          reconnectAttemptsRef.current++
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, Math.min(delay, 30000))
        }
      }
    } catch {
      setIsConnected(false)
    }
  }, [enabled, subscribe, handleMessage])

  const disconnect = useCallback(() => {
    isUnmountingRef.current = true
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (wsRef.current) {
      // Unsubscribe before closing
      const productId = `${currentSymbolRef.current}-USD`
      unsubscribe(wsRef.current, productId)
      
      wsRef.current.close(1000, 'Client disconnect')
      wsRef.current = null
    }

    setIsConnected(false)
    setTicker(null)
  }, [unsubscribe])

  // Connect on mount
  useEffect(() => {
    isUnmountingRef.current = false
    connect()

    return () => {
      disconnect()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Handle symbol changes - resubscribe
  useEffect(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return

    const ws = wsRef.current
    const newProductId = `${symbol}-USD`
    
    // Get previous symbol from ref before updating
    const prevSymbol = currentSymbolRef.current
    const prevProductId = `${prevSymbol}-USD`
    
    // Unsubscribe from previous, subscribe to new
    if (prevProductId !== newProductId) {
      unsubscribe(ws, prevProductId)
      subscribe(ws, newProductId)
      
      // Clear old ticker data immediately to prevent showing stale data
      setTicker(null)
    }
    
    currentSymbolRef.current = symbol
  }, [symbol, subscribe, unsubscribe])

  return {
    ticker,
    isConnected,
    lastUpdate,
  }
}
