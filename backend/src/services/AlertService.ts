import pool from '../database/config.js'
import logger from '../utils/logger.js'

interface Alert {
  alert_id: string
  user_id: string
  symbol: string
  alert_type: string
  condition: any
  status: string
  triggered_at?: number
}

export class AlertService {
  private activeAlerts: Map<string, Alert[]> = new Map() // symbol -> alerts

  constructor() {
    this.loadActiveAlerts()
    // Reload alerts periodically to sync with DB changes
    setInterval(() => this.loadActiveAlerts(), 30000) 
  }

  async loadActiveAlerts() {
    try {
      const result = await pool.query(
        `SELECT * FROM spectra_user_alerts_t WHERE status = 'active'`
      )
      
      const newAlerts = new Map<string, Alert[]>()
      for (const row of result.rows) {
        const alerts = newAlerts.get(row.symbol) || []
        alerts.push(row)
        newAlerts.set(row.symbol, alerts)
      }
      this.activeAlerts = newAlerts
    } catch (error) {
      logger.error('Failed to load active alerts', { error })
    }
  }

  async checkAlerts(symbol: string, price: number): Promise<Alert[]> {
    const alerts = this.activeAlerts.get(symbol)
    if (!alerts || alerts.length === 0) return []

    const triggered: Alert[] = []

    for (const alert of alerts) {
      if (alert.alert_type === 'price') {
        const hit = await this.checkPriceAlert(alert, price)
        if (hit) {
          triggered.push(hit)
        }
      }
    }

    return triggered
  }

  private async checkPriceAlert(alert: Alert, price: number): Promise<Alert | null> {
    const { condition } = alert
    let triggered = false

    // Handle legacy format (priceAbove/priceBelow) and new format (target/direction)
    let priceAbove = condition.priceAbove ? Number(condition.priceAbove) : null
    let priceBelow = condition.priceBelow ? Number(condition.priceBelow) : null

    if (condition.target && condition.direction) {
      const target = Number(condition.target)
      if (condition.direction === 'above') {
        priceAbove = target
      } else if (condition.direction === 'below') {
        priceBelow = target
      }
    }

    // Log for debugging
    logger.debug(`Checking alert ${alert.alert_id} for ${alert.symbol}: Price ${price}, Above ${priceAbove}, Below ${priceBelow}`)

    if (priceAbove !== null && price > priceAbove) {
      triggered = true
    } else if (priceBelow !== null && price < priceBelow) {
      triggered = true
    }

    if (triggered) {
      return await this.triggerAlert(alert, price)
    }

    return null
  }

  private async triggerAlert(alert: Alert, price: number): Promise<Alert> {
    try {
      await pool.query(
        `UPDATE spectra_user_alerts_t 
         SET status = 'triggered', triggered_at = NOW() 
         WHERE alert_id = $1`,
        [alert.alert_id]
      )
      logger.info(`Alert triggered: ${alert.alert_id} for ${alert.symbol} at ${price}`)
      
      // Remove from memory immediately
      const alerts = this.activeAlerts.get(alert.symbol)
      if (alerts) {
        this.activeAlerts.set(alert.symbol, alerts.filter(a => a.alert_id !== alert.alert_id))
      }

      return {
        ...alert,
        status: 'triggered',
        condition: alert.condition,
        alert_id: alert.alert_id,
        triggered_at: Date.now(),
      } as Alert
    } catch (error) {
      logger.error('Failed to trigger alert', { alertId: alert.alert_id, error })
      return alert
    }
  }
  
  // Method to manually refresh alerts (e.g. called when a new alert is created)
  public refreshAlerts() {
    this.loadActiveAlerts()
  }
}

export const alertService = new AlertService()
