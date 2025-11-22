import { Router, Response } from 'express'
import pool from '../database/config.js'
import { authMiddleware, AuthRequest } from '../middleware/auth.js'
import { encryptApiKey } from '../utils/encryption.js'
import logger from '../utils/logger.js'

const router = Router()

// GET /api/users/profile
router.get('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'User ID not found' })
      return
    }

    const result = await pool.query(
      `SELECT user_id, full_name, username, email_address, created_at, last_login, 
              (user_coinbase_public IS NOT NULL AND user_coinbase_secret IS NOT NULL) as has_coinbase_keys
       FROM spectra_user_t WHERE user_id = $1`,
      [req.userId]
    )

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    const user = result.rows[0]

    res.json({
      userId: user.user_id,
      fullName: user.full_name,
      username: user.username,
      emailAddress: user.email_address,
      hasCoinbaseKeys: user.has_coinbase_keys,
      createdAt: user.created_at,
      lastLogin: user.last_login,
    })
  } catch (error) {
    logger.error('Get profile error', { error: error instanceof Error ? error.message : String(error) })
    res.status(500).json({ error: 'Failed to retrieve profile' })
  }
})

// PATCH /api/users/profile
router.patch('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'User ID not found' })
      return
    }

    const { fullName, username } = req.body

    if (!fullName && !username) {
      res.status(400).json({ error: 'At least one field (fullName or username) is required' })
      return
    }

    // Check if username is already taken (if updating username)
    if (username) {
      const existingUser = await pool.query('SELECT user_id FROM spectra_user_t WHERE username = $1 AND user_id != $2', [
        username,
        req.userId,
      ])

      if (existingUser.rows.length > 0) {
        res.status(409).json({ error: 'Username already taken' })
        return
      }
    }

    // Build update query dynamically
    const updates: string[] = []
    const values: unknown[] = []
    let paramCount = 1

    if (fullName) {
      updates.push(`full_name = $${paramCount}`)
      values.push(fullName)
      paramCount++
    }

    if (username) {
      updates.push(`username = $${paramCount}`)
      values.push(username)
      paramCount++
    }

    values.push(req.userId)

    const query = `UPDATE spectra_user_t SET ${updates.join(', ')} WHERE user_id = $${paramCount} RETURNING user_id, full_name, username, email_address`

    const result = await pool.query(query, values)

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    const user = result.rows[0]

    res.json({
      message: 'Profile updated successfully',
      user: {
        userId: user.user_id,
        fullName: user.full_name,
        username: user.username,
        emailAddress: user.email_address,
      },
    })
  } catch (error) {
    logger.error('Update profile error', { error: error instanceof Error ? error.message : String(error) })
    res.status(500).json({ error: 'Failed to update profile' })
  }
})

// PATCH /api/users/coinbase-keys
router.patch('/coinbase-keys', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'User ID not found' })
      return
    }

    const { apiKey, apiSecret } = req.body

    if (!apiKey || !apiSecret) {
      res.status(400).json({ error: 'API key and secret are required' })
      return
    }

    // Encrypt credentials
    const encryptedKey = encryptApiKey(apiKey)
    const encryptedSecret = encryptApiKey(apiSecret)

    // Update user with encrypted credentials
    const result = await pool.query(
      `UPDATE spectra_user_t 
       SET user_coinbase_public = $1, user_coinbase_public_iv = $2, user_coinbase_public_tag = $3,
           user_coinbase_secret = $4, user_coinbase_secret_iv = $5, user_coinbase_secret_tag = $6
       WHERE user_id = $7
       RETURNING user_id, full_name, username, email_address`,
      [
        encryptedKey.encrypted,
        encryptedKey.iv,
        encryptedKey.authTag,
        encryptedSecret.encrypted,
        encryptedSecret.iv,
        encryptedSecret.authTag,
        req.userId,
      ]
    )

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    const user = result.rows[0]

    res.json({
      message: 'Coinbase API credentials updated successfully',
      user: {
        userId: user.user_id,
        fullName: user.full_name,
        username: user.username,
        emailAddress: user.email_address,
        hasCoinbaseKeys: true,
      },
    })
  } catch (error) {
    logger.error('Update Coinbase keys error', { error: error instanceof Error ? error.message : String(error) })

    if (error instanceof Error && error.message.includes('ENCRYPTION_KEY')) {
      res.status(500).json({ error: 'Server encryption configuration error' })
    } else {
      res.status(500).json({ error: 'Failed to update Coinbase credentials' })
    }
  }
})

// DELETE /api/users/coinbase-keys
router.delete('/coinbase-keys', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'User ID not found' })
      return
    }

    // Clear Coinbase credentials
    const result = await pool.query(
      `UPDATE spectra_user_t 
       SET user_coinbase_public = NULL, user_coinbase_public_iv = NULL, user_coinbase_public_tag = NULL,
           user_coinbase_secret = NULL, user_coinbase_secret_iv = NULL, user_coinbase_secret_tag = NULL
       WHERE user_id = $1
       RETURNING user_id`,
      [req.userId]
    )

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    res.json({
      message: 'Coinbase API credentials removed successfully',
      hasCoinbaseKeys: false,
    })
  } catch (error) {
    logger.error('Delete Coinbase keys error', { error: error instanceof Error ? error.message : String(error) })
    res.status(500).json({ error: 'Failed to remove Coinbase credentials' })
  }
})

export default router
