"""
TimesFM ML Service
A Flask server that provides price predictions using Google's TimesFM model.

This service runs locally and is called by the Node.js backend for ML predictions.
"""

import os
import json
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import logging

# Configure logging - reduce verbosity
logging.basicConfig(
    level=logging.WARNING,  # Only show warnings and errors
    format='%(asctime)s - %(levelname)s - %(message)s'
)
# Reduce werkzeug logging
logging.getLogger('werkzeug').setLevel(logging.WARNING)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Global model instance
model = None
forecast_config = None

def load_model():
    """Load the TimesFM model on startup."""
    global model, forecast_config
    
    try:
        import timesfm
        
        logger.info("Loading TimesFM model...")
        model = timesfm.TimesFM_2p5_200M_torch.from_pretrained(
            "google/timesfm-2.5-200m-pytorch",
            torch_compile=True
        )
        
        # Configure the model for forecasting
        forecast_config = timesfm.ForecastConfig(
            max_context=1024,
            max_horizon=256,
            normalize_inputs=True,
            use_continuous_quantile_head=True,
            force_flip_invariance=True,
            infer_is_positive=True,
            fix_quantile_crossing=True,
        )
        model.compile(forecast_config)
        
        logger.info("✅ TimesFM model loaded successfully!")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to load TimesFM model: {e}")
        return False

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({
        'status': 'ok' if model is not None else 'model_not_loaded',
        'model': 'timesfm-2.5-200m-pytorch',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/predict', methods=['POST'])
def predict():
    """
    Generate price prediction for a cryptocurrency.
    
    Request body:
    {
        "symbol": "BTC",
        "prices": [100, 101, 102, ...],  # Historical prices (at least 30 data points)
        "horizon": 7  # Number of periods to forecast (1, 7, or 30)
    }
    
    Response:
    {
        "symbol": "BTC",
        "direction": "up" | "down" | "neutral",
        "confidence": 75,
        "predicted_change": 2.5,
        "forecast": [103, 104, ...],
        "quantiles": {...}
    }
    """
    if model is None:
        return jsonify({'error': 'Model not loaded'}), 503
    
    try:
        data = request.get_json()
        
        # Validate input
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        symbol = data.get('symbol', 'UNKNOWN')
        prices = data.get('prices', [])
        horizon = data.get('horizon', 7)
        
        if len(prices) < 30:
            return jsonify({'error': 'Need at least 30 price data points'}), 400
        
        if horizon not in [1, 7, 30]:
            horizon = 7
        
        # Convert to numpy array
        price_array = np.array(prices, dtype=np.float32)
        
        # Run prediction
        point_forecast, quantile_forecast = model.forecast(
            horizon=horizon,
            inputs=[price_array]
        )
        
        # Extract results
        forecast = point_forecast[0].tolist()
        quantiles = quantile_forecast[0].tolist() if quantile_forecast is not None else None
        
        # Calculate direction and confidence
        last_price = prices[-1]
        predicted_price = forecast[-1] if forecast else last_price
        price_change = ((predicted_price - last_price) / last_price) * 100
        
        # Determine direction
        if price_change > 1:
            direction = 'up'
        elif price_change < -1:
            direction = 'down'
        else:
            direction = 'neutral'
        
        # Calculate confidence based on quantile spread
        confidence = calculate_confidence(quantiles, price_change)
        
        return jsonify({
            'symbol': symbol,
            'direction': direction,
            'confidence': confidence,
            'predicted_change': round(price_change, 2),
            'predicted_price': round(predicted_price, 2),
            'forecast': [round(f, 2) for f in forecast],
            'quantiles': quantiles,
            'horizon': horizon,
            'model_version': 'timesfm-2.5-200m',
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/batch-predict', methods=['POST'])
def batch_predict():
    """
    Generate predictions for multiple cryptocurrencies.
    
    Request body:
    {
        "requests": [
            {"symbol": "BTC", "prices": [...], "horizon": 7},
            {"symbol": "ETH", "prices": [...], "horizon": 7}
        ]
    }
    """
    if model is None:
        return jsonify({'error': 'Model not loaded'}), 503
    
    try:
        data = request.get_json()
        requests_list = data.get('requests', [])
        
        if not requests_list:
            return jsonify({'error': 'No requests provided'}), 400
        
        # Prepare batch inputs
        symbols = []
        inputs = []
        horizons = []
        
        for req in requests_list:
            prices = req.get('prices', [])
            if len(prices) >= 30:
                symbols.append(req.get('symbol', 'UNKNOWN'))
                inputs.append(np.array(prices, dtype=np.float32))
                horizons.append(req.get('horizon', 7))
        
        if not inputs:
            return jsonify({'error': 'No valid inputs (need at least 30 prices each)'}), 400
        
        # Use max horizon for batch prediction
        max_horizon = max(horizons)
        
        # Run batch prediction
        point_forecasts, quantile_forecasts = model.forecast(
            horizon=max_horizon,
            inputs=inputs
        )
        
        # Process results
        results = []
        for i, symbol in enumerate(symbols):
            horizon = horizons[i]
            forecast = point_forecasts[i][:horizon].tolist()
            quantiles = quantile_forecasts[i][:horizon].tolist() if quantile_forecasts is not None else None
            
            last_price = inputs[i][-1]
            predicted_price = forecast[-1] if forecast else last_price
            price_change = ((predicted_price - last_price) / last_price) * 100
            
            if price_change > 1:
                direction = 'up'
            elif price_change < -1:
                direction = 'down'
            else:
                direction = 'neutral'
            
            confidence = calculate_confidence(quantiles, price_change)
            
            results.append({
                'symbol': symbol,
                'direction': direction,
                'confidence': confidence,
                'predicted_change': round(price_change, 2),
                'predicted_price': round(float(predicted_price), 2),
                'forecast': [round(f, 2) for f in forecast],
                'horizon': horizon
            })
        
        return jsonify({
            'predictions': results,
            'model_version': 'timesfm-2.5-200m',
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Batch prediction error: {e}")
        return jsonify({'error': str(e)}), 500

def calculate_confidence(quantiles, price_change):
    """
    Calculate confidence score based on quantile spread and price change magnitude.
    """
    if quantiles is None:
        # Without quantiles, use price change magnitude
        return min(90, max(40, 50 + abs(price_change) * 5))
    
    try:
        # Use quantile spread to estimate confidence
        # Narrower spread = higher confidence
        last_quantiles = quantiles[-1] if isinstance(quantiles[-1], list) else quantiles
        if len(last_quantiles) >= 2:
            spread = abs(last_quantiles[-1] - last_quantiles[0])
            mean_val = abs(np.mean(last_quantiles))
            if mean_val > 0:
                relative_spread = spread / mean_val
                # Lower spread = higher confidence
                confidence = max(40, min(95, 90 - relative_spread * 50))
                return int(confidence)
    except:
        pass
    
    return min(90, max(40, 50 + abs(price_change) * 5))

if __name__ == '__main__':
    # Load model on startup
    if load_model():
        port = int(os.environ.get('ML_SERVICE_PORT', 5001))
        logger.info(f"Starting ML service on port {port}...")
        app.run(host='0.0.0.0', port=port, debug=False)
    else:
        logger.error("Failed to start ML service - model could not be loaded")
        exit(1)
