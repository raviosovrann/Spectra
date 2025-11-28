/**
 * AI Engine Service
 * 
 * Combines ML predictions from TimesFM with technical indicator analysis
 * to generate actionable trading insights with clear BUY/SELL/HOLD recommendations.
 */

import { v4 as uuidv4 } from 'uuid'
import { MarketInsight, PricePrediction } from '../ml/types'
import { mlInferenceService } from '../ml/MLInferenceService'
import {
  calculateRSI,
  detectSMACrossover,
  calculateVolatility,
  analyzeVolume,
  calculateMomentum,
  calculateMACD,
  calculateBollingerBands,
  calculateStochastic,
  calculateEMA,
} from './TechnicalIndicators'

export interface MarketData {
  symbol: string
  name: string
  price: number
  priceHistory: number[]
  volume24h: number
  averageVolume: number
  change24h: number
}

// Cache for insights (keyed by symbol_horizon)
const insightsCache = new Map<string, { insight: MarketInsight; timestamp: number }>()
const CACHE_TTL = 60000 // 60 seconds

/**
 * Generate actionable insight for a cryptocurrency
 */
export async function generateInsights(
  symbol: string,
  marketData: MarketData,
  horizon: 1 | 7 | 30 = 7
): Promise<MarketInsight[]> {
  const cacheKey = `${symbol}_${horizon}`
  
  // Check cache
  const cached = insightsCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return [cached.insight]
  }

  // Calculate technical indicators
  const rsi = calculateRSI(marketData.priceHistory, 14)
  const volatility = calculateVolatility(marketData.priceHistory)
  const volumeAnalysis = analyzeVolume(marketData.volume24h, marketData.averageVolume)
  const smaCrossover = detectSMACrossover(marketData.priceHistory, 7, 30)

  // Get ML prediction if we have enough data
  let mlPrediction: PricePrediction | null = null
  if (marketData.priceHistory.length >= 30) {
    mlPrediction = await mlInferenceService.predict(symbol, marketData.priceHistory, horizon)
  }

  // Calculate composite signal
  const signals = calculateCompositeSignal(rsi, smaCrossover, volumeAnalysis, marketData.change24h, mlPrediction)

  // Calculate ALL technical indicators for detailed view (8-10 indicators)
  const momentum = calculateMomentum(marketData.priceHistory)
  const macd = calculateMACD(marketData.priceHistory)
  const bollingerBands = calculateBollingerBands(marketData.priceHistory)
  const stochastic = calculateStochastic(marketData.priceHistory)
  const ema12 = calculateEMA(marketData.priceHistory, 12)
  const ema26 = calculateEMA(marketData.priceHistory, 26)
  
  const rsiSignal: 'overbought' | 'oversold' | 'neutral' = rsi > 70 ? 'overbought' : rsi < 30 ? 'oversold' : 'neutral'
  const momentumSignal: 'bullish' | 'bearish' | 'neutral' = momentum > 2 ? 'bullish' : momentum < -2 ? 'bearish' : 'neutral'

  // Build indicators object with ALL available data (8-10 indicators)
  const indicators = {
    rsi,
    rsiSignal,
    volatility,
    volumeChange: volumeAnalysis.change,
    smaSignal:
      smaCrossover === 'bullish'
        ? ('golden_cross' as const)
        : smaCrossover === 'bearish'
          ? ('death_cross' as const)
          : null,
    momentum,
    momentumSignal,
    macd: {
      line: macd.macdLine,
      signal: macd.signalLine,
      histogram: macd.histogram,
      trend: macd.trend,
    },
    bollingerBands: {
      upper: bollingerBands.upper,
      middle: bollingerBands.middle,
      lower: bollingerBands.lower,
      percentB: bollingerBands.percentB,
      signal: bollingerBands.signal,
    },
    stochastic: {
      k: stochastic.k,
      signal: stochastic.signal,
    },
    ema12,
    ema26,
  }

  // Generate actionable summary with BUY/SELL/HOLD recommendation
  const summary = generateActionableSummary(symbol, signals, rsi, smaCrossover, volumeAnalysis, mlPrediction, marketData.price, horizon)

  // Always include ML prediction - use placeholder if not available
  const mlPredictionData: PricePrediction = mlPrediction || {
    symbol,
    direction: signals.direction === 'bullish' ? 'up' : signals.direction === 'bearish' ? 'down' : 'neutral',
    confidence: Math.round(signals.confidence * 0.8), // Lower confidence for technical-only
    predictedChange: marketData.change24h * (horizon / 7), // Extrapolate from 24h change
    predictedPrice: marketData.price * (1 + (marketData.change24h * (horizon / 7)) / 100),
    forecast: [],
    horizon: `${horizon}d` as '1d' | '7d' | '30d',
    timestamp: Date.now(),
    modelVersion: mlPrediction ? 'timesfm-2.5-200m' : 'technical-analysis-fallback',
  }

  const insight: MarketInsight = {
    id: uuidv4(),
    symbol,
    signal: signals.direction,
    confidence: signals.confidence,
    summary,
    mlPrediction: mlPredictionData,
    indicators,
    timestamp: Date.now(),
  }

  // Cache result
  insightsCache.set(cacheKey, { insight, timestamp: Date.now() })

  return [insight]
}

interface CompositeSignal {
  direction: 'bullish' | 'bearish' | 'neutral'
  confidence: number
  recommendation: 'BUY' | 'SELL' | 'HOLD'
  primaryReason: string
}

/**
 * Calculate composite signal with clear recommendation
 */
function calculateCompositeSignal(
  rsi: number,
  smaCrossover: 'bullish' | 'bearish' | 'neutral',
  volumeAnalysis: { change: number; isSignificant: boolean },
  change24h: number,
  mlPrediction: PricePrediction | null
): CompositeSignal {
  let bullishScore = 0
  let bearishScore = 0
  let primaryReason = ''

  // ML Prediction (weight: 40% if confident)
  if (mlPrediction && mlPrediction.confidence >= 60 && Math.abs(mlPrediction.predictedChange) > 0.5) {
    const mlWeight = 40
    if (mlPrediction.direction === 'up') {
      bullishScore += mlWeight
      primaryReason = 'AI Forecast'
    } else if (mlPrediction.direction === 'down') {
      bearishScore += mlWeight
      primaryReason = 'AI Forecast'
    }
  }

  // RSI (weight: 25%)
  if (rsi > 70) {
    bearishScore += 25
    if (!primaryReason) primaryReason = 'Overbought'
  } else if (rsi < 30) {
    bullishScore += 25
    if (!primaryReason) primaryReason = 'Oversold'
  } else if (rsi > 60) {
    bearishScore += 10
  } else if (rsi < 40) {
    bullishScore += 10
  }

  // SMA Crossover (weight: 20%)
  if (smaCrossover === 'bullish') {
    bullishScore += 20
    if (!primaryReason) primaryReason = 'Golden Cross'
  } else if (smaCrossover === 'bearish') {
    bearishScore += 20
    if (!primaryReason) primaryReason = 'Death Cross'
  }

  // Volume + Price Direction (weight: 15%)
  if (volumeAnalysis.isSignificant) {
    if (change24h > 0) {
      bullishScore += 15
      if (!primaryReason) primaryReason = 'High Volume Buying'
    } else {
      bearishScore += 15
      if (!primaryReason) primaryReason = 'High Volume Selling'
    }
  }

  // 24h momentum (weight: 10%)
  if (change24h > 5) {
    bullishScore += 10
  } else if (change24h < -5) {
    bearishScore += 10
  }

  // Determine direction and recommendation
  const netScore = bullishScore - bearishScore
  let direction: 'bullish' | 'bearish' | 'neutral'
  let recommendation: 'BUY' | 'SELL' | 'HOLD'
  let confidence: number

  if (netScore >= 30) {
    direction = 'bullish'
    recommendation = 'BUY'
    confidence = Math.min(95, 60 + netScore)
  } else if (netScore <= -30) {
    direction = 'bearish'
    recommendation = 'SELL'
    confidence = Math.min(95, 60 + Math.abs(netScore))
  } else if (netScore >= 15) {
    direction = 'bullish'
    recommendation = 'HOLD'
    confidence = 55 + netScore
  } else if (netScore <= -15) {
    direction = 'bearish'
    recommendation = 'HOLD'
    confidence = 55 + Math.abs(netScore)
  } else {
    direction = 'neutral'
    recommendation = 'HOLD'
    confidence = 50
    if (!primaryReason) primaryReason = 'Mixed Signals'
  }

  return { direction, confidence, recommendation, primaryReason }
}

/**
 * Generate actionable summary with clear trading recommendation
 */
function generateActionableSummary(
  symbol: string,
  signals: CompositeSignal,
  rsi: number,
  smaCrossover: 'bullish' | 'bearish' | 'neutral',
  volumeAnalysis: { change: number; isSignificant: boolean },
  mlPrediction: PricePrediction | null,
  currentPrice: number,
  horizon: number
): string {
  const horizonText = horizon === 1 ? 'tomorrow' : horizon === 7 ? 'next 7 days' : 'next 30 days'
  
  // Start with recommendation (no markdown - UI handles styling)
  let summary = `${signals.recommendation}: `

  // Add ML prediction if meaningful
  if (mlPrediction && Math.abs(mlPrediction.predictedChange) > 0.5) {
    const direction = mlPrediction.predictedChange > 0 ? 'rise' : 'fall'
    const targetPrice = currentPrice * (1 + mlPrediction.predictedChange / 100)
    const formattedTarget = targetPrice >= 1 ? targetPrice.toFixed(2) : targetPrice.toFixed(4)
    summary += `AI predicts ${symbol} will ${direction} ${Math.abs(mlPrediction.predictedChange).toFixed(1)}% to $${formattedTarget} by ${horizonText}. `
  } else if (!mlPrediction && currentPrice > 0) {
    // No ML prediction available - explain why
    summary += `Waiting for more market data to generate ML prediction. `
  }

  // Add technical context with actionable language
  const technicalParts: string[] = []
  
  if (rsi > 70) {
    technicalParts.push(`RSI ${rsi.toFixed(0)} (overbought - consider taking profits)`)
  } else if (rsi < 30) {
    technicalParts.push(`RSI ${rsi.toFixed(0)} (oversold - potential buying opportunity)`)
  } else if (rsi > 60) {
    technicalParts.push(`RSI ${rsi.toFixed(0)} (approaching overbought)`)
  } else if (rsi < 40) {
    technicalParts.push(`RSI ${rsi.toFixed(0)} (approaching oversold)`)
  }

  if (smaCrossover === 'bullish') {
    technicalParts.push('Golden Cross forming (bullish trend)')
  } else if (smaCrossover === 'bearish') {
    technicalParts.push('Death Cross forming (bearish trend)')
  }

  if (volumeAnalysis.isSignificant && volumeAnalysis.change > 50) {
    technicalParts.push(`${volumeAnalysis.change.toFixed(0)}% volume spike (high activity)`)
  } else if (volumeAnalysis.change < -30) {
    technicalParts.push(`Volume ${Math.abs(volumeAnalysis.change).toFixed(0)}% below average (low interest)`)
  }

  if (technicalParts.length > 0) {
    summary += technicalParts.join('. ') + '.'
  }

  // If no meaningful signals, provide helpful context
  if (!mlPrediction && technicalParts.length === 0) {
    if (currentPrice === 0) {
      summary += `Waiting for live market data from Coinbase WebSocket.`
    } else {
      summary += `${symbol} showing neutral momentum with RSI at ${rsi.toFixed(0)}. Wait for clearer signals before trading.`
    }
  }

  return summary
}

/**
 * Clear insights cache
 */
export function clearInsightsCache(symbol?: string): void {
  if (symbol) {
    // Clear all horizons for this symbol
    for (const key of insightsCache.keys()) {
      if (key.startsWith(symbol)) {
        insightsCache.delete(key)
      }
    }
  } else {
    insightsCache.clear()
  }
}

/**
 * Check if ML service is available
 */
export async function checkMLServiceHealth(): Promise<boolean> {
  return mlInferenceService.checkHealth()
}
