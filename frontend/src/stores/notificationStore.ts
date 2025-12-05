import { create } from 'zustand'

export type NotificationVariant = 'info' | 'success' | 'warning' | 'error'

export interface NotificationItem {
  id: string
  title: string
  message: string
  createdAt: number
  variant: NotificationVariant
}

interface NotificationState {
  notifications: NotificationItem[]
  push: (item: Omit<NotificationItem, 'id' | 'createdAt'> & { id?: string; createdAt?: number }) => void
  remove: (id: string) => void
  clear: () => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  push: (item) => {
    const id = item.id || crypto.randomUUID()
    const createdAt = item.createdAt || Date.now()
    set((state) => ({
      notifications: [
        { ...item, id, createdAt },
        ...state.notifications,
      ].slice(0, 5), // keep only latest 5
    }))

    // Auto remove after 8 seconds
    setTimeout(() => {
      set((state) => ({ notifications: state.notifications.filter((n) => n.id !== id) }))
    }, 8000)
  },
  remove: (id) => set((state) => ({ notifications: state.notifications.filter((n) => n.id !== id) })),
  clear: () => set({ notifications: [] }),
}))
