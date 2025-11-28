/**
 * ML Configuration
 */

export const ML_CONFIG = {
  serviceUrl: process.env.ML_SERVICE_URL || 'http://localhost:5001',
  healthCheckInterval: 30000, // 30 seconds
  predictionTimeout: 30000, // 30 seconds
  batchTimeout: 60000, // 60 seconds
  minDataPoints: 30, // minimum price history needed
  cacheTimeout: 60000, // 1 minute cache
};

// Supported symbols (updated Nov 2025 - MATIC delisted, using POL)
export const SUPPORTED_SYMBOLS = [
  'BTC', 'ETH', 'SOL', 'ADA', 'DOGE', 'XRP', 'DOT', 'AVAX', 'POL', 'LINK',
  'UNI', 'ATOM', 'LTC', 'BCH', 'ALGO', 'XLM', 'AAVE', 'NEAR', 'APT', 'ARB'
];
