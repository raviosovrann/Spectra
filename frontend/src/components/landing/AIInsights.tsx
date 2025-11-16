import { motion } from 'framer-motion'
import { Brain, Sparkles, Target, TrendingUp } from 'lucide-react'

export default function AIInsights() {
  return (
    <section id="insights" className="relative px-4 py-24">
      <div className="container mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary-500/10 px-4 py-2 text-sm text-primary-400">
              <Brain className="h-4 w-4" />
              <span>Powered by Advanced AI</span>
            </div>

            <h2 className="mb-6 text-4xl font-bold text-white lg:text-5xl">
              AI that understands
              <br />
              <span className="bg-gradient-to-r from-primary-400 to-success-400 bg-clip-text text-transparent">
                the market
              </span>
            </h2>

            <p className="mb-8 text-lg text-dark-300">
              Our AI analyzes millions of data points in real-time to provide you with actionable
              insights and trading opportunities you might have missed.
            </p>

            <div className="space-y-6">
              {[
                {
                  icon: Sparkles,
                  title: 'Smart Recommendations',
                  description: 'Get personalized trading suggestions based on your portfolio and risk profile.',
                },
                {
                  icon: Target,
                  title: 'Pattern Recognition',
                  description: 'Identify market trends and patterns before they become obvious to others.',
                },
                {
                  icon: TrendingUp,
                  title: 'Predictive Analytics',
                  description: 'Forecast potential price movements with machine learning models.',
                },
              ].map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex gap-4"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600">
                    <item.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="mb-1 text-lg font-semibold text-white">{item.title}</h3>
                    <p className="text-dark-300">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Visual */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="relative rounded-3xl bg-gradient-to-br from-dark-800 to-dark-900 p-8 shadow-2xl border border-dark-700">
              {/* AI Insight Cards */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                    <Brain className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm text-dark-400">AI Analysis</div>
                    <div className="text-lg font-semibold text-white">Market Insights</div>
                  </div>
                </div>

                {[
                  {
                    type: 'Bullish Signal',
                    crypto: 'BTC',
                    confidence: 87,
                    message: 'Strong buying pressure detected',
                    color: 'success',
                  },
                  {
                    type: 'Opportunity',
                    crypto: 'ETH',
                    confidence: 92,
                    message: 'Breakout pattern forming',
                    color: 'primary',
                  },
                  {
                    type: 'Alert',
                    crypto: 'SOL',
                    confidence: 78,
                    message: 'Resistance level approaching',
                    color: 'warning',
                  },
                ].map((insight, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="rounded-xl bg-dark-950/50 p-4 border border-dark-800"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-2 w-2 rounded-full bg-${insight.color}-400 animate-pulse`}
                        />
                        <span className="text-sm font-semibold text-white">{insight.type}</span>
                        <span className="text-xs text-dark-400">{insight.crypto}</span>
                      </div>
                      <span className="text-xs text-dark-400">{insight.confidence}% confidence</span>
                    </div>
                    <p className="text-sm text-dark-300">{insight.message}</p>
                    <div className="mt-3 h-1.5 w-full rounded-full bg-dark-800 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${insight.confidence}%` }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5 + index * 0.1, duration: 0.8 }}
                        className={`h-full bg-gradient-to-r from-${insight.color}-500 to-${insight.color}-400`}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Floating badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6 }}
                className="absolute -right-4 -bottom-4 rounded-2xl bg-gradient-to-br from-success-500 to-success-600 p-4 shadow-xl"
              >
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">94%</div>
                  <div className="text-xs text-white/80">Accuracy</div>
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
