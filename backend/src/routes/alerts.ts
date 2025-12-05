import { Router, Response } from 'express'
import { authMiddleware, AuthRequest } from '../middleware/auth.js'
import pool from '../database/config.js'
import logger from '../utils/logger.js'
import { alertService } from '../services/AlertService.js'

const router = Router()

const ALERT_TYPES = new Set(['price', 'rsi', 'volume', 'sma_crossover', 'volatility'])
const ALERT_STATUS = new Set(['active', 'triggered', 'snoozed', 'dismissed'])
const SUPPORTED_PRODUCTS = [
  'BTC-USD', 'ETH-USD', 'SOL-USD', 'ADA-USD', 'DOGE-USD', 'XRP-USD', 'DOT-USD', 'AVAX-USD',
  'POL-USD', 'LINK-USD', 'UNI-USD', 'ATOM-USD', 'LTC-USD', 'BCH-USD', 'ALGO-USD', 'XLM-USD',
  'AAVE-USD', 'NEAR-USD', 'APT-USD', 'ARB-USD'
]

function parseCondition(raw: unknown): Record<string, unknown> {
  if (!raw) {
    return {}
  }

  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw)
    } catch {
      return {}
    }
  }

  return raw as Record<string, unknown>
}

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'User ID missing from session' })
      return
    }

    const result = await pool.query(
      `SELECT alert_id, symbol, alert_type, condition, status, created_at, triggered_at
       FROM spectra_user_alerts_t
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.userId]
    )

    const alerts = result.rows.map((row) => ({
      alertId: row.alert_id,
      symbol: row.symbol,
      alertType: row.alert_type,
      condition: parseCondition(row.condition),
      status: row.status,
      createdAt: row.created_at,
      triggeredAt: row.triggered_at,
    }))

    res.json({ alerts })
  } catch (error) {
    logger.error('Failed to fetch alerts', {
      userId: req.userId,
      error: error instanceof Error ? error.message : String(error),
    })
    res.status(500).json({ error: 'Failed to fetch alerts' })
  }
})

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'User ID missing from session' })
      return
    }

    const { symbol, alertType, condition } = req.body as {
      symbol?: string
      alertType?: string
      condition?: Record<string, unknown>
    }

    const normalizedSymbol = symbol?.toUpperCase().trim()
    if (!normalizedSymbol || !/^[A-Z]{2,10}-[A-Z]{2,10}$/.test(normalizedSymbol)) {
      res.status(400).json({ error: 'Valid symbol is required (e.g. BTC-USD)' })
      return
    }

    if (!SUPPORTED_PRODUCTS.includes(normalizedSymbol)) {
      res.status(400).json({
        error: 'Unsupported symbol',
        supported: SUPPORTED_PRODUCTS,
      })
      return
    }

    if (!alertType || !ALERT_TYPES.has(alertType)) {
      res.status(400).json({ error: 'Invalid alert type' })
      return
    }

    if (!condition || typeof condition !== 'object' || Object.keys(condition).length === 0) {
      res.status(400).json({ error: 'Condition payload is required' })
      return
    }

    const insertResult = await pool.query(
      `INSERT INTO spectra_user_alerts_t (user_id, symbol, alert_type, condition)
       VALUES ($1, $2, $3, $4)
       RETURNING alert_id, symbol, alert_type, condition, status, created_at, triggered_at`,
      [req.userId, normalizedSymbol, alertType, JSON.stringify(condition)]
    )

    const alert = insertResult.rows[0]

    alertService.refreshAlerts()

    res.status(201).json({
      alert: {
        alertId: alert.alert_id,
        symbol: alert.symbol,
        alertType: alert.alert_type,
        condition: parseCondition(alert.condition),
        status: alert.status,
        createdAt: alert.created_at,
        triggeredAt: alert.triggered_at,
      },
    })
  } catch (error) {
    logger.error('Failed to create alert', {
      userId: req.userId,
      error: error instanceof Error ? error.message : String(error),
    })
    res.status(500).json({ error: 'Failed to create alert' })
  }
})

router.patch('/:alertId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'User ID missing from session' })
      return
    }

    const { alertId } = req.params
    const { status, condition } = req.body as {
      status?: string
      condition?: Record<string, unknown>
    }

    if (!status && !condition) {
      res.status(400).json({ error: 'Nothing to update' })
      return
    }

    if (status && !ALERT_STATUS.has(status)) {
      res.status(400).json({ error: 'Invalid alert status' })
      return
    }

    const updates: string[] = []
    const values: unknown[] = []
    let index = 1

    if (status) {
      updates.push(`status = $${index++}`)
      values.push(status)
      if (status === 'triggered') {
        updates.push(`triggered_at = CURRENT_TIMESTAMP`)
      } else if (status === 'active') {
        updates.push(`triggered_at = NULL`)
      }
    }

    if (condition && typeof condition === 'object') {
      updates.push(`condition = $${index++}`)
      values.push(JSON.stringify(condition))
    }

    values.push(req.userId, alertId)

    const query = `
      UPDATE spectra_user_alerts_t
      SET ${updates.join(', ')}
      WHERE user_id = $${index++} AND alert_id = $${index}
      RETURNING alert_id, symbol, alert_type, condition, status, created_at, triggered_at`

    const updateResult = await pool.query(query, values)

    if (updateResult.rows.length === 0) {
      res.status(404).json({ error: 'Alert not found' })
      return
    }

    const alert = updateResult.rows[0]
    alertService.refreshAlerts()

    res.json({
      alert: {
        alertId: alert.alert_id,
        symbol: alert.symbol,
        alertType: alert.alert_type,
        condition: parseCondition(alert.condition),
        status: alert.status,
        createdAt: alert.created_at,
        triggeredAt: alert.triggered_at,
      },
    })
  } catch (error) {
    logger.error('Failed to update alert', {
      userId: req.userId,
      alertId: req.params.alertId,
      error: error instanceof Error ? error.message : String(error),
    })
    res.status(500).json({ error: 'Failed to update alert' })
  }
})

router.delete('/:alertId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'User ID missing from session' })
      return
    }

    const result = await pool.query(
      `DELETE FROM spectra_user_alerts_t
       WHERE user_id = $1 AND alert_id = $2
       RETURNING alert_id`,
      [req.userId, req.params.alertId]
    )

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Alert not found' })
      return
    }

    alertService.refreshAlerts()

    res.json({ message: 'Alert deleted' })
  } catch (error) {
    logger.error('Failed to delete alert', {
      userId: req.userId,
      alertId: req.params.alertId,
      error: error instanceof Error ? error.message : String(error),
    })
    res.status(500).json({ error: 'Failed to delete alert' })
  }
})

export default router
