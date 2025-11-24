-- Migration: Create spectra_user_alerts_t table
-- Description: User-configured market alerts with conditions
-- Created: 2025-11-22
--
-- NOTE: Run this migration as a user with CREATE privileges on the database
-- For DBeaver: Connect as postgres user or ensure your user has been granted:
--   GRANT CREATE ON SCHEMA public TO your_user;
--   GRANT ALL PRIVILEGES ON DATABASE spectra_dev TO your_user;

CREATE TABLE IF NOT EXISTS spectra_user_alerts_t (
  alert_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES spectra_user_t(user_id) ON DELETE CASCADE,
  
  -- Alert configuration
  symbol VARCHAR(20) NOT NULL,
  alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('price', 'rsi', 'volume', 'sma_crossover', 'volatility')),
  condition JSONB NOT NULL,
  
  -- Alert status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'triggered', 'snoozed', 'dismissed')),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  triggered_at TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_alert_user ON spectra_user_alerts_t(user_id);
CREATE INDEX idx_alert_status ON spectra_user_alerts_t(status);
CREATE INDEX idx_alert_symbol ON spectra_user_alerts_t(symbol);
CREATE INDEX idx_alert_user_status ON spectra_user_alerts_t(user_id, status);
CREATE INDEX idx_alert_type ON spectra_user_alerts_t(alert_type);

-- GIN index for JSONB condition queries
CREATE INDEX idx_alert_condition ON spectra_user_alerts_t USING GIN (condition);

-- Comments for documentation
COMMENT ON TABLE spectra_user_alerts_t IS 'User-configured market alerts with flexible conditions';
COMMENT ON COLUMN spectra_user_alerts_t.alert_id IS 'Unique alert identifier (UUID)';
COMMENT ON COLUMN spectra_user_alerts_t.user_id IS 'Reference to user who created this alert';
COMMENT ON COLUMN spectra_user_alerts_t.symbol IS 'Cryptocurrency symbol to monitor (e.g., BTC, ETH)';
COMMENT ON COLUMN spectra_user_alerts_t.alert_type IS 'Type of alert: price, rsi, volume, sma_crossover, volatility';
COMMENT ON COLUMN spectra_user_alerts_t.condition IS 'JSONB object containing alert conditions (e.g., {"priceAbove": 50000})';
COMMENT ON COLUMN spectra_user_alerts_t.status IS 'Alert status: active, triggered, snoozed, dismissed';
COMMENT ON COLUMN spectra_user_alerts_t.created_at IS 'Timestamp when alert was created';
COMMENT ON COLUMN spectra_user_alerts_t.triggered_at IS 'Timestamp when alert was triggered';

-- Example condition structures:
-- Price alert: {"priceAbove": 50000} or {"priceBelow": 30000}
-- RSI alert: {"rsiAbove": 70} or {"rsiBelow": 30}
-- Volume alert: {"volumeChangePercent": 150}
-- SMA crossover: {"smaCrossover": "golden"} or {"smaCrossover": "death"}
-- Volatility alert: {"volatilityThreshold": 5.0}
