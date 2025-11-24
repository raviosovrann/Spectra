-- Migration: Create spectra_user_portfolio_t table
-- Description: User portfolio tracking with real-time valuations
-- Created: 2025-11-22
--
-- NOTE: This migration requires migration 001 to be run first (creates update_updated_at_column function)
-- Run migrations in order: 001, 002, 003, 004, 005

CREATE TABLE IF NOT EXISTS spectra_user_portfolio_t (
  portfolio_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES spectra_user_t(user_id) ON DELETE CASCADE,
  
  -- Portfolio values
  total_value DECIMAL(20, 2) NOT NULL DEFAULT 0,
  cash_balance DECIMAL(20, 2) NOT NULL DEFAULT 0,
  
  -- 24-hour performance tracking
  change_24h DECIMAL(20, 2) DEFAULT 0,
  change_24h_percent DECIMAL(10, 4) DEFAULT 0,
  
  -- Timestamps
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_portfolio_user ON spectra_user_portfolio_t(user_id);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_user_portfolio_updated_at
  BEFORE UPDATE ON spectra_user_portfolio_t
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE spectra_user_portfolio_t IS 'User portfolios with real-time valuations and performance tracking';
COMMENT ON COLUMN spectra_user_portfolio_t.portfolio_id IS 'Unique portfolio identifier (UUID)';
COMMENT ON COLUMN spectra_user_portfolio_t.user_id IS 'Reference to user who owns this portfolio';
COMMENT ON COLUMN spectra_user_portfolio_t.total_value IS 'Total portfolio value in USD (holdings + cash)';
COMMENT ON COLUMN spectra_user_portfolio_t.cash_balance IS 'Available cash balance in USD';
COMMENT ON COLUMN spectra_user_portfolio_t.change_24h IS '24-hour change in USD';
COMMENT ON COLUMN spectra_user_portfolio_t.change_24h_percent IS '24-hour change percentage';
