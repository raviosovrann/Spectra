import { motion } from 'framer-motion'
import { Brain, TrendingUp, Shield, Zap, Bell, BarChart3 } from 'lucide-react'

const features = [
  {
    icon: Brain,
    title: 'Technical Analysis',
    description: 'Get intelligent market analysis and trading recommendations powered by proven technical indicators.',
    color: 'from-primary-500 to-primary-600',
  },
  {
    icon: TrendingUp,
    title: 'Real-Time Heatmap',
    description: 'Visualize market movements instantly with our interactive cryptocurrency heatmap.',
    color: 'from-success-500 to-success-600',
  },
  {
    icon: Shield,
    title: 'Secure Trading',
    description: 'Bank-level security with encrypted connections and secure API integration with Coinbase.',
    color: 'from-warning-500 to-warning-600',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Execute trades in milliseconds with our optimized infrastructure and real-time data feeds.',
    color: 'from-primary-400 to-primary-500',
  },
  {
    icon: Bell,
    title: 'Smart Alerts',
    description: 'Never miss an opportunity with customizable price alerts and technical indicator notifications.',
    color: 'from-danger-500 to-danger-600',
  },
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description: 'Deep dive into market trends with comprehensive charts and technical indicators.',
    color: 'from-success-400 to-success-500',
  },
]

export default function Features() {
  return (
    <section id="features" className="relative px-4 py-24">
      <div className="container mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <h2 className="mb-4 text-4xl font-bold text-white lg:text-5xl">
            Everything you need to trade smarter
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-dark-300">
            Powerful features designed to give you an edge in the crypto market
          </p>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative overflow-hidden rounded-2xl bg-dark-900 p-8 border border-dark-800 hover:border-dark-700 transition-all hover:scale-105"
            >
              <div className="relative z-10">
                <div
                  className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color}`}
                >
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-white">{feature.title}</h3>
                <p className="text-dark-300">{feature.description}</p>
              </div>

              {/* Hover glow effect */}
              <div className="absolute inset-0 -z-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
