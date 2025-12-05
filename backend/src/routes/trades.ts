import { Router, Response } from 'express'
import { authMiddleware, AuthRequest } from '../middleware/auth.js'
import pool from '../database/config.js'
import logger from '../utils/logger.js'
import { toNumber } from '../utils/number.js'

const router = Router()

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'User ID missing from session' })
      return
    }

    const { type, symbol, startDate, endDate } = req.query as {
      type?: string
      symbol?: string
      startDate?: string
      endDate?: string
    }

    const clauses: string[] = ['user_id = $1']
    const values: unknown[] = [req.userId]
    let index = 2

    if (type && ['buy', 'sell'].includes(type.toLowerCase())) {
      clauses.push(`side = $${index++}`)
      values.push(type.toLowerCase())
    }

    if (symbol && /^[A-Z]{2,10}$/.test(symbol.toUpperCase())) {
      clauses.push(`symbol = $${index++}`)
      values.push(symbol.toUpperCase())
    }

    if (startDate && !Number.isNaN(Date.parse(startDate))) {
      clauses.push(`executed_at >= $${index++}`)
      values.push(new Date(startDate))
    }

    if (endDate && !Number.isNaN(Date.parse(endDate))) {
      clauses.push(`executed_at <= $${index++}`)
      values.push(new Date(endDate))
    }

    const query = `
      SELECT trade_id, order_id, symbol, side, amount, price,
             coinbase_fees, spectra_fees, total_value, executed_at
      FROM spectra_user_trades_t
      WHERE ${clauses.join(' AND ')}
      ORDER BY executed_at DESC
      LIMIT 500`

    const result = await pool.query(query, values)

    const trades = result.rows.map((row) => ({
      tradeId: row.trade_id,
      orderId: row.order_id,
      symbol: row.symbol,
      side: row.side,
      amount: toNumber(row.amount),
      price: toNumber(row.price),
      fees: toNumber(row.coinbase_fees) + toNumber(row.spectra_fees),
      totalValue: toNumber(row.total_value),
      executedAt: row.executed_at ? new Date(row.executed_at).getTime() : null,
      status: 'filled',
    }))

    res.json({ trades })
  } catch (error) {
    logger.error('Failed to fetch trades', {
      userId: req.userId,
      error: error instanceof Error ? error.message : String(error),
    })
    res.status(500).json({ error: 'Failed to fetch trades' })
  }
})

export default router
