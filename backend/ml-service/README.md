# TimesFM ML Service

Python service using Google's TimesFM model for cryptocurrency price forecasting.

## Model

- **Model**: [google/timesfm-2.5-200m-pytorch](https://huggingface.co/google/timesfm-2.5-200m-pytorch)
- **Type**: Time Series Foundation Model (ICML 2024)

## Quick Start

```bash
# First time setup (downloads model ~500MB)
./setup.sh

# Start in development mode
./setup.sh start

# Start in production mode (gunicorn)
./setup.sh prod
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/predict` | POST | Single symbol prediction |
| `/batch-predict` | POST | Multiple symbols |

### Predict Request
```json
{
  "symbol": "BTC",
  "prices": [100, 101, 102, ...],
  "horizon": 7
}
```

## Environment Variables

- `ML_SERVICE_PORT`: Port (default: 5001)

## Integration

Set in backend `.env`:
```
ML_SERVICE_URL=http://localhost:5001
```
