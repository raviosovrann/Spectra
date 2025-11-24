import { create } from 'zustand'
import { Alert } from '../types/alert'

interface AlertsState {
  alerts: Alert[]
  
  // Actions
  setAlerts: (alerts: Alert[]) => void
  addAlert: (alert: Alert) => void
  deleteAlert: (alertId: string) => void
  snoozeAlert: (alertId: string, duration?: number) => void
  triggerAlert: (alertId: string) => void
  dismissAlert: (alertId: string) => void
  
  // Selectors
  getAlerts: () => Alert[]
  getActiveAlerts: () => Alert[]
  getTriggeredAlerts: () => Alert[]
  getSnoozedAlerts: () => Alert[]
  getAlertsBySymbol: (symbol: string) => Alert[]
  getAlertById: (alertId: string) => Alert | undefined
}

export const useAlertsStore = create<AlertsState>((set, get) => ({
  alerts: [],

  setAlerts: (alerts: Alert[]) => {
    set({ alerts })
  },

  addAlert: (alert: Alert) => {
    set((state) => ({
      alerts: [...state.alerts, alert],
    }))
  },

  deleteAlert: (alertId: string) => {
    set((state) => ({
      alerts: state.alerts.filter((alert) => alert.alertId !== alertId),
    }))
  },

  snoozeAlert: (alertId: string, duration: number = 3600000) => {
    // Default snooze duration: 1 hour (3600000ms)
    set((state) => ({
      alerts: state.alerts.map((alert) =>
        alert.alertId === alertId
          ? { ...alert, status: 'snoozed' as const }
          : alert
      ),
    }))
    
    // Auto-reactivate after snooze duration
    setTimeout(() => {
      set((state) => ({
        alerts: state.alerts.map((alert) =>
          alert.alertId === alertId && alert.status === 'snoozed'
            ? { ...alert, status: 'active' as const }
            : alert
        ),
      }))
    }, duration)
  },

  triggerAlert: (alertId: string) => {
    set((state) => ({
      alerts: state.alerts.map((alert) =>
        alert.alertId === alertId
          ? {
              ...alert,
              status: 'triggered' as const,
              triggeredAt: Date.now(),
            }
          : alert
      ),
    }))
  },

  dismissAlert: (alertId: string) => {
    set((state) => ({
      alerts: state.alerts.map((alert) =>
        alert.alertId === alertId
          ? { ...alert, status: 'dismissed' as const }
          : alert
      ),
    }))
  },

  getAlerts: () => {
    return get().alerts
  },

  getActiveAlerts: () => {
    return get().alerts.filter((alert) => alert.status === 'active')
  },

  getTriggeredAlerts: () => {
    return get().alerts.filter((alert) => alert.status === 'triggered')
  },

  getSnoozedAlerts: () => {
    return get().alerts.filter((alert) => alert.status === 'snoozed')
  },

  getAlertsBySymbol: (symbol: string) => {
    return get().alerts.filter((alert) => alert.symbol === symbol)
  },

  getAlertById: (alertId: string) => {
    return get().alerts.find((alert) => alert.alertId === alertId)
  },
}))
