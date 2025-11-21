import crypto from 'crypto'
import type {
  Account,
  Product,
  OrderRequest,
  OrderResponse,
  Order,
  CoinbaseError,
} from '../types/coinbase.js'

interface RequestOptions {
  method: 'GET' | 'POST' | 'DELETE'
  path: string
  body?: string
}

interface RetryConfig {
  maxAttempts: number
  baseDelay: number
}

/**
 * Coinbase Advanced Trading API Client
 * Supports both CDP API Keys (JWT) and Legacy API Keys (HMAC)
 * 
 * Documentation:
 * - Advanced Trading API: https://docs.cdp.coinbase.com/advanced-trade/docs/welcome
 * - CDP Authentication: https://docs.cdp.coinbase.com/coinbase-app/docs/api-key-authentication
 */
export class CoinbaseAdvancedClient {
  private readonly apiKeyName: string
  private readonly privateKey: string
  private readonly baseUrl: string
  private readonly retryConfig: RetryConfig
  private requestCount: number = 0
  private requestWindowStart: number = Date.now()
  private readonly maxRequestsPerMinute: number = 30

  constructor(apiKeyName: string, privateKey: string, baseUrl?: string) {
    this.apiKeyName = apiKeyName
    this.privateKey = privateKey
    this.baseUrl = baseUrl || 'https://api.coinbase.com'
    this.retryConfig = {
      maxAttempts: 3,
      baseDelay: 1000, // 1 second
    }
  }

  /**
   * Generate JWT token for CDP API Key authentication
   * Based on: https://docs.cdp.coinbase.com/coinbase-app/docs/api-key-authentication#typescript
   */
  private generateJWT(requestMethod: string, requestPath: string): string {
    const algorithm = 'ES256'
    // URI format: "METHOD api.coinbase.com/path" (without https://)
    const uri = `${requestMethod} ${this.baseUrl.replace('https://', '')}${requestPath}`
    
    // Extract just the UUID from the API key name (last part after /)
    const kid = this.apiKeyName.split('/').pop() || this.apiKeyName
    
    // JWT Header
    const header = {
      alg: algorithm,
      kid: kid,
      nonce: crypto.randomBytes(16).toString('hex')
    }

    // JWT Payload
    const now = Math.floor(Date.now() / 1000)
    const payload = {
      sub: kid,
      iss: 'coinbase-cloud',
      nbf: now,
      exp: now + 120, // Token expires in 2 minutes
      uri: uri
    }

    // Encode header and payload
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url')
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url')
    const unsignedToken = `${encodedHeader}.${encodedPayload}`

    // Sign with private key using ECDSA
    const sign = crypto.createSign('SHA256')
    sign.update(unsignedToken)
    sign.end()
    const signature = sign.sign(this.privateKey, 'base64url')

    // Return complete JWT
    return `${unsignedToken}.${signature}`
  }

  /**
   * Track rate limiting to prevent API quota exhaustion
   */
  private async checkRateLimit(): Promise<void> {
    const now = Date.now()
    const windowDuration = 60000 // 1 minute

    // Reset counter if window has passed
    if (now - this.requestWindowStart > windowDuration) {
      this.requestCount = 0
      this.requestWindowStart = now
    }

    // Check if we've exceeded the rate limit
    if (this.requestCount >= this.maxRequestsPerMinute) {
      const waitTime = windowDuration - (now - this.requestWindowStart)
      if (waitTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitTime))
        this.requestCount = 0
        this.requestWindowStart = Date.now()
      }
    }

    this.requestCount++
  }

  /**
   * Make authenticated request to Coinbase Advanced Trading API
   */
  private async makeRequest<T>(options: RequestOptions, attempt: number = 1): Promise<T> {
    await this.checkRateLimit()

    const { method, path, body = '' } = options
    
    // Generate JWT for authentication
    const jwt = this.generateJWT(method, path)
    
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${jwt}`,
      'Content-Type': 'application/json',
    }

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers,
        body: body || undefined,
      })

      // Get response text first to handle non-JSON responses
      const responseText = await response.text()
      
      // Try to parse as JSON
      let data: unknown
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        throw new Error(`Invalid JSON response from Coinbase API (${response.status}): ${responseText.substring(0, 200)}`)
      }

      if (!response.ok) {
        const error = data as CoinbaseError
        throw new Error(`Coinbase API Error (${response.status}): ${error.message || error.error || responseText}`)
      }

      return data as T
    } catch (error) {
      // Don't retry on authentication errors (4xx)
      if (error instanceof Error && (error.message.includes('401') || error.message.includes('403'))) {
        throw error
      }
      
      // Retry logic with exponential backoff for other errors
      if (attempt < this.retryConfig.maxAttempts) {
        const delay = this.retryConfig.baseDelay * Math.pow(2, attempt - 1)
        await new Promise((resolve) => setTimeout(resolve, delay))
        return this.makeRequest<T>(options, attempt + 1)
      }

      throw error
    }
  }

  /**
   * Get all accounts for the authenticated user
   */
  async getAccounts(): Promise<Account[]> {
    interface AccountsResponse {
      accounts: Account[]
      has_next: boolean
      cursor: string
      size: number
    }

    const response = await this.makeRequest<AccountsResponse>({
      method: 'GET',
      path: '/api/v3/brokerage/accounts',
    })

    return response.accounts
  }

  /**
   * Get all available trading products
   */
  async getProducts(): Promise<Product[]> {
    interface ProductsResponse {
      products: Product[]
      num_products: number
    }

    const response = await this.makeRequest<ProductsResponse>({
      method: 'GET',
      path: '/api/v3/brokerage/products',
    })

    return response.products
  }

  /**
   * Place a new order
   */
  async placeOrder(order: OrderRequest): Promise<OrderResponse> {
    interface PlaceOrderResponse {
      success: boolean
      failure_reason?: string
      order_id?: string
      success_response?: {
        order_id: string
        product_id: string
        side: string
        client_order_id: string
      }
      error_response?: {
        error: string
        message: string
        error_details: string
        preview_failure_reason: string
      }
    }

    const response = await this.makeRequest<PlaceOrderResponse>({
      method: 'POST',
      path: '/api/v3/brokerage/orders',
      body: JSON.stringify(order),
    })

    return response
  }

  /**
   * Get details of a specific order
   */
  async getOrder(orderId: string): Promise<Order> {
    interface GetOrderResponse {
      order: Order
    }

    const response = await this.makeRequest<GetOrderResponse>({
      method: 'GET',
      path: `/api/v3/brokerage/orders/historical/${orderId}`,
    })

    return response.order
  }

  /**
   * Cancel an existing order
   */
  async cancelOrder(orderId: string): Promise<void> {
    interface CancelOrderResponse {
      success: boolean
      failure_reason?: string
      order_id: string
    }

    const response = await this.makeRequest<CancelOrderResponse>({
      method: 'POST',
      path: '/api/v3/brokerage/orders/batch_cancel',
      body: JSON.stringify({ order_ids: [orderId] }),
    })

    if (!response.success) {
      throw new Error(`Failed to cancel order: ${response.failure_reason}`)
    }
  }
}
