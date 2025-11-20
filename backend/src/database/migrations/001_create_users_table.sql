-- Migration: Create spectra_user_t table
-- Description: User authentication and Coinbase API credentials storage
-- Created: 2025-11-17
--
-- NOTE: This migration assumes the database already exists.
-- For cloud deployment, ensure your database is created first:
--   - Railway/Heroku: Database is auto-created with addon
--   - AWS RDS/GCP: Create database manually before running migrations
--   - Local: Run backend/scripts/create-tables.sh

CREATE TABLE IF NOT EXISTS spectra_user_t (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(255) NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  email_address VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL, -- bcrypt hashed
  
  -- Encrypted Coinbase API credentials
  user_coinbase_public VARCHAR(500), -- Encrypted API key
  user_coinbase_public_iv VARCHAR(32), -- Initialization vector
  user_coinbase_public_tag VARCHAR(32), -- Auth tag
  user_coinbase_secret VARCHAR(500), -- Encrypted API secret
  user_coinbase_secret_iv VARCHAR(32),
  user_coinbase_secret_tag VARCHAR(32),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  
  -- Status
  is_active BOOLEAN DEFAULT true
);

-- Indexes for performance
CREATE INDEX idx_user_email ON spectra_user_t(email_address);
CREATE INDEX idx_user_username ON spectra_user_t(username);
CREATE INDEX idx_user_active ON spectra_user_t(is_active);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_spectra_user_updated_at
  BEFORE UPDATE ON spectra_user_t
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE spectra_user_t IS 'User accounts with authentication and Coinbase API credentials';
COMMENT ON COLUMN spectra_user_t.user_id IS 'Unique user identifier (UUID)';
COMMENT ON COLUMN spectra_user_t.password IS 'bcrypt hashed password (never store plain text)';
COMMENT ON COLUMN spectra_user_t.user_coinbase_public IS 'AES-256-GCM encrypted Coinbase API key';
COMMENT ON COLUMN spectra_user_t.user_coinbase_secret IS 'AES-256-GCM encrypted Coinbase API secret';
