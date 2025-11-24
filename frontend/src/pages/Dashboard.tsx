import { motion } from 'framer-motion'
import { Sparkles, TrendingUp, DollarSign, Activity } from 'lucide-react'

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary-500/50">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Dashboard</h1>
              <p className="text-sm text-dark-400">Welcome back!</p>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {[
            {
              title: 'Portfolio Value',
              value: '$124,582.00',
              change: '+12.4%',
              icon: DollarSign,
              positive: true,
            },
            {
              title: 'Total Profit',
              value: '$14,250.00',
              change: '+8.2%',
              icon: TrendingUp,
              positive: true,
            },
            {
              title: 'Active Trades',
              value: '12',
              change: '+3',
              icon: Activity,
              positive: true,
            },
            {
              title: '24h Volume',
              value: '$45,230.00',
              change: '+15.3%',
              icon: Activity,
              positive: true,
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="rounded-2xl bg-dark-900 p-6 border border-dark-800 hover:border-primary-500/50 transition-colors"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/10">
                  <stat.icon className="h-5 w-5 text-primary-400" />
                </div>
                <span
                  className={`text-sm font-bold font-mono ${
                    stat.positive ? 'text-success-400' : 'text-danger-400'
                  }`}
                >
                  {stat.change}
                </span>
              </div>
              <h3 className="text-sm text-dark-400 mb-1 font-medium">{stat.title}</h3>
              <p className="text-2xl font-bold text-white font-mono tracking-tight">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Coming Soon Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-3xl bg-gradient-to-br from-primary-500/10 to-success-500/10 p-12 text-center border border-primary-500/20"
        >
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 mb-4">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Dashboard Coming Soon</h2>
          <p className="text-lg text-dark-300 max-w-2xl mx-auto">
            We&apos;re building an amazing trading experience for you. The full dashboard with real-time
            charts, AI insights, and trading features will be available soon!
          </p>
        </motion.div>
      </div>
    </div>
  )
}
