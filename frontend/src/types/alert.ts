// Alert type definitions

export type AlertType = 'price' | 'rsi' | 'volume' | 'sma_crossover' | 'volatility'

export type AlertStatus = 'active' | 'triggered' | 'snoozed' | 'dismissed'

export interface AlertCondition {
  // For price alerts
  priceAbove?: number
  priceBelow?: number

  // For RSI alerts
  rsiAbove?: number
  rsiBelow?: number

  // For volume alerts
  volumeChangePercent?: number

  // For SMA alerts
  smaCrossover?: 'golden' | 'death'

  // For volatility alerts
  volatilityThreshold?: number
}

export interface Alert {
  alertId: string
  userId: string
  symbol: string
  type: AlertType
  condition: AlertCondition
  status: AlertStatus
  createdAt: number
  triggeredAt?: number
}
