import { Router, Response } from 'express'
import { authMiddleware, AuthRequest } from '../middleware/auth.js'
import pool from '../database/config.js'
import logger from '../utils/logger.js'
import { toNumber } from '../utils/number.js'

const router = Router()
const DAY_MS = 24 * 60 * 60 * 1000
const HISTORY_DAYS = 30

interface PortfolioSummaryRow {
  portfolio_id: string
  total_value: string
  cash_balance: string
  change_24h: string
  change_24h_percent: string
  updated_at: string
}

interface HistoryRow {
  day: string
  net_flow: string
}

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'User ID missing from session' })
      return
    }

    const portfolioResult = await pool.query<PortfolioSummaryRow>(
      `SELECT portfolio_id, total_value, cash_balance, change_24h, change_24h_percent, updated_at
       FROM spectra_user_portfolio_t
       WHERE user_id = $1
       ORDER BY updated_at DESC
       LIMIT 1`,
      [req.userId]
    )

    const summaryRow = portfolioResult.rows[0]

    const holdingsResult = summaryRow
      ? await pool.query(
          `SELECT holding_id, symbol, quantity, average_buy_price, current_price, current_value,
                  unrealized_pnl, unrealized_pnl_percent, updated_at
           FROM spectra_user_holdings_t
           WHERE portfolio_id = $1
           ORDER BY current_value DESC NULLS LAST`,
          [summaryRow.portfolio_id]
        )
      : { rows: [] }

    const portfolio = {
      portfolioId: summaryRow?.portfolio_id ?? null,
      totalValue: toNumber(summaryRow?.total_value),
      cashBalance: toNumber(summaryRow?.cash_balance),
      change24h: toNumber(summaryRow?.change_24h),
      change24hPercent: toNumber(summaryRow?.change_24h_percent),
      updatedAt: summaryRow?.updated_at ?? null,
    }

    const holdings = holdingsResult.rows.map((row) => ({
      holdingId: row.holding_id,
      symbol: row.symbol,
      quantity: toNumber(row.quantity),
      averageBuyPrice: toNumber(row.average_buy_price),
      currentPrice: toNumber(row.current_price),
      currentValue: toNumber(row.current_value),
      unrealizedPnL: toNumber(row.unrealized_pnl),
      unrealizedPnLPercent: toNumber(row.unrealized_pnl_percent),
      updatedAt: row.updated_at,
    }))

    res.json({ portfolio, holdings })
  } catch (error) {
    logger.error('Failed to fetch portfolio', {
      userId: req.userId,
      error: error instanceof Error ? error.message : String(error),
    })
    res.status(500).json({ error: 'Failed to fetch portfolio data' })
  }
})

router.get('/history', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'User ID missing from session' })
      return
    }

    const summaryResult = await pool.query<PortfolioSummaryRow>(
      `SELECT portfolio_id, total_value, cash_balance, change_24h, change_24h_percent, updated_at
       FROM spectra_user_portfolio_t
       WHERE user_id = $1
       ORDER BY updated_at DESC
       LIMIT 1`,
      [req.userId]
    )

    const summaryRow = summaryResult.rows[0]
    const currentValue = toNumber(summaryRow?.total_value)

    const historyResult = await pool.query<HistoryRow>(
      `SELECT date_trunc('day', executed_at) AS day,
              SUM(CASE WHEN side = 'buy' THEN total_value ELSE -total_value END) AS net_flow
       FROM spectra_user_trades_t
       WHERE user_id = $1
         AND executed_at >= NOW() - INTERVAL '${HISTORY_DAYS} days'
       GROUP BY day
       ORDER BY day ASC`,
      [req.userId]
    )

    const flowsMap = new Map<number, number>()
    for (const row of historyResult.rows) {
      const dayTimestamp = new Date(row.day).setHours(0, 0, 0, 0)
      flowsMap.set(dayTimestamp, toNumber(row.net_flow))
    }

    const totalFlows = Array.from(flowsMap.values()).reduce((sum, val) => sum + val, 0)
    let runningValue = Math.max(0, currentValue - totalFlows)

    const now = new Date()
    const start = new Date(now.getTime() - (HISTORY_DAYS - 1) * DAY_MS)

    const history: Array<{ timestamp: number; value: number; netFlow: number }> = []

    for (let i = 0; i < HISTORY_DAYS; i++) {
      const day = new Date(start.getTime() + i * DAY_MS)
      const key = day.setHours(0, 0, 0, 0)
      const netFlow = flowsMap.get(key) ?? 0
      runningValue = Math.max(0, runningValue + netFlow)
      history.push({
        timestamp: key,
        value: Number(runningValue.toFixed(2)),
        netFlow: Number(netFlow.toFixed(2)),
      })
    }

    res.json({
      history,
      rangeDays: HISTORY_DAYS,
      latestValue: Number(currentValue.toFixed(2)),
    })
  } catch (error) {
    logger.error('Failed to fetch portfolio history', {
      userId: req.userId,
      error: error instanceof Error ? error.message : String(error),
    })
    res.status(500).json({ error: 'Failed to fetch portfolio history' })
  }
})

export default router
