#!/bin/bash

# Run this script with: sudo bash backend/scripts/create-tables.sh

echo "Creating tables in spectra_dev database..."

sudo -u postgres psql -d spectra_dev << 'EOF'

-- Create spectra_user_t table
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_email ON spectra_user_t(email_address);
CREATE INDEX IF NOT EXISTS idx_user_username ON spectra_user_t(username);
CREATE INDEX IF NOT EXISTS idx_user_active ON spectra_user_t(is_active);

-- Create trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_spectra_user_updated_at ON spectra_user_t;
CREATE TRIGGER update_spectra_user_updated_at
  BEFORE UPDATE ON spectra_user_t
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions to spectra_user
GRANT ALL PRIVILEGES ON TABLE spectra_user_t TO spectra_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO spectra_user;

-- Verify table creation
\dt spectra_user_t
\di idx_user_*

EOF

echo "✓ Tables created successfully"
