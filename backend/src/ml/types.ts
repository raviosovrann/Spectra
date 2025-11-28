/**
 * ML Types
 * Simple type definitions for ML predictions.
 */

export interface PricePrediction {
  symbol: string;
  direction: 'up' | 'down' | 'neutral';
  confidence: number; // 0-100
  predictedChange: number; // percentage
  predictedPrice: number;
  forecast: number[]; // array of predicted prices
  horizon: '1d' | '7d' | '30d';
  timestamp: number;
  modelVersion: string;
}

export interface MarketInsight {
  id: string;
  symbol: string;
  signal: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  summary: string;
  mlPrediction?: PricePrediction;
  indicators: {
    rsi?: number;
    rsiSignal?: 'overbought' | 'oversold' | 'neutral';
    volatility?: number;
    volumeChange?: number;
    smaSignal?: 'golden_cross' | 'death_cross' | null;
    macd?: {
      line: number;
      signal: number;
      histogram: number;
      trend: 'bullish' | 'bearish' | 'neutral';
    };
    bollingerBands?: {
      upper: number;
      middle: number;
      lower: number;
      percentB: number;
      signal: 'overbought' | 'oversold' | 'neutral';
    };
    momentum?: number;
    momentumSignal?: 'bullish' | 'bearish' | 'neutral';
    stochastic?: {
      k: number;
      signal: 'overbought' | 'oversold' | 'neutral';
    };
    ema12?: number;
    ema26?: number;
  };
  timestamp: number;
}
