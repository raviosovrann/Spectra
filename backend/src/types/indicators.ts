/**
 * Technical Indicators Type Definitions
 * 
 * This module defines types for technical analysis indicators used in the AI Engine.
 */

/**
 * Volume analysis result
 */
export interface VolumeAnalysis {
  change: number; // Percentage change from average
  isSignificant: boolean; // True if volume spike exceeds 150% threshold
  trend: 'increasing' | 'decreasing' | 'stable';
}

/**
 * SMA crossover signal types
 */
export type SMACrossover = 'bullish' | 'bearish' | 'neutral';

/**
 * Generic technical indicator result
 */
export interface TechnicalIndicator {
  name: string;
  value: number;
  timestamp: number;
}

/**
 * RSI indicator result
 */
export interface RSIIndicator extends TechnicalIndicator {
  name: 'RSI';
  period: number;
  overbought: boolean; // True if RSI > 70
  oversold: boolean; // True if RSI < 30
}

/**
 * SMA indicator result
 */
export interface SMAIndicator extends TechnicalIndicator {
  name: 'SMA';
  period: number;
}

/**
 * Volatility indicator result
 */
export interface VolatilityIndicator extends TechnicalIndicator {
  name: 'Volatility';
  level: 'low' | 'medium' | 'high';
}


/**
 * MACD indicator result
 */
export interface MACDIndicator {
  macdLine: number;
  signalLine: number;
  histogram: number;
  trend: 'bullish' | 'bearish' | 'neutral';
}

/**
 * Bollinger Bands result
 */
export interface BollingerBandsIndicator {
  upper: number;
  middle: number;
  lower: number;
  bandwidth: number;
  percentB: number;
  signal: 'overbought' | 'oversold' | 'neutral';
}

/**
 * Stochastic Oscillator result
 */
export interface StochasticIndicator {
  k: number;
  signal: 'overbought' | 'oversold' | 'neutral';
}

/**
 * Comprehensive technical analysis result
 */
export interface ComprehensiveTechnicalAnalysis {
  rsi: number;
  rsiSignal: 'overbought' | 'oversold' | 'neutral';
  sma7: number;
  sma30: number;
  smaCrossover: SMACrossover;
  ema12: number;
  ema26: number;
  macd: MACDIndicator;
  bollingerBands: BollingerBandsIndicator;
  momentum: number;
  momentumSignal: 'bullish' | 'bearish' | 'neutral';
  stochastic: StochasticIndicator;
  volatility: number;
  volumeAnalysis: VolumeAnalysis;
}
