import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import type {
  Account,
  Product,
  OrderRequest,
  OrderResponse,
  Order,
  CoinbaseError,
  PaymentMethod,
  FiatTransferRequest,
  FiatTransferResponse,
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
    // Ensure private key has correct newline formatting for PEM
    // 1. Replace literal \n with actual newlines
    // 2. Remove surrounding quotes if present
    // 3. Trim whitespace
    let cleanKey = privateKey.replace(/\\n/g, '\n')
    if (cleanKey.startsWith('"') && cleanKey.endsWith('"')) {
      cleanKey = cleanKey.slice(1, -1)
    }
    if (cleanKey.startsWith("'") && cleanKey.endsWith("'")) {
      cleanKey = cleanKey.slice(1, -1)
    }
    this.privateKey = cleanKey.trim()
    
    this.baseUrl = baseUrl || 'https://api.coinbase.com'
    this.retryConfig = {
      maxAttempts: 3,
      baseDelay: 1000, // 1 second
    }
  }

  /**
   * Generate JWT token for CDP API Key authentication
   * 
   * The JWT is signed using the ES256 algorithm and includes the following claims:
   * - iss: 'coinbase-cloud' (Issuer)
   * - nbf: Not Before time (now)
   * - exp: Expiration time (now + 2 minutes)
   * - sub: Subject (API Key Name)
   * - uri: The request URI (method + host + path)
   * 
   * The header must include the 'kid' (Key ID) which is the API Key Name.
   * 
   * @param requestMethod - HTTP method (GET, POST, etc.)
   * @param requestPath - API endpoint path (e.g., /api/v3/brokerage/accounts)
   * @returns Signed JWT string
   */
  private generateJWT(requestMethod: string, requestPath: string): string {
    // Construct the URI for the claim: method + host + path (no protocol)
    const uri = `${requestMethod} ${this.baseUrl.replace('https://', '')}${requestPath}`

    return jwt.sign(
      {
        iss: 'coinbase-cloud',
        nbf: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 120, // 2 minute expiration (Coinbase requirement for request-specific JWTs)
        sub: this.apiKeyName,
        uri,
      },
      this.privateKey,
      {
        algorithm: 'ES256',
        header: {
          kid: this.apiKeyName,
          nonce: crypto.randomBytes(16).toString('hex'),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      }
    )
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
   * Get all accounts for the authenticated user.
   * 
   * This endpoint retrieves a list of all accounts for the user, including
   * balances, currency, and account status.
   * 
   * API Endpoint: GET /api/v3/brokerage/accounts
   * 
   * @returns Promise resolving to an array of Account objects
   * @throws Error if the API request fails
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
   * Get all available trading products (trading pairs).
   * 
   * This endpoint retrieves a list of all available trading pairs (e.g., BTC-USD, ETH-USD)
   * along with their status, base/quote currencies, and other metadata.
   * 
   * API Endpoint: GET /api/v3/brokerage/products
   * 
   * @returns Promise resolving to an array of Product objects
   * @throws Error if the API request fails
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
   * Retrieve available payment methods for the authenticated user
   * API Endpoint: GET /v2/payment-methods
   */
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    interface PaymentMethodResponse {
      payment_methods?: PaymentMethod[]
      data?: PaymentMethod[]
    }

    const response = await this.makeRequest<PaymentMethodResponse>({
      method: 'GET',
      path: '/api/v3/brokerage/payment_methods',
    })

    return response.payment_methods ?? response.data ?? []
  }

  /**
   * Initiate a fiat deposit into a Coinbase account.
   */
  async createFiatDeposit(accountId: string, payload: FiatTransferRequest): Promise<FiatTransferResponse> {
    return this.makeRequest<FiatTransferResponse>({
      method: 'POST',
      path: `/api/v3/brokerage/accounts/${accountId}/deposits`,
      body: JSON.stringify(payload),
    })
  }

  async commitFiatDeposit(accountId: string, depositId: string): Promise<FiatTransferResponse> {
    return this.makeRequest<FiatTransferResponse>({
      method: 'POST',
      path: `/api/v3/brokerage/accounts/${accountId}/deposits/${depositId}/commit`,
    })
  }

  /**
   * Initiate a fiat withdrawal from a Coinbase account.
   */
  async createFiatWithdrawal(accountId: string, payload: FiatTransferRequest): Promise<FiatTransferResponse> {
    return this.makeRequest<FiatTransferResponse>({
      method: 'POST',
      path: `/api/v3/brokerage/accounts/${accountId}/withdrawals`,
      body: JSON.stringify(payload),
    })
  }

  async commitFiatWithdrawal(accountId: string, withdrawalId: string): Promise<FiatTransferResponse> {
    return this.makeRequest<FiatTransferResponse>({
      method: 'POST',
      path: `/api/v3/brokerage/accounts/${accountId}/withdrawals/${withdrawalId}/commit`,
    })
  }

  /**
   * Place a new order.
   * 
   * This endpoint allows placing market or limit orders for a specific product.
   * 
   * API Endpoint: POST /api/v3/brokerage/orders
   * 
   * @param order - The order request object containing product_id, side, and order configuration
   * @returns Promise resolving to the order response (including order_id)
   * @throws Error if the order placement fails (e.g., insufficient funds)
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
   * Get details of a specific order by its ID.
   * 
   * API Endpoint: GET /api/v3/brokerage/orders/historical/{orderId}
   * 
   * @param orderId - The unique identifier of the order
   * @returns Promise resolving to the Order object
   * @throws Error if the order is not found or request fails
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
   * Cancel an existing order.
   * 
   * This endpoint cancels a specific order if it is still open.
   * 
   * API Endpoint: POST /api/v3/brokerage/orders/batch_cancel
   * 
   * @param orderId - The unique identifier of the order to cancel
   * @returns Promise resolving to void
   * @throws Error if the cancellation fails
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

  /**
   * Get historical candles for a product.
   * 
   * API Endpoint: GET /api/v3/brokerage/products/{product_id}/candles
   */
  async getCandles(
    productId: string,
    start: number,
    end: number,
    granularity: string
  ): Promise<Array<{ start: string; low: string; high: string; open: string; close: string; volume: string }>> {
    interface CandlesResponse {
      candles: {
        start: string
        low: string
        high: string
        open: string
        close: string
        volume: string
      }[]
    }

    const response = await this.makeRequest<CandlesResponse>({
      method: 'GET',
      path: `/api/v3/brokerage/products/${productId}/candles?start=${Math.floor(start/1000)}&end=${Math.floor(end/1000)}&granularity=${granularity}`,
    })

    return response.candles
  }
}
