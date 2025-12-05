import { motion } from 'framer-motion'
import { ArrowRight, TrendingUp, LineChart, Activity, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import btcIcon from 'cryptocurrency-icons/svg/color/btc.svg'
import ethIcon from 'cryptocurrency-icons/svg/color/eth.svg'
import solIcon from 'cryptocurrency-icons/svg/color/sol.svg'

export default function Hero() {
  const navigate = useNavigate()

  const areaPath = 'M0 170 L0 140 L40 128 L80 112 L120 126 L160 94 L200 118 L240 92 L280 110 L320 74 L360 88 L400 62 L400 200 L0 200 Z'
  const primaryLinePath = 'M0 138 L40 126 L80 110 L120 124 L160 94 L200 116 L240 90 L280 108 L320 72 L360 86 L400 62'
  const secondaryLinePath = 'M0 154 L40 146 L80 132 L120 138 L160 120 L200 134 L240 114 L280 122 L320 96 L360 100 L400 82'
  const volumeSeries = [36, 68, 54, 92, 64, 118, 86, 132, 104]

  const cryptoAssets = [
    {
      name: 'Bitcoin',
      symbol: 'BTC',
      price: '$43,250',
      change: '+5.2%',
      positive: true,
      icon: btcIcon,
      accent: 'linear-gradient(135deg, #F7931A 0%, #FFB347 100%)',
      progress: '78%',
    },
    {
      name: 'Ethereum',
      symbol: 'ETH',
      price: '$2,280',
      change: '+3.8%',
      positive: true,
      icon: ethIcon,
      accent: 'linear-gradient(135deg, #627EEA 0%, #9CBBFF 100%)',
      progress: '64%',
    },
    {
      name: 'Solana',
      symbol: 'SOL',
      price: '$98.50',
      change: '-1.2%',
      positive: false,
      icon: solIcon,
      accent: 'linear-gradient(135deg, #9945FF 0%, #14F195 100%)',
      progress: '42%',
    },
  ]

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
              <svg className="h-6 w-6 text-white" viewBox="0 0 46 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 33L4.60606 25H12.2448C17.2569 25 21.4947 28.7103 22.1571 33.6784L23 40H13L11.5585 36.6365C10.613 34.4304 8.44379 33 6.04362 33H0Z" fill="currentColor" />
                <path d="M46 33L41.3939 25H33.7552C28.7431 25 24.5053 28.7103 23.8429 33.6784L23 40H33L34.4415 36.6365C35.387 34.4304 37.5562 33 39.9564 33H46Z" fill="currentColor" />
                <path d="M4.60606 25L18.9999 0H23L22.6032 9.52405C22.2608 17.7406 15.7455 24.3596 7.53537 24.8316L4.60606 25Z" fill="currentColor" />
                <path d="M41.3939 25L27.0001 0H23L23.3968 9.52405C23.7392 17.7406 30.2545 24.3596 38.4646 24.8316L41.3939 25Z" fill="currentColor" />
              </svg>
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
            <a href="#features" className="hidden md:block text-dark-300 hover:text-white transition-colors font-medium">
              Insights
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
              <span>Real-Time Trading Intelligence</span>
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
              Real-time market insights powered by technical analysis. Make smarter trading decisions with
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
              {/* Immersive Trading Interface */}
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-dark-400">Portfolio Value</p>
                    <p className="text-4xl font-bold text-white">$124,582.00</p>
                  </div>
                  <div className="rounded-full border border-success-500/30 bg-success-500/10 px-4 py-2 text-sm font-semibold text-success-400 shadow-inner shadow-success-500/20">
                    +12.4%
                    <span className="ml-2 text-xs text-dark-400">24h</span>
                  </div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="grid grid-cols-1 gap-3 sm:grid-cols-3"
                >
                  <div className="rounded-xl border border-primary-500/20 bg-primary-500/5 px-4 py-3 backdrop-blur">
                    <div className="flex items-center gap-2 text-primary-200">
                      <LineChart className="h-4 w-4" />
                      <span className="text-xs font-semibold uppercase tracking-wide">Live Data</span>
                    </div>
                    <div className="mt-2 flex items-end gap-2">
                      <span className="text-2xl font-semibold text-white">Real-Time</span>
                    </div>
                  </div>
                  <div className="rounded-xl border border-success-500/20 bg-success-500/5 px-4 py-3 backdrop-blur">
                    <div className="flex items-center gap-2 text-success-200">
                      <ShieldCheck className="h-4 w-4" />
                      <span className="text-xs font-semibold uppercase tracking-wide">Risk Guard</span>
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-white">Balanced</div>
                    <div className="text-xs text-success-200">Drawdown 3.1%</div>
                  </div>
                  <div className="rounded-xl border border-purple-500/20 bg-purple-500/10 px-4 py-3 backdrop-blur">
                    <div className="flex items-center gap-2 text-purple-100">
                      <Activity className="h-4 w-4" />
                      <span className="text-xs font-semibold uppercase tracking-wide">Volatility</span>
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-white">Low</div>
                    <div className="text-xs text-purple-100">σ: 0.84</div>
                  </div>
                </motion.div>

                <div className="relative h-56 overflow-hidden rounded-2xl border border-dark-700/70 bg-dark-950/60 p-5 shadow-inner shadow-primary-500/5 backdrop-blur-xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-500/15 via-transparent to-success-500/15" />
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        'radial-gradient(circle at 20% 20%, rgba(14,165,233,0.18), transparent 55%), radial-gradient(circle at 80% 30%, rgba(16,185,129,0.18), transparent 60%)',
                    }}
                  />
                  <div
                    className="absolute inset-0 opacity-30"
                    style={{
                      backgroundImage:
                        'linear-gradient(to right, rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.08) 1px, transparent 1px)',
                      backgroundSize: '42px 42px',
                    }}
                  />
                  <svg className="relative z-10 h-full w-full" viewBox="0 0 400 200" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="rgba(14,165,233,0.55)" />
                        <stop offset="100%" stopColor="rgba(14,165,233,0)" />
                      </linearGradient>
                      <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#38bdf8" />
                        <stop offset="50%" stopColor="#22d3ee" />
                        <stop offset="100%" stopColor="#34d399" />
                      </linearGradient>
                      <linearGradient id="secondaryLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="rgba(139,92,246,0.8)" />
                        <stop offset="100%" stopColor="rgba(244,114,182,0.8)" />
                      </linearGradient>
                      <linearGradient id="volumeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="rgba(22,163,74,0.7)" />
                        <stop offset="100%" stopColor="rgba(22,163,74,0.1)" />
                      </linearGradient>
                      <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
                        <feGaussianBlur stdDeviation="6" result="coloredBlur" />
                        <feMerge>
                          <feMergeNode in="coloredBlur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>

                    {Array.from({ length: 5 }).map((_, i) => {
                      const y = 170 - i * 26
                      return (
                        <line
                          key={`h-${i}`}
                          x1="0"
                          y1={y}
                          x2="400"
                          y2={y}
                          stroke="rgba(148,163,184,0.12)"
                          strokeDasharray="6 10"
                        />
                      )
                    })}

                    {Array.from({ length: 6 }).map((_, i) => {
                      const x = 60 + i * 54
                      return (
                        <line
                          key={`v-${i}`}
                          x1={x}
                          y1="30"
                          x2={x}
                          y2="190"
                          stroke="rgba(148,163,184,0.08)"
                          strokeDasharray="4 14"
                        />
                      )
                    })}

                    <path d={areaPath} fill="url(#areaGradient)" opacity="0.9" />
                    <path
                      d={primaryLinePath}
                      fill="none"
                      stroke="url(#lineGradient)"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      filter="url(#glow)"
                    />
                    <path
                      d={secondaryLinePath}
                      fill="none"
                      stroke="url(#secondaryLineGradient)"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeDasharray="8 12"
                      opacity="0.8"
                    />

                    {volumeSeries.map((height, index) => {
                      const x = 20 + index * 42
                      const y = 190 - height
                      return (
                        <rect
                          key={index}
                          x={x}
                          y={y}
                          width="18"
                          height={height}
                          rx="6"
                          fill="url(#volumeGradient)"
                          opacity="0.55"
                        />
                      )
                    })}

                    <motion.circle
                      cx="360"
                      cy="86"
                      r="7"
                      fill="#22d3ee"
                      initial={{ scale: 0.9, opacity: 0.6 }}
                      animate={{ scale: [0.9, 1.6, 0.9], opacity: [0.6, 1, 0.6] }}
                      transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <motion.circle
                      cx="360"
                      cy="86"
                      r="18"
                      fill="rgba(34,211,238,0.15)"
                      initial={{ opacity: 0.2 }}
                      animate={{ opacity: [0.2, 0.5, 0.2] }}
                      transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    {/* <text x="300" y="46" fill="rgba(203,213,225,0.8)" fontSize="12" letterSpacing="0.1em">
                      AI UPLIFT
                    </text> */}
                  </svg>

                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="absolute left-5 top-5 flex items-center gap-3 rounded-xl border border-primary-500/30 bg-dark-900/80 px-4 py-3 text-xs text-dark-200 shadow-lg shadow-primary-500/20 backdrop-blur"
                  >
                    <LineChart className="h-4 w-4 text-primary-300" />
                    <div>
                      <div className="text-[11px] uppercase tracking-wide text-dark-400">Market Signal</div>
                      <div className="text-sm font-semibold text-white">Momentum Rising</div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="absolute right-5 top-5 flex items-center gap-3 rounded-xl border border-success-500/30 bg-success-500/10 px-4 py-3 text-xs shadow-lg shadow-success-500/20 backdrop-blur"
                  >
                    <ShieldCheck className="h-4 w-4 text-success-200" />
                    <div>
                      <div className="text-[11px] uppercase tracking-wide text-success-200/80">Risk Level</div>
                      <div className="text-sm font-semibold text-white">Balanced</div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                    className="absolute left-5 bottom-5 rounded-xl border border-purple-500/30 bg-purple-500/15 px-4 py-3 text-xs shadow-lg shadow-purple-500/20 backdrop-blur"
                  >
                    <div className="flex items-center gap-2 text-purple-100">
                      <Activity className="h-4 w-4" />
                      <span className="uppercase tracking-wide text-[11px]">Volatility Index</span>
                    </div>
                    <div className="mt-2 flex items-end gap-2">
                      <span className="text-lg font-semibold text-white">21.4</span>
                      <span className="text-[11px] text-purple-100">↓ 4.2%</span>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.55 }}
                    className="absolute right-5 bottom-5 rounded-xl border border-success-500/30 bg-success-500/15 px-4 py-3 text-xs text-success-100 shadow-lg shadow-success-500/20 backdrop-blur"
                  >
                    <div className="uppercase tracking-wide text-[11px] text-success-100/80">Projected ROI</div>
                    <div className="mt-1 text-lg font-semibold text-white">+18.7%</div>
                    <div className="text-[11px] text-success-100/60">30 day outlook</div>
                  </motion.div>
                </div>

                <div className="space-y-3">
                  {cryptoAssets.map((crypto, i) => (
                    <motion.div
                      key={crypto.symbol}
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.08 }}
                      className="flex items-center justify-between rounded-2xl border border-dark-700/60 bg-gradient-to-r from-dark-900/80 via-dark-900/60 to-dark-950/70 p-4 shadow-lg shadow-black/25 backdrop-blur"
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative h-10 w-10 overflow-hidden rounded-full border border-white/10 shadow-inner shadow-black/40">
                          <div className="absolute inset-0 opacity-70" style={{ background: crypto.accent }} />
                          <img
                            src={crypto.icon}
                            alt={`${crypto.name} icon`}
                            className="relative z-10 h-full w-full p-1.5 object-contain"
                          />
                          <div className="absolute inset-0 rounded-full ring-1 ring-white/10" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white">{crypto.name}</div>
                          <div className="text-xs uppercase tracking-wide text-dark-400">{crypto.symbol}</div>
                          <div className="mt-2 h-1.5 w-24 rounded-full bg-dark-800">
                            <div
                              className={`h-full rounded-full ${crypto.positive ? 'bg-success-400' : 'bg-danger-400'}`}
                              style={{ width: crypto.progress }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-white">{crypto.price}</div>
                        <div
                          className={`text-xs ${crypto.positive ? 'text-success-400' : 'text-danger-400'}`}
                        >
                          {crypto.change}
                        </div>
                        <div className="mt-1 text-[11px] text-dark-400">24h Performance</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Floating Live Badge */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="absolute -right-4 -top-4 rounded-2xl bg-gradient-to-br from-success-500 to-success-600 p-4 shadow-xl"
              >
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-white" />
                  <div className="text-sm font-semibold text-white">Live Data</div>
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
