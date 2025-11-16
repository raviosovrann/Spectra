import { motion } from 'framer-motion'
import { Zap, Mail, Lock, User, ArrowRight, Github, Chrome, Check } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Signup() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // No authentication - directly navigate to dashboard
    navigate('/dashboard')
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
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
                  <Zap className="h-7 w-7 text-white" />
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
                  <Zap className="h-7 w-7 text-white" />
                </div>
                <span className="text-3xl font-bold bg-gradient-to-r from-white to-primary-200 bg-clip-text text-transparent">
                  Spectra
                </span>
              </div>
              <p className="text-dark-400">Create your account to get started</p>
            </div>

            <div className="relative rounded-3xl bg-dark-900 p-8 border border-dark-800 shadow-2xl">
              <h2 className="text-2xl font-bold text-white mb-6">Create Account</h2>

              {/* Social Signup */}
              <div className="mb-6 space-y-3">
                <button className="w-full flex items-center justify-center gap-3 rounded-xl bg-dark-800 px-4 py-3 text-white hover:bg-dark-750 transition-colors border border-dark-700">
                  <Chrome className="h-5 w-5" />
                  <span className="font-medium">Continue with Google</span>
                </button>
                <button className="w-full flex items-center justify-center gap-3 rounded-xl bg-dark-800 px-4 py-3 text-white hover:bg-dark-750 transition-colors border border-dark-700">
                  <Github className="h-5 w-5" />
                  <span className="font-medium">Continue with GitHub</span>
                </button>
              </div>

              {/* Divider */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-dark-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-dark-900 text-dark-400">Or sign up with email</span>
                </div>
              </div>

              {/* Signup Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-dark-300 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-dark-500" />
                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className="w-full rounded-xl bg-dark-800 border border-dark-700 pl-11 pr-4 py-3 text-white placeholder-dark-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-dark-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-dark-500" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      className="w-full rounded-xl bg-dark-800 border border-dark-700 pl-11 pr-4 py-3 text-white placeholder-dark-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                      required
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
                      className="w-full rounded-xl bg-dark-800 border border-dark-700 pl-11 pr-4 py-3 text-white placeholder-dark-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                      required
                    />
                  </div>
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
                      className="w-full rounded-xl bg-dark-800 border border-dark-700 pl-11 pr-4 py-3 text-white placeholder-dark-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="terms"
                    className="mt-1 rounded border-dark-700 bg-dark-800 text-primary-500 focus:ring-primary-500 focus:ring-offset-dark-900"
                    required
                  />
                  <label htmlFor="terms" className="text-sm text-dark-300">
                    I agree to the{' '}
                    <a href="#" className="text-primary-400 hover:text-primary-300">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="#" className="text-primary-400 hover:text-primary-300">
                      Privacy Policy
                    </a>
                  </label>
                </div>

                <button
                  type="submit"
                  className="group w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-3 text-base font-semibold text-white hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50"
                >
                  Create Account
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
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
