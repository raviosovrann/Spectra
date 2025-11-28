/**
 * Technical Indicators Service
 * 
 * This service provides calculation functions for various technical indicators
 * used in cryptocurrency market analysis.
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */

import { VolumeAnalysis, SMACrossover } from '../types/indicators';

/**
 * Calculate Relative Strength Index (RSI)
 * 
 * RSI is a momentum indicator that measures the magnitude of recent price changes
 * to evaluate overbought or oversold conditions.
 * 
 * Formula: RSI = 100 - (100 / (1 + RS))
 * where RS = Average Gain / Average Loss
 * 
 * @param prices - Array of price values (oldest to newest)
 * @param period - Number of periods to calculate RSI (default: 14)
 * @returns RSI value between 0-100, or 50 if insufficient data
 * 
 * Requirement 6.1: Calculate 14-period RSI using standard formula
 */
export function calculateRSI(prices: number[], period: number = 14): number {
  // Handle edge cases
  if (!prices || prices.length === 0) {
    return 50; // Neutral value
  }

  if (prices.length < period + 1) {
    return 50; // Insufficient data for calculation
  }

  // Calculate price changes
  const changes: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    if (isNaN(change)) {
      continue; // Skip NaN values
    }
    changes.push(change);
  }

  if (changes.length < period) {
    return 50; // Insufficient valid data
  }

  // Separate gains and losses
  const gains: number[] = changes.map(change => change > 0 ? change : 0);
  const losses: number[] = changes.map(change => change < 0 ? Math.abs(change) : 0);

  // Calculate initial average gain and loss
  let avgGain = gains.slice(0, period).reduce((sum, gain) => sum + gain, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((sum, loss) => sum + loss, 0) / period;

  // Calculate smoothed averages for remaining periods
  for (let i = period; i < changes.length; i++) {
    avgGain = ((avgGain * (period - 1)) + gains[i]) / period;
    avgLoss = ((avgLoss * (period - 1)) + losses[i]) / period;
  }

  // Handle division by zero
  if (avgLoss === 0) {
    return avgGain === 0 ? 50 : 100; // All gains or no movement
  }

  // Calculate RS and RSI
  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));

  // Ensure result is within valid range
  if (isNaN(rsi)) {
    return 50;
  }

  return Math.max(0, Math.min(100, rsi));
}

/**
 * Calculate Simple Moving Average (SMA)
 * 
 * SMA is the average price over a specified number of periods.
 * 
 * @param prices - Array of price values (oldest to newest)
 * @param period - Number of periods to average
 * @returns SMA value, or 0 if insufficient data
 * 
 * Requirement 6.4: Calculate SMA for crossover detection
 */
export function calculateSMA(prices: number[], period: number): number {
  // Handle edge cases
  if (!prices || prices.length === 0) {
    return 0;
  }

  if (prices.length < period) {
    return 0; // Insufficient data
  }

  // Filter out NaN values
  const validPrices = prices.filter(price => !isNaN(price));

  if (validPrices.length < period) {
    return 0;
  }

  // Calculate average of last 'period' prices
  const recentPrices = validPrices.slice(-period);
  const sum = recentPrices.reduce((acc, price) => acc + price, 0);
  const sma = sum / period;

  return isNaN(sma) ? 0 : sma;
}

/**
 * Detect SMA Crossover (Golden Cross / Death Cross)
 * 
 * A golden cross occurs when a short-term SMA crosses above a long-term SMA (bullish).
 * A death cross occurs when a short-term SMA crosses below a long-term SMA (bearish).
 * 
 * @param prices - Array of price values (oldest to newest)
 * @param shortPeriod - Short-term SMA period (default: 7)
 * @param longPeriod - Long-term SMA period (default: 30)
 * @returns 'bullish' for golden cross, 'bearish' for death cross, 'neutral' otherwise
 * 
 * Requirement 6.4: Detect SMA crossover events
 */
export function detectSMACrossover(
  prices: number[],
  shortPeriod: number = 7,
  longPeriod: number = 30
): SMACrossover {
  // Handle edge cases
  if (!prices || prices.length < longPeriod + 1) {
    return 'neutral'; // Insufficient data
  }

  // Calculate current SMAs
  const currentShortSMA = calculateSMA(prices, shortPeriod);
  const currentLongSMA = calculateSMA(prices, longPeriod);

  // Calculate previous SMAs (one period back)
  const previousPrices = prices.slice(0, -1);
  const previousShortSMA = calculateSMA(previousPrices, shortPeriod);
  const previousLongSMA = calculateSMA(previousPrices, longPeriod);

  // Check for invalid calculations
  if (currentShortSMA === 0 || currentLongSMA === 0 || 
      previousShortSMA === 0 || previousLongSMA === 0) {
    return 'neutral';
  }

  // Detect crossover
  const wasBelowBefore = previousShortSMA < previousLongSMA;
  const isAboveNow = currentShortSMA > currentLongSMA;
  const wasAboveBefore = previousShortSMA > previousLongSMA;
  const isBelowNow = currentShortSMA < currentLongSMA;

  // Golden cross: short SMA crosses above long SMA
  if (wasBelowBefore && isAboveNow) {
    return 'bullish';
  }

  // Death cross: short SMA crosses below long SMA
  if (wasAboveBefore && isBelowNow) {
    return 'bearish';
  }

  return 'neutral';
}

/**
 * Calculate Volatility
 * 
 * Volatility is measured as the standard deviation of returns (price changes).
 * Higher volatility indicates larger price swings.
 * 
 * @param prices - Array of price values (oldest to newest)
 * @returns Volatility as a percentage, or 0 if insufficient data
 * 
 * Requirement 6.2: Calculate volatility using standard deviation of returns
 */
export function calculateVolatility(prices: number[]): number {
  // Handle edge cases
  if (!prices || prices.length < 2) {
    return 0; // Need at least 2 prices to calculate returns
  }

  // Filter out NaN values
  const validPrices = prices.filter(price => !isNaN(price));

  if (validPrices.length < 2) {
    return 0;
  }

  // Calculate returns (percentage changes)
  const returns: number[] = [];
  for (let i = 1; i < validPrices.length; i++) {
    const returnValue = (validPrices[i] - validPrices[i - 1]) / validPrices[i - 1];
    if (!isNaN(returnValue) && isFinite(returnValue)) {
      returns.push(returnValue);
    }
  }

  if (returns.length === 0) {
    return 0;
  }

  // Calculate mean return
  const meanReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;

  // Calculate variance
  const squaredDiffs = returns.map(ret => Math.pow(ret - meanReturn, 2));
  const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / returns.length;

  // Calculate standard deviation (volatility)
  const volatility = Math.sqrt(variance);

  // Convert to percentage
  const volatilityPercent = volatility * 100;

  return isNaN(volatilityPercent) ? 0 : volatilityPercent;
}

/**
 * Analyze Volume
 * 
 * Compares current volume to average volume to detect significant spikes.
 * A volume spike is considered significant if it exceeds 150% of the average.
 * 
 * @param currentVolume - Current trading volume
 * @param averageVolume - Average trading volume over a period
 * @returns VolumeAnalysis object with change percentage, significance flag, and trend
 * 
 * Requirement 6.3: Detect volume spikes exceeding 150% threshold
 */
export function analyzeVolume(currentVolume: number, averageVolume: number): VolumeAnalysis {
  // Handle edge cases
  if (isNaN(currentVolume) || isNaN(averageVolume) || averageVolume === 0) {
    return {
      change: 0,
      isSignificant: false,
      trend: 'stable'
    };
  }

  // Calculate percentage change from average
  const change = ((currentVolume - averageVolume) / averageVolume) * 100;

  // Determine if spike is significant (>150% of average)
  const isSignificant = currentVolume > (averageVolume * 1.5);

  // Determine trend
  let trend: 'increasing' | 'decreasing' | 'stable';
  if (change > 10) {
    trend = 'increasing';
  } else if (change < -10) {
    trend = 'decreasing';
  } else {
    trend = 'stable';
  }

  return {
    change: isNaN(change) ? 0 : change,
    isSignificant,
    trend
  };
}


/**
 * Calculate Exponential Moving Average (EMA)
 * 
 * EMA gives more weight to recent prices, making it more responsive to new information.
 * 
 * @param prices - Array of price values (oldest to newest)
 * @param period - Number of periods for EMA
 * @returns EMA value, or 0 if insufficient data
 */
export function calculateEMA(prices: number[], period: number): number {
  if (!prices || prices.length < period) {
    return 0;
  }

  const validPrices = prices.filter(price => !isNaN(price));
  if (validPrices.length < period) {
    return 0;
  }

  const multiplier = 2 / (period + 1);
  
  // Start with SMA for the first EMA value
  let ema = validPrices.slice(0, period).reduce((sum, p) => sum + p, 0) / period;
  
  // Calculate EMA for remaining prices
  for (let i = period; i < validPrices.length; i++) {
    ema = (validPrices[i] - ema) * multiplier + ema;
  }

  return isNaN(ema) ? 0 : ema;
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 * 
 * MACD is a trend-following momentum indicator showing the relationship
 * between two EMAs of a security's price.
 * 
 * @param prices - Array of price values (oldest to newest)
 * @param fastPeriod - Fast EMA period (default: 12)
 * @param slowPeriod - Slow EMA period (default: 26)
 * @param signalPeriod - Signal line period (default: 9)
 * @returns MACD object with line, signal, and histogram values
 */
export interface MACDResult {
  macdLine: number;
  signalLine: number;
  histogram: number;
  trend: 'bullish' | 'bearish' | 'neutral';
}

export function calculateMACD(
  prices: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): MACDResult {
  if (!prices || prices.length < slowPeriod + signalPeriod) {
    return { macdLine: 0, signalLine: 0, histogram: 0, trend: 'neutral' };
  }

  // Calculate MACD line (fast EMA - slow EMA)
  const fastEMA = calculateEMA(prices, fastPeriod);
  const slowEMA = calculateEMA(prices, slowPeriod);
  const macdLine = fastEMA - slowEMA;

  // Calculate MACD values for signal line calculation
  const macdValues: number[] = [];
  for (let i = slowPeriod; i <= prices.length; i++) {
    const slice = prices.slice(0, i);
    const fast = calculateEMA(slice, fastPeriod);
    const slow = calculateEMA(slice, slowPeriod);
    macdValues.push(fast - slow);
  }

  // Calculate signal line (EMA of MACD line)
  const signalLine = macdValues.length >= signalPeriod 
    ? calculateEMA(macdValues, signalPeriod) 
    : 0;

  // Calculate histogram
  const histogram = macdLine - signalLine;

  // Determine trend
  let trend: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  if (histogram > 0 && macdLine > signalLine) {
    trend = 'bullish';
  } else if (histogram < 0 && macdLine < signalLine) {
    trend = 'bearish';
  }

  return { macdLine, signalLine, histogram, trend };
}

/**
 * Calculate Bollinger Bands
 * 
 * Bollinger Bands consist of a middle band (SMA) and upper/lower bands
 * that are standard deviations away from the middle band.
 * 
 * @param prices - Array of price values (oldest to newest)
 * @param period - Number of periods for SMA (default: 20)
 * @param stdDev - Number of standard deviations (default: 2)
 * @returns Bollinger Bands object with upper, middle, lower bands and position
 */
export interface BollingerBandsResult {
  upper: number;
  middle: number;
  lower: number;
  bandwidth: number;
  percentB: number; // Position within bands (0-1, can exceed)
  signal: 'overbought' | 'oversold' | 'neutral';
}

export function calculateBollingerBands(
  prices: number[],
  period: number = 20,
  stdDev: number = 2
): BollingerBandsResult {
  if (!prices || prices.length < period) {
    return { upper: 0, middle: 0, lower: 0, bandwidth: 0, percentB: 0.5, signal: 'neutral' };
  }

  const validPrices = prices.filter(price => !isNaN(price));
  if (validPrices.length < period) {
    return { upper: 0, middle: 0, lower: 0, bandwidth: 0, percentB: 0.5, signal: 'neutral' };
  }

  // Calculate middle band (SMA)
  const recentPrices = validPrices.slice(-period);
  const middle = recentPrices.reduce((sum, p) => sum + p, 0) / period;

  // Calculate standard deviation
  const squaredDiffs = recentPrices.map(p => Math.pow(p - middle, 2));
  const variance = squaredDiffs.reduce((sum, d) => sum + d, 0) / period;
  const standardDeviation = Math.sqrt(variance);

  // Calculate bands
  const upper = middle + (stdDev * standardDeviation);
  const lower = middle - (stdDev * standardDeviation);
  const bandwidth = ((upper - lower) / middle) * 100;

  // Calculate %B (position within bands)
  const currentPrice = validPrices[validPrices.length - 1];
  const percentB = (upper - lower) !== 0 ? (currentPrice - lower) / (upper - lower) : 0.5;

  // Determine signal
  let signal: 'overbought' | 'oversold' | 'neutral' = 'neutral';
  if (percentB > 1) {
    signal = 'overbought';
  } else if (percentB < 0) {
    signal = 'oversold';
  }

  return { upper, middle, lower, bandwidth, percentB, signal };
}

/**
 * Calculate Momentum
 * 
 * Momentum measures the rate of change in price over a specified period.
 * 
 * @param prices - Array of price values (oldest to newest)
 * @param period - Number of periods to look back (default: 10)
 * @returns Momentum value as percentage change
 */
export function calculateMomentum(prices: number[], period: number = 10): number {
  if (!prices || prices.length < period + 1) {
    return 0;
  }

  const validPrices = prices.filter(price => !isNaN(price));
  if (validPrices.length < period + 1) {
    return 0;
  }

  const currentPrice = validPrices[validPrices.length - 1];
  const pastPrice = validPrices[validPrices.length - 1 - period];

  if (pastPrice === 0) {
    return 0;
  }

  const momentum = ((currentPrice - pastPrice) / pastPrice) * 100;
  return isNaN(momentum) ? 0 : momentum;
}

/**
 * Calculate Stochastic Oscillator
 * 
 * The Stochastic Oscillator compares a closing price to its price range over a period.
 * 
 * @param prices - Array of price values (oldest to newest)
 * @param period - Number of periods (default: 14)
 * @returns Stochastic K value (0-100) and signal
 */
export interface StochasticResult {
  k: number;
  signal: 'overbought' | 'oversold' | 'neutral';
}

export function calculateStochastic(prices: number[], period: number = 14): StochasticResult {
  if (!prices || prices.length < period) {
    return { k: 50, signal: 'neutral' };
  }

  const validPrices = prices.filter(price => !isNaN(price));
  if (validPrices.length < period) {
    return { k: 50, signal: 'neutral' };
  }

  const recentPrices = validPrices.slice(-period);
  const currentPrice = validPrices[validPrices.length - 1];
  const highestHigh = Math.max(...recentPrices);
  const lowestLow = Math.min(...recentPrices);

  if (highestHigh === lowestLow) {
    return { k: 50, signal: 'neutral' };
  }

  const k = ((currentPrice - lowestLow) / (highestHigh - lowestLow)) * 100;

  let signal: 'overbought' | 'oversold' | 'neutral' = 'neutral';
  if (k > 80) {
    signal = 'overbought';
  } else if (k < 20) {
    signal = 'oversold';
  }

  return { k: isNaN(k) ? 50 : k, signal };
}

/**
 * Calculate Average True Range (ATR)
 * 
 * ATR measures market volatility by decomposing the entire range of an asset price.
 * 
 * @param highs - Array of high prices
 * @param lows - Array of low prices
 * @param closes - Array of close prices
 * @param period - Number of periods (default: 14)
 * @returns ATR value
 */
export function calculateATR(
  highs: number[],
  lows: number[],
  closes: number[],
  period: number = 14
): number {
  if (!highs || !lows || !closes || 
      highs.length < period + 1 || 
      lows.length < period + 1 || 
      closes.length < period + 1) {
    return 0;
  }

  const trueRanges: number[] = [];
  
  for (let i = 1; i < closes.length; i++) {
    const high = highs[i];
    const low = lows[i];
    const prevClose = closes[i - 1];
    
    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    
    trueRanges.push(tr);
  }

  if (trueRanges.length < period) {
    return 0;
  }

  // Calculate ATR using EMA of true ranges
  const atr = calculateEMA(trueRanges, period);
  return isNaN(atr) ? 0 : atr;
}

/**
 * Get comprehensive technical analysis for a symbol
 * 
 * @param prices - Array of price values
 * @param volume - Current volume
 * @param avgVolume - Average volume
 * @returns Complete technical analysis object
 */
export interface TechnicalAnalysis {
  rsi: number;
  rsiSignal: 'overbought' | 'oversold' | 'neutral';
  sma7: number;
  sma30: number;
  smaCrossover: SMACrossover;
  ema12: number;
  ema26: number;
  macd: MACDResult;
  bollingerBands: BollingerBandsResult;
  momentum: number;
  momentumSignal: 'bullish' | 'bearish' | 'neutral';
  stochastic: StochasticResult;
  volatility: number;
  volumeAnalysis: VolumeAnalysis;
}

export function getComprehensiveTechnicalAnalysis(
  prices: number[],
  volume: number,
  avgVolume: number
): TechnicalAnalysis {
  const rsi = calculateRSI(prices, 14);
  const rsiSignal: 'overbought' | 'oversold' | 'neutral' = 
    rsi > 70 ? 'overbought' : rsi < 30 ? 'oversold' : 'neutral';

  const momentum = calculateMomentum(prices, 10);
  const momentumSignal: 'bullish' | 'bearish' | 'neutral' = 
    momentum > 5 ? 'bullish' : momentum < -5 ? 'bearish' : 'neutral';

  return {
    rsi,
    rsiSignal,
    sma7: calculateSMA(prices, 7),
    sma30: calculateSMA(prices, 30),
    smaCrossover: detectSMACrossover(prices, 7, 30),
    ema12: calculateEMA(prices, 12),
    ema26: calculateEMA(prices, 26),
    macd: calculateMACD(prices),
    bollingerBands: calculateBollingerBands(prices),
    momentum,
    momentumSignal,
    stochastic: calculateStochastic(prices),
    volatility: calculateVolatility(prices),
    volumeAnalysis: analyzeVolume(volume, avgVolume)
  };
}
