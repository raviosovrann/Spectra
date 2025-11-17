import { motion } from 'framer-motion'
import { Mail, Lock, User, ArrowRight, Check } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Signup() {
  const navigate = useNavigate()
  const { register, isLoading, error } = useAuth()
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    emailAddress: '',
    password: '',
    confirmPassword: '',
  })
  const [localError, setLocalError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    // Validation
    if (!formData.fullName || !formData.username || !formData.emailAddress || !formData.password) {
      setLocalError('All fields are required')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setLocalError('Passwords do not match')
      return
    }

    if (formData.password.length < 8) {
      setLocalError('Password must be at least 8 characters')
      return
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      setLocalError('Password must contain uppercase, lowercase, and number')
      return
    }

    try {
      await register({
        fullName: formData.fullName,
        username: formData.username,
        emailAddress: formData.emailAddress,
        password: formData.password,
      })
      navigate('/dashboard')
    } catch (err) {
      setLocalError(error || 'Registration failed. Please try again.')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    setLocalError(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 flex items-center justify-center px-4 py-12">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(14,165,233,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(34,197,94,0.1),transparent_50%)]" />

      <div className="w-full max-w-6xl relative">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - Benefits */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden lg:block"
          >
            <div className="mb-8">
              <div 
                className="inline-flex items-center gap-2 cursor-pointer mb-4"
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
              <h1 className="text-4xl font-bold text-white mb-4">
                Start trading smarter today
              </h1>
              <p className="text-lg text-dark-300">
                Join thousands of traders using AI-powered insights to make better decisions
              </p>
            </div>

            <div className="space-y-4">
              {[
                {
                  title: 'AI-Powered Insights',
                  description: 'Get intelligent market analysis in real-time',
                },
                {
                  title: 'Real-Time Data',
                  description: 'Access live cryptocurrency prices and trends',
                },
                {
                  title: 'Secure Trading',
                  description: 'Bank-level security for all your transactions',
                },
                {
                  title: 'Paper Trading',
                  description: 'Practice with virtual money before going live',
                },
              ].map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.1 }}
                  className="flex gap-4 items-start"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500/10 border border-primary-500/20">
                    <Check className="h-5 w-5 text-primary-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">{benefit.title}</h3>
                    <p className="text-dark-400">{benefit.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Side - Signup Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            {/* Mobile Logo */}
            <div className="lg:hidden mb-8 text-center">
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
              <p className="text-dark-400">Create your account to get started</p>
            </div>

            <div className="relative rounded-3xl bg-dark-900 p-8 border border-dark-800 shadow-2xl">
              <h2 className="text-2xl font-bold text-white mb-6">Create Account</h2>

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

              {/* Signup Form */}
              <form onSubmit={handleSubmit} className="space-y-4 mt-6">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-dark-300 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-dark-500" />
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className="w-full rounded-xl bg-dark-800 border border-dark-700 pl-11 pr-4 py-3 text-white placeholder-dark-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all disabled:opacity-50"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-dark-300 mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-dark-500" />
                    <input
                      id="username"
                      name="username"
                      type="text"
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="spectra-user"
                      className="w-full rounded-xl bg-dark-800 border border-dark-700 pl-11 pr-4 py-3 text-white placeholder-dark-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all disabled:opacity-50"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="emailAddress" className="block text-sm font-medium text-dark-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-dark-500" />
                    <input
                      id="emailAddress"
                      name="emailAddress"
                      type="email"
                      value={formData.emailAddress}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      className="w-full rounded-xl bg-dark-800 border border-dark-700 pl-11 pr-4 py-3 text-white placeholder-dark-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all disabled:opacity-50"
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
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full rounded-xl bg-dark-800 border border-dark-700 pl-11 pr-4 py-3 text-white placeholder-dark-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all disabled:opacity-50"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <p className="text-xs text-dark-400 mt-1">Min 8 chars, uppercase, lowercase, number</p>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-dark-300 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-dark-500" />
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full rounded-xl bg-dark-800 border border-dark-700 pl-11 pr-4 py-3 text-white placeholder-dark-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all disabled:opacity-50"
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
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                  {!isLoading && <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />}
                </button>
              </form>

              {/* Login Link */}
              <p className="mt-6 text-center text-sm text-dark-400">
                Already have an account?{' '}
                <button
                  onClick={() => navigate('/login')}
                  className="text-primary-400 hover:text-primary-300 font-semibold transition-colors"
                >
                  Sign in
                </button>
              </p>

              {/* Glow effect */}
              <div className="absolute inset-0 -z-10 rounded-3xl bg-primary-500/5 blur-2xl" />
            </div>

            {/* Security Badge */}
            <p className="mt-6 text-center text-xs text-dark-500">
              🔒 Your data is encrypted and secure
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
