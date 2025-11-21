import { Router, Response } from 'express'
import pool from '../database/config.js'
import { authMiddleware, AuthRequest } from '../middleware/auth.js'
import { decryptApiKey } from '../utils/encryption.js'
import { CoinbaseClient } from '../services/CoinbaseClient.js'
import logger from '../utils/logger.js'

const router = Router()

// GET /api/wallet/accounts
router.get('/accounts', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'User ID not found' })
      return
    }

    // Retrieve user's encrypted Coinbase API credentials from database
    const result = await pool.query(
      `SELECT user_coinbase_public, user_coinbase_public_iv, user_coinbase_public_tag,
              user_coinbase_secret, user_coinbase_secret_iv, user_coinbase_secret_tag
       FROM spectra_user_t WHERE user_id = $1`,
      [req.userId]
    )

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    const user = result.rows[0]

    // Check if user has configured Coinbase API keys
    if (
      !user.user_coinbase_public ||
      !user.user_coinbase_secret ||
      !user.user_coinbase_public_iv ||
      !user.user_coinbase_secret_iv ||
      !user.user_coinbase_public_tag ||
      !user.user_coinbase_secret_tag
    ) {
      res.status(400).json({ error: 'Coinbase API credentials not configured' })
      return
    }

    // Decrypt credentials
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

    // Initialize CoinbaseClient with user's credentials
    const coinbaseClient = new CoinbaseClient(apiKey, apiSecret)

    // Fetch account balances from Coinbase
    const accounts = await coinbaseClient.getAccounts()

    res.json({
      accounts,
    })
  } catch (error) {
    logger.error('Get wallet accounts error', {
      error: error instanceof Error ? error.message : String(error),
      userId: req.userId,
    })

    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('ENCRYPTION_KEY')) {
        res.status(500).json({ error: 'Server encryption configuration error' })
        return
      }

      if (error.message.includes('Coinbase API Error')) {
        res.status(502).json({ error: 'Failed to fetch accounts from Coinbase', details: error.message })
        return
      }

      if (error.message.includes('Invalid API credentials')) {
        res.status(401).json({ error: 'Invalid Coinbase API credentials' })
        return
      }
    }

    res.status(500).json({ error: 'Failed to retrieve wallet accounts' })
  }
})

export default router
