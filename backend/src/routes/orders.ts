import { Router, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import pool from '../database/config.js'
import { authMiddleware, AuthRequest } from '../middleware/auth.js'
import logger from '../utils/logger.js'
import type { CoinbaseAdvancedClient } from '@/services/CoinbaseAdvancedClient.js'
import { getUserCoinbaseClient } from '@/services/CoinbaseCredentialManager.js'
import type { OrderRequest } from '../types/coinbase.js'

const router = Router()

// Minimum order value in USD
const MIN_ORDER_USD = 10

// Fee rate (0.5%)
const FEE_RATE = 0.005

/**
 * Validation error interface
 */
interface ValidationError {
  field: string
  message: string
}

/**
 * Order request body interface
 */
interface PlaceOrderBody {
  symbol: string // e.g., 'BTC-USD'
  side: 'buy' | 'sell'
  type: 'market' | 'limit'
  amount: number // Amount in base currency (e.g., BTC)
  limitPrice?: number // Required for limit orders
}

/**
 * Validate order request
 */
function validateOrder(body: PlaceOrderBody): ValidationError[] {
  const errors: ValidationError[] = []

  // Check required fields
  if (!body.symbol) {
    errors.push({ field: 'symbol', message: 'Symbol is required' })
  } else if (!/^[A-Z]+-USD$/.test(body.symbol)) {
    errors.push({ field: 'symbol', message: 'Invalid symbol format (expected XXX-USD)' })
  }

  if (!body.side || !['buy', 'sell'].includes(body.side)) {
    errors.push({ field: 'side', message: 'Side must be "buy" or "sell"' })
  }

  if (!body.type || !['market', 'limit'].includes(body.type)) {
    errors.push({ field: 'type', message: 'Type must be "market" or "limit"' })
  }

  if (!body.amount || body.amount <= 0) {
    errors.push({ field: 'amount', message: 'Amount must be greater than 0' })
  }

  if (body.type === 'limit' && (!body.limitPrice || body.limitPrice <= 0)) {
    errors.push({ field: 'limitPrice', message: 'Limit price is required and must be greater than 0' })
  }

  return errors
}

/**
 * Get user's USD balance from Coinbase
 */
async function getUserUsdBalance(client: CoinbaseAdvancedClient): Promise<number> {
  const accounts = await client.getAccounts()
  const usdAccount = accounts.find((a) => a.currency === 'USD')
  return usdAccount ? parseFloat(usdAccount.available_balance.value) : 0
}

/**
 * POST /api/orders
 * Place a new order
 */
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'User ID not found' })
      return
    }

    const body = req.body as PlaceOrderBody

    // Validate order
    const validationErrors = validateOrder(body)
    if (validationErrors.length > 0) {
      res.status(400).json({ error: 'Validation failed', errors: validationErrors })
      return
    }

    // Get Coinbase client
    const coinbaseClient = await getUserCoinbaseClient(req.userId)
    if (!coinbaseClient) {
      res.status(400).json({ error: 'Coinbase API credentials not configured' })
      return
    }

    // For buy orders, verify sufficient balance
    if (body.side === 'buy') {
      const usdBalance = await getUserUsdBalance(coinbaseClient)
      const price = body.type === 'limit' ? body.limitPrice! : await getMarketPrice(coinbaseClient, body.symbol)
      const subtotal = body.amount * price
      const totalCost = subtotal + subtotal * FEE_RATE

      if (totalCost < MIN_ORDER_USD) {
        res.status(400).json({ error: `Minimum order is $${MIN_ORDER_USD}` })
        return
      }

      if (totalCost > usdBalance) {
        res.status(400).json({
          error: 'Insufficient balance',
          required: totalCost,
          available: usdBalance,
        })
        return
      }
    }

    // Build Coinbase order request
    const clientOrderId = uuidv4()
    const orderRequest: OrderRequest = {
      client_order_id: clientOrderId,
      product_id: body.symbol,
      side: body.side.toUpperCase() as 'BUY' | 'SELL',
      order_configuration:
        body.type === 'market'
          ? {
              market_market_ioc: {
                base_size: body.amount.toString(),
              },
            }
          : {
              limit_limit_gtc: {
                base_size: body.amount.toString(),
                limit_price: body.limitPrice!.toString(),
                post_only: false,
              },
            },
    }

    // Submit order to Coinbase
    const orderResponse = await coinbaseClient.placeOrder(orderRequest)

    if (!orderResponse.success) {
      logger.error('Order placement failed', {
        userId: req.userId,
        body,
        reason: orderResponse.failure_reason,
        errorResponse: orderResponse.error_response,
      })

      res.status(400).json({
        error: 'Order placement failed',
        reason: orderResponse.failure_reason || orderResponse.error_response?.message,
      })
      return
    }

    const orderId = orderResponse.success_response?.order_id || orderResponse.order_id

    // Store trade record in database
    await pool.query(
      `INSERT INTO spectra_trade_t (
        user_id, order_id, symbol, side, amount, price, fees, total_value, is_paper_trade, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
      [
        req.userId,
        orderId,
        body.symbol,
        body.side.toUpperCase(),
        body.amount,
        body.type === 'limit' ? body.limitPrice : null,
        null, // Fees will be updated when order fills
        null, // Total value will be updated when order fills
        false, // Not paper trade
      ]
    )

    logger.info('Order placed successfully', {
      userId: req.userId,
      orderId,
      symbol: body.symbol,
      side: body.side,
      type: body.type,
      amount: body.amount,
    })

    res.status(201).json({
      success: true,
      orderId,
      clientOrderId,
      symbol: body.symbol,
      side: body.side,
      type: body.type,
      amount: body.amount,
      limitPrice: body.limitPrice,
      status: 'pending',
    })
  } catch (error) {
    logger.error('Place order error', {
      error: error instanceof Error ? error.message : String(error),
      userId: req.userId,
    })

    if (error instanceof Error) {
      if (error.message.includes('ENCRYPTION_KEY')) {
        res.status(500).json({ error: 'Server encryption configuration error' })
        return
      }

      if (error.message.includes('Coinbase API Error')) {
        res.status(502).json({ error: 'Coinbase API error', details: error.message })
        return
      }

      if (error.message.includes('Invalid API credentials')) {
        res.status(401).json({ error: 'Invalid Coinbase API credentials' })
        return
      }
    }

    res.status(500).json({ error: 'Failed to place order' })
  }
})

/**
 * GET /api/orders/:orderId
 * Get order status
 */
router.get('/:orderId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'User ID not found' })
      return
    }

    const { orderId } = req.params

    // Get Coinbase client
    const coinbaseClient = await getUserCoinbaseClient(req.userId)
    if (!coinbaseClient) {
      res.status(400).json({ error: 'Coinbase API credentials not configured' })
      return
    }

    // Fetch order from Coinbase
    const order = await coinbaseClient.getOrder(orderId)

    // Update trade record if order is filled
    if (order.status === 'FILLED') {
      await pool.query(
        `UPDATE spectra_trade_t SET
          price = $1,
          fees = $2,
          total_value = $3,
          executed_at = $4
         WHERE order_id = $5 AND user_id = $6`,
        [
          parseFloat(order.average_filled_price),
          parseFloat(order.total_fees),
          parseFloat(order.filled_value),
          order.created_time,
          orderId,
          req.userId,
        ]
      )
    }

    res.json({
      orderId: order.order_id,
      status: order.status.toLowerCase(),
      symbol: order.product_id,
      side: order.side.toLowerCase(),
      filledAmount: parseFloat(order.filled_size),
      averagePrice: parseFloat(order.average_filled_price),
      fees: parseFloat(order.total_fees),
      totalValue: parseFloat(order.filled_value),
      completionPercentage: parseFloat(order.completion_percentage),
      createdAt: order.created_time,
    })
  } catch (error) {
    logger.error('Get order error', {
      error: error instanceof Error ? error.message : String(error),
      userId: req.userId,
      orderId: req.params.orderId,
    })

    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({ error: 'Order not found' })
      return
    }

    res.status(500).json({ error: 'Failed to get order status' })
  }
})

/**
 * DELETE /api/orders/:orderId
 * Cancel an order
 */
router.delete('/:orderId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'User ID not found' })
      return
    }

    const { orderId } = req.params

    // Get Coinbase client
    const coinbaseClient = await getUserCoinbaseClient(req.userId)
    if (!coinbaseClient) {
      res.status(400).json({ error: 'Coinbase API credentials not configured' })
      return
    }

    // Cancel order on Coinbase
    await coinbaseClient.cancelOrder(orderId)

    // Update trade record
    await pool.query(
      `DELETE FROM spectra_trade_t WHERE order_id = $1 AND user_id = $2`,
      [orderId, req.userId]
    )

    logger.info('Order cancelled', {
      userId: req.userId,
      orderId,
    })

    res.json({ success: true, orderId, status: 'cancelled' })
  } catch (error) {
    logger.error('Cancel order error', {
      error: error instanceof Error ? error.message : String(error),
      userId: req.userId,
      orderId: req.params.orderId,
    })

    if (error instanceof Error && error.message.includes('Failed to cancel')) {
      res.status(400).json({ error: error.message })
      return
    }

    res.status(500).json({ error: 'Failed to cancel order' })
  }
})

/**
 * Get market price for a product (helper function)
 */
async function getMarketPrice(client: CoinbaseAdvancedClient, productId: string): Promise<number> {
  const products = await client.getProducts()
  const product = products.find((p) => p.product_id === productId)
  if (!product) {
    throw new Error(`Product ${productId} not found`)
  }
  return parseFloat(product.price)
}

export default router
