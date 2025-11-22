import { Pool, PoolConfig } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const poolConfig: PoolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'spectra_dev',
  user: process.env.DB_USER || 'spectra_user',
  password: process.env.DB_PASSWORD || '',
  max: 20, // Maximum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
}

// Validate required environment variables
if (!process.env.DB_PASSWORD) {
  console.warn('Warning: DB_PASSWORD environment variable is not set. Using empty password.')
}

const pool = new Pool(poolConfig)

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err)
})

export default pool
