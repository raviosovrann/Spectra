import Hero from './landing/Hero'
import Features from './landing/Features'
import CryptoShowcase from './landing/CryptoShowcase'
import AIInsights from './landing/AIInsights'
import CallToAction from './landing/CallToAction'
import Footer from './landing/Footer'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-950 via-dark-900 to-dark-950">
      <Hero />
      <Features />
      <CryptoShowcase />
      <AIInsights />
      <CallToAction />
      <Footer />
    </div>
  )
}
