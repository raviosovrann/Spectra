# Database Setup Guide

## Prerequisites

- PostgreSQL 14+ installed
- Database `spectra_dev` created
- Database user with appropriate permissions

## Quick Start

### 1. Create the Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE spectra_dev;

# Exit psql
\q
```

### 2. Configure Environment Variables

Create a `.env` file in the `backend` directory:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=spectra_dev
DB_USER=your_username
DB_PASSWORD=your_password

# Required for encryption
ENCRYPTION_KEY=your_32_byte_hex_key_here
JWT_SECRET=your_jwt_secret_here
```

**Generate ENCRYPTION_KEY:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Generate JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Run Migrations

**Option A: Using psql (Recommended)**

```bash
cd backend
chmod +x scripts/run-migration.sh
./scripts/run-migration.sh
```

**Option B: Using TypeScript**

```bash
cd backend
npm install
npx ts-node src/database/runMigration.ts
```

**Option C: Manual psql**

```bash
psql -U your_username -d spectra_dev -f src/database/migrations/001_create_users_table.sql
```

## Database Schema

### spectra_user_t

User authentication and Coinbase API credentials storage.

| Column | Type | Description |
|--------|------|-------------|
| user_id | UUID | Primary key (auto-generated) |
| full_name | VARCHAR(255) | User's full name |
| username | VARCHAR(50) | Unique username |
| email_address | VARCHAR(255) | Unique email address |
| password | VARCHAR(255) | bcrypt hashed password |
| user_coinbase_public | VARCHAR(500) | Encrypted Coinbase API key |
| user_coinbase_public_iv | VARCHAR(32) | Encryption IV for API key |
| user_coinbase_public_tag | VARCHAR(32) | Encryption auth tag for API key |
| user_coinbase_secret | VARCHAR(500) | Encrypted Coinbase API secret |
| user_coinbase_secret_iv | VARCHAR(32) | Encryption IV for API secret |
| user_coinbase_secret_tag | VARCHAR(32) | Encryption auth tag for API secret |
| created_at | TIMESTAMP | Account creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |
| last_login | TIMESTAMP | Last login timestamp |
| is_active | BOOLEAN | Account active status |

**Indexes:**
- `idx_user_email` on `email_address`
- `idx_user_username` on `username`
- `idx_user_active` on `is_active`

## Verify Installation

```bash
# Connect to database
psql -U your_username -d spectra_dev

# List tables
\dt

# Describe spectra_user_t table
\d spectra_user_t

# Check indexes
\di

# Exit
\q
```

Expected output should show:
- Table `spectra_user_t` exists
- Indexes on email_address and username
- Trigger `update_spectra_user_updated_at`

## Security Notes

1. **Never commit `.env` file** - It contains sensitive credentials
2. **ENCRYPTION_KEY** - Must be 32 bytes (64 hex characters) for AES-256
3. **JWT_SECRET** - Should be a long random string
4. **Passwords** - Always hashed with bcrypt (10 salt rounds)
5. **API Credentials** - Encrypted with AES-256-GCM before storage

## Troubleshooting

### Connection Refused

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql
```

### Permission Denied

```bash
# Grant privileges to user
psql -U postgres
GRANT ALL PRIVILEGES ON DATABASE spectra_dev TO your_username;
```

### Migration Already Run

The migration uses `CREATE TABLE IF NOT EXISTS`, so it's safe to run multiple times.

## Future Migrations

Additional tables will be created in subsequent migrations:
- `portfolios` - User portfolio data
- `holdings` - Individual cryptocurrency holdings
- `trades` - Trade history
- `alerts` - User-configured alerts

These will be added as the application develops.
