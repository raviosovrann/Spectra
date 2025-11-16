import { motion } from 'framer-motion'
import { ArrowRight, TrendingUp, Zap, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Hero() {
  const navigate = useNavigate()

  return (
    <section className="relative overflow-hidden px-4 pt-20 pb-32">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-success-500/10" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(14,165,233,0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(34,197,94,0.15),transparent_50%)]" />
      
      {/* Floating crypto icons animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[
          { icon: '₿', delay: 0, x: '10%', y: '20%' },
          { icon: 'Ξ', delay: 0.5, x: '80%', y: '30%' },
          { icon: '◎', delay: 1, x: '15%', y: '70%' },
          { icon: '₳', delay: 1.5, x: '85%', y: '60%' },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: [0.1, 0.3, 0.1],
              y: [0, -30, 0],
            }}
            transition={{
              delay: item.delay,
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute text-6xl text-primary-500/20"
            style={{ left: item.x, top: item.y }}
          >
            {item.icon}
          </motion.div>
        ))}
      </div>

      <div className="container relative mx-auto max-w-7xl">
        {/* Navigation */}
        <nav className="mb-20 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary-500/50">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-white to-primary-200 bg-clip-text text-transparent">Spectra</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-6"
          >
            <a href="#features" className="hidden md:block text-dark-300 hover:text-white transition-colors font-medium">
              Features
            </a>
            <a href="#insights" className="hidden md:block text-dark-300 hover:text-white transition-colors font-medium">
              AI Insights
            </a>
            <button 
              onClick={() => navigate('/login')}
              className="text-dark-300 hover:text-white transition-colors font-medium"
            >
              Sign In
            </button>
            <button 
              onClick={() => navigate('/signup')}
              className="rounded-full bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-2.5 text-sm font-semibold text-white hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 hover:scale-105"
            >
              Get Started
            </button>
          </motion.div>
        </nav>

        {/* Hero Content */}
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20 items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary-500/10 px-4 py-2 text-sm text-primary-400"
            >
              <TrendingUp className="h-4 w-4" />
              <span>AI-Powered Trading Intelligence</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-6 text-5xl font-bold leading-tight text-white lg:text-7xl"
            >
              Trade crypto
              <br />
              <span className="bg-gradient-to-r from-primary-400 to-success-400 bg-clip-text text-transparent">
                with confidence
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-8 text-lg text-dark-300 lg:text-xl"
            >
              Real-time market insights powered by AI. Make smarter trading decisions with
              intelligent analytics, live heatmaps, and instant alerts.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col gap-4 sm:flex-row"
            >
              <button 
                onClick={() => navigate('/signup')}
                className="group flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 px-8 py-4 text-base font-semibold text-white hover:from-primary-600 hover:to-primary-700 transition-all hover:scale-105 shadow-xl shadow-primary-500/30"
              >
                Start Trading
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
              <button className="rounded-full border-2 border-dark-700 px-8 py-4 text-base font-semibold text-white hover:border-primary-500 hover:bg-dark-800/50 transition-all backdrop-blur-sm">
                Watch Demo
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-12 flex items-center gap-8 text-sm text-dark-400"
            >
              <div>
                <div className="text-2xl font-bold text-white">$2.4B+</div>
                <div>Trading Volume</div>
              </div>
              <div className="h-8 w-px bg-dark-700" />
              <div>
                <div className="text-2xl font-bold text-white">50K+</div>
                <div>Active Traders</div>
              </div>
              <div className="h-8 w-px bg-dark-700" />
              <div>
                <div className="text-2xl font-bold text-white">99.9%</div>
                <div>Uptime</div>
              </div>
            </motion.div>
          </div>

          {/* Hero Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="relative"
          >
            <div className="relative rounded-3xl bg-gradient-to-br from-dark-800 to-dark-900 p-8 shadow-2xl border border-dark-700">
              {/* Mock Trading Interface */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-dark-400">Portfolio Value</span>
                  <span className="text-sm text-success-400">+12.4%</span>
                </div>
                <div className="text-4xl font-bold text-white">$124,582.00</div>

                {/* Mock Chart */}
                <div className="h-48 rounded-xl bg-dark-950/50 p-4">
                  <svg className="h-full w-full" viewBox="0 0 400 150">
                    <defs>
                      <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="rgb(14, 165, 233)" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="rgb(14, 165, 233)" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 0 120 L 50 100 L 100 80 L 150 90 L 200 60 L 250 70 L 300 40 L 350 50 L 400 30"
                      fill="url(#chartGradient)"
                      stroke="rgb(14, 165, 233)"
                      strokeWidth="2"
                    />
                  </svg>
                </div>

                {/* Mock Crypto List */}
                <div className="space-y-3">
                  {[
                    { name: 'Bitcoin', symbol: 'BTC', price: '$43,250', change: '+5.2%', positive: true },
                    { name: 'Ethereum', symbol: 'ETH', price: '$2,280', change: '+3.8%', positive: true },
                    { name: 'Solana', symbol: 'SOL', price: '$98.50', change: '-1.2%', positive: false },
                  ].map((crypto, i) => (
                    <motion.div
                      key={crypto.symbol}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                      className="flex items-center justify-between rounded-lg bg-dark-950/50 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600" />
                        <div>
                          <div className="text-sm font-semibold text-white">{crypto.name}</div>
                          <div className="text-xs text-dark-400">{crypto.symbol}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-white">{crypto.price}</div>
                        <div
                          className={`text-xs ${crypto.positive ? 'text-success-400' : 'text-danger-400'}`}
                        >
                          {crypto.change}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Floating AI Badge */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="absolute -right-4 -top-4 rounded-2xl bg-gradient-to-br from-success-500 to-success-600 p-4 shadow-xl"
              >
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-white" />
                  <div className="text-sm font-semibold text-white">AI Active</div>
                </div>
              </motion.div>
            </div>

            {/* Glow effect */}
            <div className="absolute inset-0 -z-10 rounded-3xl bg-primary-500/20 blur-3xl" />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
