#!/bin/bash

# ============================================
# LOCAL DEVELOPMENT ONLY - DO NOT USE IN PRODUCTION
# ============================================
# This script sets up PostgreSQL database on your local machine
# Run with: sudo bash backend/scripts/setup-local-db.sh
#
# For PRODUCTION/DEPLOYMENT:
#   1. Your cloud provider (Railway/Heroku/AWS) creates the database
#   2. Set environment variables (DB_HOST, DB_USER, DB_PASSWORD, etc.)
#   3. Run: npm run migrate (uses runMigration.ts)
#
# This script is ONLY for local development with PostgreSQL installed locally

echo "Setting up spectra_dev database..."

# Create database and user if they don't exist
sudo -u postgres psql << 'EOF'
-- Create database if it doesn't exist
SELECT 'CREATE DATABASE spectra_dev'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'spectra_dev')\gexec

-- Create user if doesn't exist
DO $
BEGIN
  IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'spectra_user') THEN
    CREATE USER spectra_user WITH PASSWORD 'your_password';
  END IF;
END
$;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE spectra_dev TO spectra_user;
EOF

echo "Creating tables in spectra_dev database..."

sudo -u postgres psql -d spectra_dev << 'EOF'

-- Create trigger function (used by all tables)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission on the trigger function to all users
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO PUBLIC;

-- ============================================
-- 1. Create spectra_user_t table
-- ============================================
CREATE TABLE IF NOT EXISTS spectra_user_t (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(255) NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  email_address VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  
  user_coinbase_public VARCHAR(500),
  user_coinbase_public_iv VARCHAR(32),
  user_coinbase_public_tag VARCHAR(32),
  user_coinbase_secret VARCHAR(500),
  user_coinbase_secret_iv VARCHAR(32),
  user_coinbase_secret_tag VARCHAR(32),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_user_email ON spectra_user_t(email_address);
CREATE INDEX IF NOT EXISTS idx_user_username ON spectra_user_t(username);
CREATE INDEX IF NOT EXISTS idx_user_active ON spectra_user_t(is_active);

DROP TRIGGER IF EXISTS update_spectra_user_updated_at ON spectra_user_t;
CREATE TRIGGER update_spectra_user_updated_at
  BEFORE UPDATE ON spectra_user_t
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 2. Create spectra_user_portfolio_t table
-- ============================================
CREATE TABLE IF NOT EXISTS spectra_user_portfolio_t (
  portfolio_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES spectra_user_t(user_id) ON DELETE CASCADE,
  
  total_value DECIMAL(20, 2) NOT NULL DEFAULT 0,
  cash_balance DECIMAL(20, 2) NOT NULL DEFAULT 0,
  
  change_24h DECIMAL(20, 2) DEFAULT 0,
  change_24h_percent DECIMAL(10, 4) DEFAULT 0,
  
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_portfolio_user ON spectra_user_portfolio_t(user_id);

DROP TRIGGER IF EXISTS update_user_portfolio_updated_at ON spectra_user_portfolio_t;
CREATE TRIGGER update_user_portfolio_updated_at
  BEFORE UPDATE ON spectra_user_portfolio_t
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 3. Create spectra_user_holdings_t table
-- ============================================
CREATE TABLE IF NOT EXISTS spectra_user_holdings_t (
  holding_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES spectra_user_portfolio_t(portfolio_id) ON DELETE CASCADE,
  
  symbol VARCHAR(20) NOT NULL,
  quantity DECIMAL(20, 8) NOT NULL,
  
  average_buy_price DECIMAL(20, 2) NOT NULL,
  
  current_price DECIMAL(20, 2),
  current_value DECIMAL(20, 2),
  
  unrealized_pnl DECIMAL(20, 2),
  unrealized_pnl_percent DECIMAL(10, 4),
  
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_holding_portfolio ON spectra_user_holdings_t(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_holding_symbol ON spectra_user_holdings_t(symbol);
CREATE INDEX IF NOT EXISTS idx_holding_portfolio_symbol ON spectra_user_holdings_t(portfolio_id, symbol);

DROP TRIGGER IF EXISTS update_user_holdings_updated_at ON spectra_user_holdings_t;
CREATE TRIGGER update_user_holdings_updated_at
  BEFORE UPDATE ON spectra_user_holdings_t
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. Create spectra_user_trades_t table
-- ============================================
CREATE TABLE IF NOT EXISTS spectra_user_trades_t (
  trade_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES spectra_user_t(user_id) ON DELETE CASCADE,
  
  order_id VARCHAR(100),
  symbol VARCHAR(20) NOT NULL,
  side VARCHAR(10) NOT NULL CHECK (side IN ('buy', 'sell')),
  
  amount DECIMAL(20, 8) NOT NULL,
  price DECIMAL(20, 2) NOT NULL,
  coinbase_fees DECIMAL(20, 2) NOT NULL DEFAULT 0,
  spectra_fees DECIMAL(20, 2) NOT NULL,
  total_value DECIMAL(20, 2) NOT NULL,
  
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_trade_user ON spectra_user_trades_t(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_symbol ON spectra_user_trades_t(symbol);
CREATE INDEX IF NOT EXISTS idx_trade_executed ON spectra_user_trades_t(executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_trade_user_executed ON spectra_user_trades_t(user_id, executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_trade_order_id ON spectra_user_trades_t(order_id);

-- ============================================
-- 5. Create spectra_user_alerts_t table
-- ============================================
CREATE TABLE IF NOT EXISTS spectra_user_alerts_t (
  alert_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES spectra_user_t(user_id) ON DELETE CASCADE,
  
  symbol VARCHAR(20) NOT NULL,
  alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('price', 'rsi', 'volume', 'sma_crossover', 'volatility')),
  condition JSONB NOT NULL,
  
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'triggered', 'snoozed', 'dismissed')),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  triggered_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_alert_user ON spectra_user_alerts_t(user_id);
CREATE INDEX IF NOT EXISTS idx_alert_status ON spectra_user_alerts_t(status);
CREATE INDEX IF NOT EXISTS idx_alert_symbol ON spectra_user_alerts_t(symbol);
CREATE INDEX IF NOT EXISTS idx_alert_user_status ON spectra_user_alerts_t(user_id, status);
CREATE INDEX IF NOT EXISTS idx_alert_type ON spectra_user_alerts_t(alert_type);
CREATE INDEX IF NOT EXISTS idx_alert_condition ON spectra_user_alerts_t USING GIN (condition);

-- ============================================
-- Grant permissions to spectra_user
-- ============================================
GRANT ALL PRIVILEGES ON TABLE spectra_user_t TO spectra_user;
GRANT ALL PRIVILEGES ON TABLE spectra_user_portfolio_t TO spectra_user;
GRANT ALL PRIVILEGES ON TABLE spectra_user_holdings_t TO spectra_user;
GRANT ALL PRIVILEGES ON TABLE spectra_user_trades_t TO spectra_user;
GRANT ALL PRIVILEGES ON TABLE spectra_user_alerts_t TO spectra_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO spectra_user;

-- ============================================
-- Verify table creation
-- ============================================
\dt spectra_user_*

EOF

echo "✓ All tables created successfully"
echo ""
echo "Tables created:"
echo "  - spectra_user_t"
echo "  - spectra_user_portfolio_t"
echo "  - spectra_user_holdings_t"
echo "  - spectra_user_trades_t"
echo "  - spectra_user_alerts_t"

