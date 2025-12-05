import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNotificationStore } from '../stores/notificationStore'

const variantStyles: Record<string, string> = {
  info: 'bg-slate-800/90 border-slate-700 text-slate-100',
  success: 'bg-emerald-900/90 border-emerald-700 text-emerald-50',
  warning: 'bg-amber-900/90 border-amber-700 text-amber-50',
  error: 'bg-rose-900/90 border-rose-700 text-rose-50',
}

export function NotificationCenter() {
  const { notifications, remove } = useNotificationStore()

  return (
    <div className="fixed top-4 left-4 z-[120] flex flex-col gap-3 w-80 pointer-events-none">
      <AnimatePresence>
        {notifications.map((n) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className={`pointer-events-auto border rounded-lg shadow-xl backdrop-blur-sm ${variantStyles[n.variant] || variantStyles.info}`}
          >
            <div className="flex items-start gap-3 p-3">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{n.title}</div>
                <div className="text-xs text-slate-200/80 leading-snug break-words">{n.message}</div>
              </div>
              <button
                aria-label="Dismiss notification"
                className="text-slate-200/70 hover:text-white"
                onClick={() => remove(n.id)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export default NotificationCenter
