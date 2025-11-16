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

export class CoinbaseClient {
  private readonly apiKey: string
  private readonly apiSecret: string
  private readonly baseUrl: string
  private readonly retryConfig: RetryConfig
  private requestCount: number = 0
  private requestWindowStart: number = Date.now()
  private readonly maxRequestsPerMinute: number = 30

  constructor(apiKey: string, apiSecret: string, baseUrl?: string) {
    this.apiKey = apiKey
    this.apiSecret = apiSecret
    this.baseUrl = baseUrl || 'https://api.coinbase.com'
    this.retryConfig = {
      maxAttempts: 3,
      baseDelay: 1000, // 1 second
    }
  }

  /**
   * Generate HMAC SHA256 signature for API request authentication
   */
  private generateSignature(timestamp: string, method: string, path: string, body: string): string {
    const message = timestamp + method + path + body
    return crypto.createHmac('sha256', this.apiSecret).update(message).digest('hex')
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
   * Make authenticated request to Coinbase API with retry logic
   */
  private async makeRequest<T>(options: RequestOptions, attempt: number = 1): Promise<T> {
    await this.checkRateLimit()

    const { method, path, body = '' } = options
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const signature = this.generateSignature(timestamp, method, path, body)

    const headers = {
      'CB-ACCESS-KEY': this.apiKey,
      'CB-ACCESS-SIGN': signature,
      'CB-ACCESS-TIMESTAMP': timestamp,
      'Content-Type': 'application/json',
    }

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers,
        body: body || undefined,
      })

      const data = await response.json()

      if (!response.ok) {
        const error = data as CoinbaseError
        throw new Error(`Coinbase API Error: ${error.message || error.error}`)
      }

      return data as T
    } catch (error) {
      // Retry logic with exponential backoff
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
