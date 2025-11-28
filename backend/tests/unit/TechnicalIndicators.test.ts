import { describe, it, expect } from 'vitest'
import {
  calculateRSI,
  calculateSMA,
  detectSMACrossover,
  calculateVolatility,
  analyzeVolume
} from '../../src/services/TechnicalIndicators.js'

describe('TechnicalIndicators - RSI Calculation', () => {
  it('should return 50 with insufficient data', () => {
    expect(calculateRSI([])).toBe(50)
    expect(calculateRSI([100])).toBe(50)
    expect(calculateRSI([100, 101, 102])).toBe(50) // Less than period + 1
  })

  it('should calculate RSI correctly for standard dataset', () => {
    // Sample price data with known RSI result
    const prices = [
      44, 44.34, 44.09, 43.61, 44.33, 44.83, 45.1, 45.42, 
      45.84, 46.08, 45.89, 46.03, 45.61, 46.28, 46.28
    ]
    const rsi = calculateRSI(prices, 14)
    
    // RSI should be around 66-67 for this dataset
    expect(rsi).toBeGreaterThan(60)
    expect(rsi).toBeLessThan(75)
  })

  it('should identify overbought conditions (RSI > 70)', () => {
    // Create upward trending prices
    const prices = Array.from({ length: 20 }, (_, i) => 100 + i * 2)
    const rsi = calculateRSI(prices, 14)
    
    expect(rsi).toBeGreaterThan(70)
  })

  it('should identify oversold conditions (RSI < 30)', () => {
    // Create downward trending prices
    const prices = Array.from({ length: 20 }, (_, i) => 100 - i * 2)
    const rsi = calculateRSI(prices, 14)
    
    expect(rsi).toBeLessThan(30)
  })

  it('should handle NaN values in price array', () => {
    const prices = [100, 101, NaN, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114]
    const rsi = calculateRSI(prices, 14)
    
    expect(rsi).toBeGreaterThan(0)
    expect(rsi).toBeLessThan(100)
    expect(isNaN(rsi)).toBe(false)
  })

  it('should return value between 0 and 100', () => {
    const prices = Array.from({ length: 20 }, () => 100 + Math.random() * 10)
    const rsi = calculateRSI(prices, 14)
    
    expect(rsi).toBeGreaterThanOrEqual(0)
    expect(rsi).toBeLessThanOrEqual(100)
  })

  it('should handle all gains (no losses)', () => {
    const prices = [100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115]
    const rsi = calculateRSI(prices, 14)
    
    expect(rsi).toBe(100)
  })

  it('should handle custom period', () => {
    // Use mixed price movements to avoid all gains
    const prices = [100, 102, 101, 103, 102, 105, 103, 107, 105, 110, 108, 112, 110, 115, 113, 118, 116, 120, 118, 122]
    const rsi7 = calculateRSI(prices, 7)
    const rsi14 = calculateRSI(prices, 14)
    
    expect(rsi7).toBeGreaterThan(0)
    expect(rsi14).toBeGreaterThan(0)
    // Different periods should give different results for mixed data
    expect(Math.abs(rsi7 - rsi14)).toBeGreaterThan(0)
  })
})

describe('TechnicalIndicators - SMA Calculation', () => {
  it('should return 0 with insufficient data', () => {
    expect(calculateSMA([], 5)).toBe(0)
    expect(calculateSMA([100], 5)).toBe(0)
    expect(calculateSMA([100, 101], 5)).toBe(0)
  })

  it('should calculate SMA correctly', () => {
    const prices = [10, 20, 30, 40, 50]
    const sma = calculateSMA(prices, 5)
    
    expect(sma).toBe(30) // (10 + 20 + 30 + 40 + 50) / 5 = 30
  })

  it('should calculate SMA for last N periods', () => {
    const prices = [10, 20, 30, 40, 50, 60]
    const sma = calculateSMA(prices, 3)
    
    expect(sma).toBe(50) // (40 + 50 + 60) / 3 = 50
  })

  it('should handle NaN values', () => {
    const prices = [10, 20, NaN, 30, 40, 50]
    const sma = calculateSMA(prices, 3)
    
    expect(sma).toBeGreaterThan(0)
    expect(isNaN(sma)).toBe(false)
  })

  it('should handle decimal values', () => {
    const prices = [10.5, 20.3, 30.7, 40.2, 50.9]
    const sma = calculateSMA(prices, 5)
    
    expect(sma).toBeCloseTo(30.52, 1)
  })
})

describe('TechnicalIndicators - SMA Crossover Detection', () => {
  it('should return neutral with insufficient data', () => {
    const prices = [100, 101, 102]
    expect(detectSMACrossover(prices, 7, 30)).toBe('neutral')
  })

  it('should detect crossover signals', () => {
    // Test that the function returns valid crossover types
    const prices = Array.from({ length: 50 }, (_, i) => 100 + Math.sin(i / 5) * 10)
    const crossover = detectSMACrossover(prices, 7, 30)
    
    // Should return one of the three valid types
    expect(['bullish', 'bearish', 'neutral']).toContain(crossover)
  })

  it('should return neutral when no crossover occurs', () => {
    const prices = Array.from({ length: 40 }, () => 100) // Flat prices
    expect(detectSMACrossover(prices, 7, 30)).toBe('neutral')
  })

  it('should handle custom periods', () => {
    const prices = Array.from({ length: 50 }, (_, i) => 100 + i)
    const crossover = detectSMACrossover(prices, 5, 20)
    
    expect(['bullish', 'bearish', 'neutral']).toContain(crossover)
  })

  it('should calculate SMAs correctly for crossover detection', () => {
    // Verify that SMAs are being calculated
    const prices = Array.from({ length: 40 }, (_, i) => 100 + i * 0.5)
    const shortSMA = calculateSMA(prices, 7)
    const longSMA = calculateSMA(prices, 30)
    
    // Short SMA should be higher than long SMA in uptrend
    expect(shortSMA).toBeGreaterThan(longSMA)
  })
})

describe('TechnicalIndicators - Volatility Calculation', () => {
  it('should return 0 with insufficient data', () => {
    expect(calculateVolatility([])).toBe(0)
    expect(calculateVolatility([100])).toBe(0)
  })

  it('should calculate volatility for stable prices', () => {
    const prices = Array.from({ length: 10 }, () => 100)
    const volatility = calculateVolatility(prices)
    
    expect(volatility).toBe(0) // No price changes = no volatility
  })

  it('should calculate volatility for varying prices', () => {
    const prices = [100, 105, 95, 110, 90, 115, 85]
    const volatility = calculateVolatility(prices)
    
    expect(volatility).toBeGreaterThan(0)
    expect(volatility).toBeGreaterThan(5) // Should show significant volatility
  })

  it('should show higher volatility for larger price swings', () => {
    const lowVolPrices = [100, 101, 102, 101, 100, 101]
    const highVolPrices = [100, 110, 90, 120, 80, 130]
    
    const lowVol = calculateVolatility(lowVolPrices)
    const highVol = calculateVolatility(highVolPrices)
    
    expect(highVol).toBeGreaterThan(lowVol)
  })

  it('should handle NaN values', () => {
    const prices = [100, 105, NaN, 110, 95]
    const volatility = calculateVolatility(prices)
    
    expect(volatility).toBeGreaterThan(0)
    expect(isNaN(volatility)).toBe(false)
  })

  it('should return percentage value', () => {
    const prices = [100, 102, 98, 103, 97]
    const volatility = calculateVolatility(prices)
    
    // Volatility should be a reasonable percentage
    expect(volatility).toBeGreaterThan(0)
    expect(volatility).toBeLessThan(100)
  })
})

describe('TechnicalIndicators - Volume Analysis', () => {
  it('should detect no spike when volume is normal', () => {
    const result = analyzeVolume(1000, 1000)
    
    expect(result.change).toBe(0)
    expect(result.isSignificant).toBe(false)
    expect(result.trend).toBe('stable')
  })

  it('should detect significant volume spike (>150%)', () => {
    const result = analyzeVolume(2000, 1000) // 200% of average
    
    expect(result.change).toBe(100)
    expect(result.isSignificant).toBe(true)
    expect(result.trend).toBe('increasing')
  })

  it('should detect volume spike at exactly 150% threshold', () => {
    const result = analyzeVolume(1500, 1000)
    
    expect(result.change).toBe(50)
    expect(result.isSignificant).toBe(false) // Must exceed 150%, not equal
  })

  it('should detect volume spike above 150% threshold', () => {
    const result = analyzeVolume(1501, 1000)
    
    expect(result.isSignificant).toBe(true)
  })

  it('should detect increasing trend', () => {
    const result = analyzeVolume(1200, 1000) // 20% increase
    
    expect(result.trend).toBe('increasing')
    expect(result.isSignificant).toBe(false)
  })

  it('should detect decreasing trend', () => {
    const result = analyzeVolume(800, 1000) // 20% decrease
    
    expect(result.trend).toBe('decreasing')
    expect(result.isSignificant).toBe(false)
  })

  it('should detect stable trend', () => {
    const result = analyzeVolume(1050, 1000) // 5% increase
    
    expect(result.trend).toBe('stable')
  })

  it('should handle zero average volume', () => {
    const result = analyzeVolume(1000, 0)
    
    expect(result.change).toBe(0)
    expect(result.isSignificant).toBe(false)
    expect(result.trend).toBe('stable')
  })

  it('should handle NaN values', () => {
    const result = analyzeVolume(NaN, 1000)
    
    expect(result.change).toBe(0)
    expect(result.isSignificant).toBe(false)
    expect(result.trend).toBe('stable')
  })

  it('should calculate correct percentage change', () => {
    const result = analyzeVolume(1500, 1000)
    
    expect(result.change).toBe(50) // 50% increase
  })

  it('should handle large volume spikes', () => {
    const result = analyzeVolume(5000, 1000) // 500% of average
    
    expect(result.change).toBe(400)
    expect(result.isSignificant).toBe(true)
    expect(result.trend).toBe('increasing')
  })
})
