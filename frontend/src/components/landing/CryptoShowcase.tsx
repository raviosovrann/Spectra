import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Sparkles } from 'lucide-react'

const cryptos = [
  { 
    name: 'Bitcoin', 
    symbol: 'BTC', 
    price: 43250.32, 
    change: 5.24, 
    volume: '28.4B',
    color: 'from-orange-500 to-orange-600',
    icon: '₿'
  },
  { 
    name: 'Ethereum', 
    symbol: 'ETH', 
    price: 2280.45, 
    change: 3.82, 
    volume: '15.2B',
    color: 'from-purple-500 to-purple-600',
    icon: 'Ξ'
  },
  { 
    name: 'Solana', 
    symbol: 'SOL', 
    price: 98.5, 
    change: -1.23, 
    volume: '2.8B',
    color: 'from-violet-500 to-violet-600',
    icon: '◎'
  },
  { 
    name: 'Cardano', 
    symbol: 'ADA', 
    price: 0.52, 
    change: 2.15, 
    volume: '890M',
    color: 'from-blue-500 to-blue-600',
    icon: '₳'
  },
  { 
    name: 'Polygon', 
    symbol: 'MATIC', 
    price: 0.89, 
    change: 4.67, 
    volume: '1.2B',
    color: 'from-purple-600 to-indigo-600',
    icon: '⬡'
  },
  { 
    name: 'Avalanche', 
    symbol: 'AVAX', 
    price: 36.78, 
    change: -0.89, 
    volume: '780M',
    color: 'from-red-500 to-red-600',
    icon: '▲'
  },
]

export default function CryptoShowcase() {
  return (
    <section className="relative overflow-hidden px-4 py-24">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(14,165,233,0.05),transparent_70%)]" />
      
      <div className="container mx-auto max-w-7xl relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary-500/10 px-4 py-2 text-sm text-primary-400"
          >
            <Sparkles className="h-4 w-4" />
            <span>Live Market Data</span>
          </motion.div>
          <h2 className="mb-4 text-4xl font-bold text-white lg:text-5xl">
            Track top cryptocurrencies
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-dark-300">
            Real-time prices and market data for the most popular digital assets
          </p>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cryptos.map((crypto, index) => (
            <motion.div
              key={crypto.symbol}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-dark-900 to-dark-950 p-6 border border-dark-800 hover:border-dark-700 transition-all cursor-pointer hover:scale-105"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${crypto.color} flex items-center justify-center text-white text-2xl font-bold shadow-lg`}>
                    {crypto.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{crypto.name}</h3>
                    <p className="text-sm text-dark-400">{crypto.symbol}</p>
                  </div>
                </div>
                <div
                  className={`flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold ${
                    crypto.change >= 0
                      ? 'bg-success-500/10 text-success-400'
                      : 'bg-danger-500/10 text-danger-400'
                  }`}
                >
                  {crypto.change >= 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  {Math.abs(crypto.change)}%
                </div>
              </div>

              <div className="mt-6">
                <div className="text-3xl font-bold text-white">
                  ${crypto.price.toLocaleString()}
                </div>
                <div className="mt-2 text-sm text-dark-400">Volume: {crypto.volume}</div>
              </div>

              {/* Mini chart placeholder */}
              <div className="mt-4 h-16 rounded-lg bg-dark-950/50 overflow-hidden">
                <svg className="h-full w-full" viewBox="0 0 200 60" preserveAspectRatio="none">
                  <path
                    d={`M 0 ${30 + Math.random() * 20} ${Array.from({ length: 20 }, (_, i) => {
                      const x = (i + 1) * 10
                      const y = 30 + Math.random() * 20
                      return `L ${x} ${y}`
                    }).join(' ')}`}
                    fill="none"
                    stroke={crypto.change >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'}
                    strokeWidth="2"
                    opacity="0.5"
                  />
                </svg>
              </div>

              {/* Hover effect */}
              <div className="absolute inset-0 -z-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <button className="rounded-full border border-dark-700 px-8 py-3 text-base font-semibold text-white hover:border-dark-600 hover:bg-dark-800 transition-all">
            View All Cryptocurrencies
          </button>
        </motion.div>
      </div>
    </section>
  )
}
