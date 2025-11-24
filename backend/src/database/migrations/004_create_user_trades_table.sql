-- Migration: Create spectra_user_trades_t table
-- Description: Trade history with 90-day retention
-- Created: 2025-11-22
--
-- NOTE: Run this migration as a user with CREATE privileges on the database
-- For DBeaver: Connect as postgres user or ensure your user has been granted:
--   GRANT CREATE ON SCHEMA public TO your_user;
--   GRANT ALL PRIVILEGES ON DATABASE spectra_dev TO your_user;

CREATE TABLE IF NOT EXISTS spectra_user_trades_t (
  trade_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES spectra_user_t(user_id) ON DELETE CASCADE,
  
  -- Order information
  order_id VARCHAR(100),
  symbol VARCHAR(20) NOT NULL,
  side VARCHAR(10) NOT NULL CHECK (side IN ('buy', 'sell')),
  
  -- Trade details
  amount DECIMAL(20, 8) NOT NULL,
  price DECIMAL(20, 2) NOT NULL,
  coinbase_fees DECIMAL(20, 2) NOT NULL DEFAULT 0,
  spectra_fees DECIMAL(20, 2) NOT NULL,
  total_value DECIMAL(20, 2) NOT NULL,
  
  -- Timestamps
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_trade_user ON spectra_user_trades_t(user_id);
CREATE INDEX idx_trade_symbol ON spectra_user_trades_t(symbol);
CREATE INDEX idx_trade_executed ON spectra_user_trades_t(executed_at DESC);
CREATE INDEX idx_trade_user_executed ON spectra_user_trades_t(user_id, executed_at DESC);
CREATE INDEX idx_trade_order_id ON spectra_user_trades_t(order_id);

-- Comments for documentation
COMMENT ON TABLE spectra_user_trades_t IS 'Trade history with 90-day retention policy';
COMMENT ON COLUMN spectra_user_trades_t.trade_id IS 'Unique trade identifier (UUID)';
COMMENT ON COLUMN spectra_user_trades_t.user_id IS 'Reference to user who executed this trade';
COMMENT ON COLUMN spectra_user_trades_t.order_id IS 'Coinbase order ID (if applicable)';
COMMENT ON COLUMN spectra_user_trades_t.symbol IS 'Cryptocurrency symbol (e.g., BTC, ETH)';
COMMENT ON COLUMN spectra_user_trades_t.side IS 'Trade side: buy or sell';
COMMENT ON COLUMN spectra_user_trades_t.amount IS 'Amount of cryptocurrency traded';
COMMENT ON COLUMN spectra_user_trades_t.price IS 'Execution price per unit in USD';
COMMENT ON COLUMN spectra_user_trades_t.coinbase_fees IS 'Coinbase trading fees in USD';
COMMENT ON COLUMN spectra_user_trades_t.spectra_fees IS 'Spectra platform fees in USD (e.g., 0.5% of trade value)';
COMMENT ON COLUMN spectra_user_trades_t.total_value IS 'Total trade value in USD (amount * price + all fees)';
COMMENT ON COLUMN spectra_user_trades_t.executed_at IS 'Timestamp when trade was executed';
