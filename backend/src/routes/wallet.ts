import { Router, Response } from 'express'
import pool from '../database/config.js'
import { authMiddleware, AuthRequest } from '../middleware/auth.js'
import { decryptApiKey } from '../utils/encryption.js'
import logger from '../utils/logger.js'
import { CoinbaseAdvancedClient } from '@/services/CoinbaseAdvancedClient.js'

class WalletClientError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
    this.name = 'WalletClientError'
  }
}

async function getCoinbaseClientForUser(userId: string): Promise<CoinbaseAdvancedClient> {
  const result = await pool.query(
    `SELECT user_coinbase_public, user_coinbase_public_iv, user_coinbase_public_tag,
            user_coinbase_secret, user_coinbase_secret_iv, user_coinbase_secret_tag
     FROM spectra_user_t WHERE user_id = $1`,
    [userId]
  )

  if (result.rows.length === 0) {
    throw new WalletClientError('User not found', 404)
  }

  const user = result.rows[0]

  if (
    !user.user_coinbase_public ||
    !user.user_coinbase_secret ||
    !user.user_coinbase_public_iv ||
    !user.user_coinbase_secret_iv ||
    !user.user_coinbase_public_tag ||
    !user.user_coinbase_secret_tag
  ) {
    throw new WalletClientError('Coinbase API credentials not configured', 400)
  }

  const apiKey = decryptApiKey(
    user.user_coinbase_public,
    user.user_coinbase_public_iv,
    user.user_coinbase_public_tag
  )
  const apiSecret = decryptApiKey(
    user.user_coinbase_secret,
    user.user_coinbase_secret_iv,
    user.user_coinbase_secret_tag
  )

  return new CoinbaseAdvancedClient(apiKey, apiSecret)
}

function handleWalletError(res: Response, error: unknown, userId: string | undefined, fallbackMessage: string) {
  if (error instanceof WalletClientError) {
    logger.warn('Wallet client error', {
      userId,
      message: error.message,
    })
    res.status(error.status).json({ error: error.message })
    return
  }

  if (error instanceof Error) {
    if (error.message.includes('ENCRYPTION_KEY')) {
      res.status(500).json({ error: 'Server encryption configuration error' })
      return
    }

    if (error.message.includes('Coinbase API Error')) {
      res.status(502).json({ error: 'Failed to communicate with Coinbase', details: error.message })
      return
    }

    if (error.message.includes('Invalid API credentials')) {
      res.status(401).json({ error: 'Invalid Coinbase API credentials' })
      return
    }
  }

  logger.error(fallbackMessage, {
    error: error instanceof Error ? error.message : String(error),
    userId,
  })

  res.status(500).json({ error: fallbackMessage })
}

const router = Router()

// GET /api/wallet/accounts
router.get('/accounts', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'User ID not found' })
      return
    }
    const coinbaseClient = await getCoinbaseClientForUser(req.userId)
    const accounts = await coinbaseClient.getAccounts()

    res.json({ accounts })
  } catch (error) {
    handleWalletError(res, error, req.userId, 'Failed to retrieve wallet accounts')
  }
})

// GET /api/wallet/payment-methods
router.get('/payment-methods', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'User ID not found' })
      return
    }

    const coinbaseClient = await getCoinbaseClientForUser(req.userId)
    const paymentMethods = await coinbaseClient.getPaymentMethods()
    res.json({ paymentMethods })
  } catch (error) {
    handleWalletError(res, error, req.userId, 'Failed to retrieve payment methods')
  }
})

// POST /api/wallet/deposits
router.post('/deposits', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'User ID not found' })
      return
    }

    const { accountId, paymentMethodId, amount, currency, commit } = req.body || {}

    if (!accountId || !paymentMethodId || !amount) {
      res.status(400).json({ error: 'accountId, paymentMethodId, and amount are required' })
      return
    }

    const coinbaseClient = await getCoinbaseClientForUser(req.userId)
    const payload = {
      amount: typeof amount === 'number' ? amount.toString() : String(amount),
      currency: currency || 'USD',
      payment_method: paymentMethodId,
      commit: commit ?? true,
    }

    const response = await coinbaseClient.createFiatDeposit(accountId, payload)
    res.json(response)
  } catch (error) {
    handleWalletError(res, error, req.userId, 'Failed to initiate deposit')
  }
})

// POST /api/wallet/withdrawals
router.post('/withdrawals', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'User ID not found' })
      return
    }

    const { accountId, paymentMethodId, amount, currency, commit } = req.body || {}

    if (!accountId || !paymentMethodId || !amount) {
      res.status(400).json({ error: 'accountId, paymentMethodId, and amount are required' })
      return
    }

    const coinbaseClient = await getCoinbaseClientForUser(req.userId)
    const payload = {
      amount: typeof amount === 'number' ? amount.toString() : String(amount),
      currency: currency || 'USD',
      payment_method: paymentMethodId,
      commit: commit ?? true,
    }

    const response = await coinbaseClient.createFiatWithdrawal(accountId, payload)
    res.json(response)
  } catch (error) {
    handleWalletError(res, error, req.userId, 'Failed to initiate withdrawal')
  }
})

export default router
