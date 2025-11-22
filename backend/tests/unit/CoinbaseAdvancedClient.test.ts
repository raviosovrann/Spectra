/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { CoinbaseAdvancedClient } from '../../src/services/CoinbaseAdvancedClient.js'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch as unknown as typeof fetch

// Generate a valid EC private key for testing
const { privateKey: testPrivateKey } = crypto.generateKeyPairSync('ec', {
  namedCurve: 'prime256v1',
  privateKeyEncoding: {
    type: 'sec1',
    format: 'pem'
  },
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  }
})

describe('CoinbaseAdvancedClient - Unit Tests', () => {
  const mockApiKeyName = 'organizations/test-org-id/apiKeys/test-key-id'
  const mockPrivateKey = testPrivateKey

  let client: CoinbaseAdvancedClient

  beforeEach(() => {
    vi.clearAllMocks()
    client = new CoinbaseAdvancedClient(mockApiKeyName, mockPrivateKey)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Constructor and Initialization', () => {
    it('should initialize with API key name and private key', () => {
      expect(client).toBeDefined()
      expect(client).toBeInstanceOf(CoinbaseAdvancedClient)
    })

    it('should handle private key with literal \\n characters', () => {
      const keyWithLiteralNewlines = mockPrivateKey.replace(/\n/g, '\\n')
      const clientWithEscaped = new CoinbaseAdvancedClient(mockApiKeyName, keyWithLiteralNewlines)
      expect(clientWithEscaped).toBeDefined()
    })

    it('should handle private key with surrounding quotes', () => {
      const quotedKey = `"${mockPrivateKey}"`
      const clientWithQuotes = new CoinbaseAdvancedClient(mockApiKeyName, quotedKey)
      expect(clientWithQuotes).toBeDefined()
    })

    it('should handle private key with single quotes', () => {
      const singleQuotedKey = `'${mockPrivateKey}'`
      const clientWithSingleQuotes = new CoinbaseAdvancedClient(mockApiKeyName, singleQuotedKey)
      expect(clientWithSingleQuotes).toBeDefined()
    })

    it('should use default base URL if not provided', () => {
      const defaultClient = new CoinbaseAdvancedClient(mockApiKeyName, mockPrivateKey)
      expect(defaultClient).toBeDefined()
    })

    it('should use custom base URL if provided', () => {
      const customUrl = 'https://api-sandbox.coinbase.com'
      const customClient = new CoinbaseAdvancedClient(mockApiKeyName, mockPrivateKey, customUrl)
      expect(customClient).toBeDefined()
    })
  })

  describe('JWT Token Generation', () => {
    it('should generate valid JWT token with correct structure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: vi.fn().mockResolvedValue(JSON.stringify({ accounts: [] })),
      } as any)

      await client.getAccounts()

      expect(mockFetch).toHaveBeenCalledTimes(1)
      const callArgs = mockFetch.mock.calls[0]
      const headers = callArgs[1]?.headers as Record<string, string>
      
      expect(headers.Authorization).toBeDefined()
      expect(headers.Authorization).toMatch(/^Bearer .+/)
      
      const token = headers.Authorization.replace('Bearer ', '')
      expect(token.split('.').length).toBe(3) // JWT has 3 parts
    })

    it('should include correct claims in JWT token', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: vi.fn().mockResolvedValue(JSON.stringify({ accounts: [] })),
      } as any)

      await client.getAccounts()

      const callArgs = mockFetch.mock.calls[0]
      const headers = callArgs[1]?.headers as Record<string, string>
      const token = headers.Authorization.replace('Bearer ', '')
      
      // Decode without verification for testing
      const decoded = jwt.decode(token) as jwt.JwtPayload & {
        iss: string
        sub: string
        uri: string
        nbf: number
        exp: number
      }

      expect(decoded.iss).toBe('coinbase-cloud')
      expect(decoded.sub).toBe(mockApiKeyName)
      expect(decoded.uri).toContain('GET')
      expect(decoded.uri).toContain('/api/v3/brokerage/accounts')
      expect(decoded.nbf).toBeDefined()
      expect(decoded.exp).toBeDefined()
      expect(decoded.exp - decoded.nbf).toBe(120) // 2 minute expiration
    })

    it('should include kid (Key ID) in JWT header', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: vi.fn().mockResolvedValue(JSON.stringify({ accounts: [] })),
      } as any)

      await client.getAccounts()

      const callArgs = mockFetch.mock.calls[0]
      const headers = callArgs[1]?.headers as Record<string, string>
      const token = headers.Authorization.replace('Bearer ', '')
      
      // Decode header
      const headerB64 = token.split('.')[0]
      const header = JSON.parse(Buffer.from(headerB64, 'base64').toString())

      expect(header.kid).toBe(mockApiKeyName)
      expect(header.alg).toBe('ES256')
      expect(header.nonce).toBeDefined()
    })

    it('should generate unique nonce for each request', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: vi.fn().mockResolvedValue(JSON.stringify({ accounts: [] })),
      } as any)

      await client.getAccounts()
      await client.getAccounts()

      const call1Headers = mockFetch.mock.calls[0][1]?.headers as Record<string, string>
      const call2Headers = mockFetch.mock.calls[1][1]?.headers as Record<string, string>
      
      const token1 = call1Headers.Authorization.replace('Bearer ', '')
      const token2 = call2Headers.Authorization.replace('Bearer ', '')
      
      const header1 = JSON.parse(Buffer.from(token1.split('.')[0], 'base64').toString())
      const header2 = JSON.parse(Buffer.from(token2.split('.')[0], 'base64').toString())

      expect(header1.nonce).not.toBe(header2.nonce)
    })

    it('should construct correct URI for different HTTP methods', async () => {
      const orderRequest = {
        client_order_id: 'test-order',
        product_id: 'BTC-USD',
        side: 'BUY' as const,
        order_configuration: {
          market_market_ioc: {
            quote_size: '10',
          },
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: vi.fn().mockResolvedValue(JSON.stringify({ success: true, order_id: 'test-order-id' })),
      } as any)

      await client.placeOrder(orderRequest)

      const callArgs = mockFetch.mock.calls[0]
      const headers = callArgs[1]?.headers as Record<string, string>
      const token = headers.Authorization.replace('Bearer ', '')
      
      const decoded = jwt.decode(token) as jwt.JwtPayload & { uri: string }

      expect(decoded.uri).toContain('POST')
      expect(decoded.uri).toContain('/api/v3/brokerage/orders')
    })
  })

  describe('Request Header Construction', () => {
    it('should include Authorization header with Bearer token', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: vi.fn().mockResolvedValue(JSON.stringify({ accounts: [] })),
      } as any)

      await client.getAccounts()

      const callArgs = mockFetch.mock.calls[0]
      const headers = callArgs[1]?.headers as Record<string, string>

      expect(headers.Authorization).toBeDefined()
      expect(headers.Authorization).toMatch(/^Bearer .+/)
    })

    it('should include Content-Type header', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: vi.fn().mockResolvedValue(JSON.stringify({ accounts: [] })),
      } as any)

      await client.getAccounts()

      const callArgs = mockFetch.mock.calls[0]
      const headers = callArgs[1]?.headers as Record<string, string>

      expect(headers['Content-Type']).toBe('application/json')
    })

    it('should construct correct request URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: vi.fn().mockResolvedValue(JSON.stringify({ accounts: [] })),
      } as any)

      await client.getAccounts()

      const callArgs = mockFetch.mock.calls[0]
      const url = callArgs[0]

      expect(url).toBe('https://api.coinbase.com/api/v3/brokerage/accounts')
    })

    it('should use custom base URL in requests', async () => {
      const customUrl = 'https://api-sandbox.coinbase.com'
      const customClient = new CoinbaseAdvancedClient(mockApiKeyName, mockPrivateKey, customUrl)

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: vi.fn().mockResolvedValue(JSON.stringify({ accounts: [] })),
      } as any)

      await customClient.getAccounts()

      const callArgs = mockFetch.mock.calls[0]
      const url = callArgs[0]

      expect(url).toBe('https://api-sandbox.coinbase.com/api/v3/brokerage/accounts')
    })
  })

  describe('Request Payload Formatting', () => {
    it('should format getAccounts request correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: vi.fn().mockResolvedValue(JSON.stringify({ accounts: [] })),
      } as any)

      await client.getAccounts()

      const callArgs = mockFetch.mock.calls[0]
      expect(callArgs[1]?.method).toBe('GET')
      expect(callArgs[1]?.body).toBeUndefined()
    })

    it('should format getProducts request correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: vi.fn().mockResolvedValue(JSON.stringify({ products: [], num_products: 0 })),
      } as any)

      await client.getProducts()

      const callArgs = mockFetch.mock.calls[0]
      expect(callArgs[1]?.method).toBe('GET')
      expect(callArgs[0]).toContain('/api/v3/brokerage/products')
    })

    it('should format placeOrder request correctly', async () => {
      const orderRequest = {
        client_order_id: 'test-order-123',
        product_id: 'BTC-USD',
        side: 'BUY' as const,
        order_configuration: {
          market_market_ioc: {
            quote_size: '100',
          },
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: vi.fn().mockResolvedValue(JSON.stringify({ success: true, order_id: 'order-id-123' })),
      } as any)

      await client.placeOrder(orderRequest)

      const callArgs = mockFetch.mock.calls[0]
      expect(callArgs[1]?.method).toBe('POST')
      expect(callArgs[1]?.body).toBe(JSON.stringify(orderRequest))
      expect(callArgs[0]).toContain('/api/v3/brokerage/orders')
    })

    it('should format getOrder request correctly', async () => {
      const orderId = 'test-order-id-456'

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: vi.fn().mockResolvedValue(JSON.stringify({ order: { order_id: orderId } })),
      } as any)

      await client.getOrder(orderId)

      const callArgs = mockFetch.mock.calls[0]
      expect(callArgs[1]?.method).toBe('GET')
      expect(callArgs[0]).toContain(`/api/v3/brokerage/orders/historical/${orderId}`)
    })

    it('should format cancelOrder request correctly', async () => {
      const orderId = 'test-order-id-789'

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: vi.fn().mockResolvedValue(JSON.stringify({ success: true, order_id: orderId })),
      } as any)

      await client.cancelOrder(orderId)

      const callArgs = mockFetch.mock.calls[0]
      expect(callArgs[1]?.method).toBe('POST')
      expect(callArgs[1]?.body).toBe(JSON.stringify({ order_ids: [orderId] }))
      expect(callArgs[0]).toContain('/api/v3/brokerage/orders/batch_cancel')
    })
  })

  describe('Error Handling', () => {
    it('should throw error for 401 authentication failure', async () => {
      const freshClient = new CoinbaseAdvancedClient(mockApiKeyName, mockPrivateKey)
      mockFetch.mockClear()
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: vi.fn().mockResolvedValue(JSON.stringify({ error: 'Unauthorized', message: 'Invalid API key' })),
      } as any)

      await expect(freshClient.getAccounts()).rejects.toThrow('Coinbase API Error (401)')
    })

    it('should throw error for 403 forbidden', async () => {
      const freshClient = new CoinbaseAdvancedClient(mockApiKeyName, mockPrivateKey)
      mockFetch.mockClear()
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: vi.fn().mockResolvedValue(JSON.stringify({ error: 'Forbidden', message: 'Insufficient permissions' })),
      } as any)

      await expect(freshClient.getAccounts()).rejects.toThrow('Coinbase API Error (403)')
    })

    it('should throw error when cancelOrder fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: vi.fn().mockResolvedValue(JSON.stringify({ success: false, failure_reason: 'Order not found' })),
      } as any)

      await expect(client.cancelOrder('invalid-order-id')).rejects.toThrow('Failed to cancel order: Order not found')
    })
  })

  describe('Retry Logic with Exponential Backoff', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should retry on network failure with exponential backoff', async () => {
      // Create a fresh client to avoid rate limiting issues
      const freshClient = new CoinbaseAdvancedClient(mockApiKeyName, mockPrivateKey)
      
      // First two attempts fail, third succeeds
      mockFetch
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValueOnce({
          ok: true,
          text: vi.fn().mockResolvedValue(JSON.stringify({ accounts: [] })),
        } as any)

      const promise = freshClient.getAccounts()
      
      // Advance time to trigger retries
      // 1st retry delay: 1000ms
      await vi.advanceTimersByTimeAsync(1000)
      // 2nd retry delay: 2000ms
      await vi.advanceTimersByTimeAsync(2000)
      
      await promise

      expect(mockFetch).toHaveBeenCalledTimes(3)
    })

    it('should retry on 500 server error', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: vi.fn().mockResolvedValue(JSON.stringify({ error: 'Server Error' })),
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          text: vi.fn().mockResolvedValue(JSON.stringify({ accounts: [] })),
        } as any)

      const promise = client.getAccounts()
      
      // 1st retry delay: 1000ms
      await vi.advanceTimersByTimeAsync(1000)
      
      await promise

      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('should NOT retry on 401 authentication error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: vi.fn().mockResolvedValue(JSON.stringify({ error: 'Unauthorized' })),
      } as any)

      await expect(client.getAccounts()).rejects.toThrow()

      expect(mockFetch).toHaveBeenCalledTimes(1) // No retry
    })

    it('should NOT retry on 403 forbidden error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: vi.fn().mockResolvedValue(JSON.stringify({ error: 'Forbidden' })),
      } as any)

      await expect(client.getAccounts()).rejects.toThrow()

      expect(mockFetch).toHaveBeenCalledTimes(1) // No retry
    })

    it('should fail after max retry attempts', async () => {
      mockFetch.mockRejectedValue(new Error('Network timeout'))

      const promise = client.getAccounts()
      const expectPromise = expect(promise).rejects.toThrow('Network timeout')
      
      // Advance time for all retries
      await vi.advanceTimersByTimeAsync(1000) // 1st retry
      await vi.advanceTimersByTimeAsync(2000) // 2nd retry
      await vi.advanceTimersByTimeAsync(4000) // 3rd retry (if any, but max is 3 attempts total, so 2 retries)
      
      await expectPromise

      expect(mockFetch).toHaveBeenCalledTimes(3) // Max 3 attempts
    })

    it('should use exponential backoff delays (1s, 2s, 4s)', async () => {
      // Create a fresh client to avoid rate limiting issues
      const freshClient = new CoinbaseAdvancedClient(mockApiKeyName, mockPrivateKey)
      
      const callTimes: number[] = []

      mockFetch.mockImplementation(async () => {
        callTimes.push(Date.now())
        throw new Error('Network timeout')
      })

      const promise = freshClient.getAccounts()
      const expectPromise = expect(promise).rejects.toThrow()
      
      // Advance time step by step
      await vi.advanceTimersByTimeAsync(1000)
      await vi.advanceTimersByTimeAsync(2000)
      
      await expectPromise

      expect(callTimes.length).toBe(3) // 3 attempts
      
      // Calculate delays between attempts
      const delay1 = callTimes[1] - callTimes[0]
      const delay2 = callTimes[2] - callTimes[1]
      
      expect(delay1).toBe(1000)
      expect(delay2).toBe(2000)
    })
  })

  describe('Rate Limiting', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should track request count', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: vi.fn().mockResolvedValue(JSON.stringify({ accounts: [] })),
      } as any)

      // Make multiple requests
      await client.getAccounts()
      await client.getAccounts()
      await client.getAccounts()

      expect(mockFetch).toHaveBeenCalledTimes(3)
    })

    it('should enforce rate limit of 30 requests per minute', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: vi.fn().mockResolvedValue(JSON.stringify({ accounts: [] })),
      } as any)

      // Make 30 requests (should succeed)
      const promises = Array(30).fill(null).map(() => client.getAccounts())
      await Promise.all(promises)

      expect(mockFetch).toHaveBeenCalledTimes(30)
    })

    it('should delay requests when rate limit is exceeded', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: vi.fn().mockResolvedValue(JSON.stringify({ accounts: [] })),
      } as any)

      // Make 31 requests (31st should be delayed)
      const startTime = Date.now()
      
      // Start all requests
      const promises = Array(31).fill(null).map(() => client.getAccounts())
      
      // The 31st request will wait for the window to reset (60s)
      // We need to advance time to let the 31st request proceed
      await vi.advanceTimersByTimeAsync(60000)
      
      await Promise.all(promises)
      const endTime = Date.now()

      expect(mockFetch).toHaveBeenCalledTimes(31)
      // The 31st request should have been delayed
      expect(endTime - startTime).toBeGreaterThanOrEqual(60000)
    })
  })

  describe('API Method Responses', () => {
    it('should parse getAccounts response correctly', async () => {
      const mockAccounts = [
        {
          uuid: 'account-1',
          name: 'BTC Wallet',
          currency: 'BTC',
          available_balance: { value: '1.5', currency: 'BTC' },
          default: true,
          active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          deleted_at: null,
          type: 'ACCOUNT_TYPE_CRYPTO',
          ready: true,
          hold: { value: '0', currency: 'BTC' },
        },
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: vi.fn().mockResolvedValue(JSON.stringify({ accounts: mockAccounts, has_next: false, cursor: '', size: 1 })),
      } as any)

      const accounts = await client.getAccounts()

      expect(accounts).toEqual(mockAccounts)
      expect(accounts[0].uuid).toBe('account-1')
      expect(accounts[0].currency).toBe('BTC')
    })

    it('should parse getProducts response correctly', async () => {
      const mockProducts = [
        {
          product_id: 'BTC-USD',
          price: '50000',
          price_percentage_change_24h: '2.5',
          volume_24h: '1000000',
          base_name: 'Bitcoin',
          quote_name: 'US Dollar',
        },
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: vi.fn().mockResolvedValue(JSON.stringify({ products: mockProducts, num_products: 1 })),
      } as any)

      const products = await client.getProducts()

      expect(products).toEqual(mockProducts)
      expect(products[0].product_id).toBe('BTC-USD')
    })

    it('should parse placeOrder response correctly', async () => {
      const mockResponse = {
        success: true,
        order_id: 'order-123',
        success_response: {
          order_id: 'order-123',
          product_id: 'BTC-USD',
          side: 'BUY',
          client_order_id: 'client-order-123',
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: vi.fn().mockResolvedValue(JSON.stringify(mockResponse)),
      } as any)

      const orderRequest = {
        client_order_id: 'client-order-123',
        product_id: 'BTC-USD',
        side: 'BUY' as const,
        order_configuration: {
          market_market_ioc: {
            quote_size: '100',
          },
        },
      }

      const response = await client.placeOrder(orderRequest)

      expect(response.success).toBe(true)
      expect(response.order_id).toBe('order-123')
    })

    it('should parse getOrder response correctly', async () => {
      const mockOrder = {
        order_id: 'order-456',
        product_id: 'ETH-USD',
        side: 'SELL',
        status: 'FILLED',
        filled_size: '1.5',
        average_filled_price: '3000',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: vi.fn().mockResolvedValue(JSON.stringify({ order: mockOrder })),
      } as any)

      const order = await client.getOrder('order-456')

      expect(order.order_id).toBe('order-456')
      expect(order.status).toBe('FILLED')
    })

    it('should handle cancelOrder success', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: vi.fn().mockResolvedValue(JSON.stringify({ success: true, order_id: 'order-789' })),
      } as any)

      await expect(client.cancelOrder('order-789')).resolves.toBeUndefined()
    })
  })
})
