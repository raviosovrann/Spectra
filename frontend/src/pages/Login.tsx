import { motion } from 'framer-motion'
import { Mail, Lock, ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const navigate = useNavigate()
  const { login, isLoading, error } = useAuth()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    if (!identifier || !password) {
      setLocalError('Email/username and password are required')
      return
    }

    try {
      await login({ identifier, password })
      navigate('/dashboard')
    } catch (err) {
      setLocalError(error || 'Login failed. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 flex items-center justify-center px-4 py-12">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(14,165,233,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(34,197,94,0.1),transparent_50%)]" />

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <div 
            className="inline-flex items-center gap-2 cursor-pointer mb-2"
            onClick={() => navigate('/')}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary-500/50">
              <svg className="h-7 w-7 text-white" viewBox="0 0 46 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 33L4.60606 25H12.2448C17.2569 25 21.4947 28.7103 22.1571 33.6784L23 40H13L11.5585 36.6365C10.613 34.4304 8.44379 33 6.04362 33H0Z" fill="currentColor" />
                <path d="M46 33L41.3939 25H33.7552C28.7431 25 24.5053 28.7103 23.8429 33.6784L23 40H33L34.4415 36.6365C35.387 34.4304 37.5562 33 39.9564 33H46Z" fill="currentColor" />
                <path d="M4.60606 25L18.9999 0H23L22.6032 9.52405C22.2608 17.7406 15.7455 24.3596 7.53537 24.8316L4.60606 25Z" fill="currentColor" />
                <path d="M41.3939 25L27.0001 0H23L23.3968 9.52405C23.7392 17.7406 30.2545 24.3596 38.4646 24.8316L41.3939 25Z" fill="currentColor" />
              </svg>
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-white to-primary-200 bg-clip-text text-transparent">
              Spectra
            </span>
          </div>
          <p className="text-dark-400">Welcome back! Sign in to your account</p>
        </motion.div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative rounded-3xl bg-dark-900 p-8 border border-dark-800 shadow-2xl"
        >
          {/* Error Message */}
          {(localError || error) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400"
            >
              {localError || error}
            </motion.div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-dark-300 mb-2">
                Email or Username
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-dark-500" />
                <input
                  id="identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value)
                    setLocalError(null)
                  }}
                  placeholder="your@email.com or username"
                  className="w-full rounded-xl bg-dark-800 border border-dark-700 pl-11 pr-4 py-3 text-white placeholder-dark-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-dark-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-dark-500" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setLocalError(null)
                  }}
                  placeholder="••••••••"
                  className="w-full rounded-xl bg-dark-800 border border-dark-700 pl-11 pr-4 py-3 text-white placeholder-dark-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="group w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-3 text-base font-semibold text-white hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
              {!isLoading && <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />}
            </button>
          </form>

          {/* Sign Up Link */}
          <p className="mt-6 text-center text-sm text-dark-400">
            Don&apos;t have an account?{' '}
            <button
              onClick={() => navigate('/signup')}
              className="text-primary-400 hover:text-primary-300 font-semibold transition-colors"
            >
              Sign up for free
            </button>
          </p>

          {/* Glow effect */}
          <div className="absolute inset-0 -z-10 rounded-3xl bg-primary-500/5 blur-2xl" />
        </motion.div>

        {/* Security Badge */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 text-center text-xs text-dark-500"
        >
          🔒 Secured with bank-level encryption
        </motion.p>
      </div>
    </div>
  )
}
