/**
 * ML Inference Service
 * 
 * Calls the Python TimesFM service for ML-based price predictions.
 * Falls back to technical analysis if ML service is unavailable.
 */

import { PricePrediction } from './types';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

interface MLHealthResponse {
  status: string;
}

interface MLPredictResponse {
  symbol: string;
  direction: 'up' | 'down' | 'neutral';
  confidence: number;
  predicted_change: number;
  predicted_price: number;
  forecast: number[];
  horizon: number;
  model_version?: string;
}

interface MLBatchResponse {
  predictions: MLPredictResponse[];
}

export interface MLPredictionRequest {
  symbol: string;
  prices: number[];
  horizon: number;
}

export class MLInferenceService {
  private isAvailable: boolean = false;
  private lastHealthCheck: number = 0;
  private healthCheckInterval: number = 30000; // 30 seconds

  /**
   * Check if ML service is available
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${ML_SERVICE_URL}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        const data = await response.json() as MLHealthResponse;
        this.isAvailable = data.status === 'ok';
        this.lastHealthCheck = Date.now();
        return this.isAvailable;
      }
      
      this.isAvailable = false;
      return false;
    } catch {
      this.isAvailable = false;
      return false;
    }
  }

  /**
   * Get prediction from ML service
   */
  async predict(
    symbol: string,
    prices: number[],
    horizon: 1 | 7 | 30 = 7
  ): Promise<PricePrediction | null> {
    // Check health periodically
    if (Date.now() - this.lastHealthCheck > this.healthCheckInterval) {
      await this.checkHealth();
    }

    if (!this.isAvailable) {
      // Don't log every time - just skip silently
      return null;
    }

    if (prices.length < 30) {
      // Don't log - insufficient data is expected for new coins
      return null;
    }

    try {
      const response = await fetch(`${ML_SERVICE_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, prices, horizon }),
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });

      if (!response.ok) {
        // Only log actual errors, not expected failures
        if (response.status >= 500) {
          console.error(`ML prediction failed: ${response.status}`);
        }
        return null;
      }

      const data = await response.json() as MLPredictResponse;
      
      return {
        symbol: data.symbol,
        direction: data.direction,
        confidence: data.confidence,
        predictedChange: data.predicted_change,
        predictedPrice: data.predicted_price,
        forecast: data.forecast,
        horizon: `${horizon}d` as '1d' | '7d' | '30d',
        timestamp: Date.now(),
        modelVersion: data.model_version || 'timesfm-2.5-200m'
      };
    } catch (error) {
      console.error('ML prediction error:', error);
      return null;
    }
  }

  /**
   * Batch predict for multiple symbols
   */
  async batchPredict(
    requests: MLPredictionRequest[]
  ): Promise<Map<string, PricePrediction | null>> {
    const results = new Map<string, PricePrediction | null>();

    if (!this.isAvailable) {
      await this.checkHealth();
    }

    if (!this.isAvailable) {
      requests.forEach(req => results.set(req.symbol, null));
      return results;
    }

    try {
      const response = await fetch(`${ML_SERVICE_URL}/batch-predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests }),
        signal: AbortSignal.timeout(60000) // 60 second timeout for batch
      });

      if (!response.ok) {
        requests.forEach(req => results.set(req.symbol, null));
        return results;
      }

      const data = await response.json() as MLBatchResponse;
      
      for (const pred of data.predictions) {
        results.set(pred.symbol, {
          symbol: pred.symbol,
          direction: pred.direction,
          confidence: pred.confidence,
          predictedChange: pred.predicted_change,
          predictedPrice: pred.predicted_price,
          forecast: pred.forecast,
          horizon: `${pred.horizon}d` as '1d' | '7d' | '30d',
          timestamp: Date.now(),
          modelVersion: 'timesfm-2.5-200m'
        });
      }

      // Set null for any missing symbols
      requests.forEach(req => {
        if (!results.has(req.symbol)) {
          results.set(req.symbol, null);
        }
      });

      return results;
    } catch (error) {
      console.error('Batch prediction error:', error);
      requests.forEach(req => results.set(req.symbol, null));
      return results;
    }
  }

  /**
   * Check if service is ready
   */
  isReady(): boolean {
    return this.isAvailable;
  }
}

// Export singleton
export const mlInferenceService = new MLInferenceService();
