-- Migration: Create spectra_user_holdings_t table
-- Description: Individual cryptocurrency holdings within portfolios
-- Created: 2025-11-22
--
-- NOTE: This migration requires migration 001 to be run first (creates update_updated_at_column function)
-- Run migrations in order: 001, 002, 003, 004, 005

CREATE TABLE IF NOT EXISTS spectra_user_holdings_t (
  holding_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES spectra_user_portfolio_t(portfolio_id) ON DELETE CASCADE,
  
  -- Cryptocurrency details
  symbol VARCHAR(20) NOT NULL,
  quantity DECIMAL(20, 8) NOT NULL,
  
  -- Purchase information
  average_buy_price DECIMAL(20, 2) NOT NULL,
  
  -- Current valuation
  current_price DECIMAL(20, 2),
  current_value DECIMAL(20, 2),
  
  -- Profit/Loss tracking
  unrealized_pnl DECIMAL(20, 2),
  unrealized_pnl_percent DECIMAL(10, 4),
  
  -- Timestamps
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_holding_portfolio ON spectra_user_holdings_t(portfolio_id);
CREATE INDEX idx_holding_symbol ON spectra_user_holdings_t(symbol);
CREATE INDEX idx_holding_portfolio_symbol ON spectra_user_holdings_t(portfolio_id, symbol);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_user_holdings_updated_at
  BEFORE UPDATE ON spectra_user_holdings_t
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE spectra_user_holdings_t IS 'Individual cryptocurrency holdings within user portfolios';
COMMENT ON COLUMN spectra_user_holdings_t.holding_id IS 'Unique holding identifier (UUID)';
COMMENT ON COLUMN spectra_user_holdings_t.portfolio_id IS 'Reference to portfolio containing this holding';
COMMENT ON COLUMN spectra_user_holdings_t.symbol IS 'Cryptocurrency symbol (e.g., BTC, ETH)';
COMMENT ON COLUMN spectra_user_holdings_t.quantity IS 'Amount of cryptocurrency held (up to 8 decimal places)';
COMMENT ON COLUMN spectra_user_holdings_t.average_buy_price IS 'Average purchase price per unit in USD';
COMMENT ON COLUMN spectra_user_holdings_t.current_price IS 'Current market price per unit in USD';
COMMENT ON COLUMN spectra_user_holdings_t.current_value IS 'Current total value (quantity * current_price)';
COMMENT ON COLUMN spectra_user_holdings_t.unrealized_pnl IS 'Unrealized profit/loss in USD';
COMMENT ON COLUMN spectra_user_holdings_t.unrealized_pnl_percent IS 'Unrealized profit/loss percentage';
