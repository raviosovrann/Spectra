import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, CheckCircle, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react'
import { useEffect, useCallback, useState } from 'react'
import { formatCurrency } from '../../utils/formatters'

interface OrderDetails {
  symbol: string
  side: 'buy' | 'sell'
  type: 'market' | 'limit'
  amount: number
  price: number
  fees: number
  total: number
}

interface OrderConfirmationProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<{ success: boolean; orderId?: string; error?: string }>
  orderDetails: OrderDetails
}

type OrderStatus = 'idle' | 'confirming' | 'success' | 'error'

export default function OrderConfirmation({
  isOpen,
  onClose,
  onConfirm,
  orderDetails,
}: OrderConfirmationProps) {
  const [status, setStatus] = useState<OrderStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [orderId, setOrderId] = useState<string>('')

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStatus('idle')
      setErrorMessage('')
      setOrderId('')
    }
  }, [isOpen])

  // Handle ESC key to close modal (only when not confirming)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && status !== 'confirming') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose, status])

  // Handle order confirmation
  const handleConfirm = useCallback(async () => {
    setStatus('confirming')
    setErrorMessage('')

    try {
      const result = await onConfirm()

      if (result.success) {
        setStatus('success')
        setOrderId(result.orderId || '')

        // Auto-close after 2 seconds on success
        setTimeout(() => {
          onClose()
        }, 2000)
      } else {
        setStatus('error')
        setErrorMessage(result.error || 'Failed to place order')
      }
    } catch (error) {
      setStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred')
    }
  }, [onConfirm, onClose])

  // Handle backdrop click (only when not confirming)
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget && status !== 'confirming') {
        onClose()
      }
    },
    [onClose, status]
  )

  const isBuy = orderDetails.side === 'buy'

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleBackdropClick}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="relative w-full max-w-md rounded-2xl bg-dark-900 border border-dark-800 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-dark-800">
              <h2 className="text-xl font-bold text-white">Confirm Order</h2>
              {status !== 'confirming' && (
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Content */}
            <div className="p-6">
              {status === 'idle' && (
                <>
                  {/* Order Summary */}
                  <div className="text-center mb-6">
                    <div
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-4 ${
                        isBuy
                          ? 'bg-success-500/10 text-success-400'
                          : 'bg-danger-500/10 text-danger-400'
                      }`}
                    >
                      {isBuy ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      {isBuy ? 'Buy' : 'Sell'} {orderDetails.type === 'limit' ? '(Limit)' : '(Market)'}
                    </div>

                    <p className="text-lg text-dark-300">
                      You are about to {isBuy ? 'buy' : 'sell'}
                    </p>
                    <p className="text-3xl font-bold text-white mt-2">
                      {orderDetails.amount.toFixed(8)} {orderDetails.symbol.replace('-USD', '')}
                    </p>
                    <p className="text-dark-400 mt-1">
                      at {formatCurrency(orderDetails.price)} per coin
                    </p>
                  </div>

                  {/* Order Details */}
                  <div className="bg-dark-800/50 rounded-xl p-4 mb-6 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-dark-400">Subtotal</span>
                      <span className="text-white font-mono">
                        {formatCurrency(orderDetails.amount * orderDetails.price)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-dark-400">Fee (0.5%)</span>
                      <span className="text-white font-mono">
                        {isBuy ? '+' : '-'}{formatCurrency(orderDetails.fees)}
                      </span>
                    </div>
                    <div className="pt-3 border-t border-dark-700 flex justify-between">
                      <span className="font-semibold text-white">
                        {isBuy ? 'Total Cost' : 'You Receive'}
                      </span>
                      <span className="font-bold text-lg text-white font-mono">
                        {formatCurrency(orderDetails.total)}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={onClose}
                      className="flex-1 py-3 px-4 rounded-xl font-semibold bg-dark-800 text-dark-300 hover:bg-dark-700 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirm}
                      className={`flex-1 py-3 px-4 rounded-xl font-semibold text-white transition-all ${
                        isBuy
                          ? 'bg-gradient-to-r from-success-500 to-success-600 hover:from-success-600 hover:to-success-700'
                          : 'bg-gradient-to-r from-danger-500 to-danger-600 hover:from-danger-600 hover:to-danger-700'
                      } shadow-lg hover:shadow-xl`}
                    >
                      Confirm {isBuy ? 'Buy' : 'Sell'}
                    </button>
                  </div>
                </>
              )}

              {status === 'confirming' && (
                <div className="text-center py-8">
                  <Loader2 className="h-12 w-12 animate-spin text-primary-500 mx-auto mb-4" />
                  <p className="text-lg font-semibold text-white">Processing Order...</p>
                  <p className="text-dark-400 mt-1">Please wait while we submit your order</p>
                </div>
              )}

              {status === 'success' && (
                <div className="text-center py-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', duration: 0.5 }}
                  >
                    <CheckCircle className="h-16 w-16 text-success-400 mx-auto mb-4" />
                  </motion.div>
                  <p className="text-lg font-semibold text-white">Order Placed Successfully!</p>
                  <p className="text-dark-400 mt-1">
                    Your {orderDetails.side} order has been submitted
                  </p>
                  {orderId && (
                    <p className="text-xs text-dark-500 mt-3 font-mono">Order ID: {orderId}</p>
                  )}
                </div>
              )}

              {status === 'error' && (
                <div className="text-center py-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', duration: 0.5 }}
                  >
                    <AlertCircle className="h-16 w-16 text-danger-400 mx-auto mb-4" />
                  </motion.div>
                  <p className="text-lg font-semibold text-white">Order Failed</p>
                  <p className="text-danger-400 mt-1">{errorMessage}</p>
                  <button
                    onClick={() => setStatus('idle')}
                    className="mt-6 px-6 py-2 rounded-xl font-semibold bg-dark-800 text-white hover:bg-dark-700 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
