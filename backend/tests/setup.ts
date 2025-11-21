import { beforeAll } from 'vitest'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables for testing
beforeAll(() => {
  // Load .env from backend directory
  const envPath = path.resolve(__dirname, '../.env')
  const result = dotenv.config({ path: envPath })
  
  if (result.error) {
    console.warn('Warning: Could not load .env file:', result.error.message)
  } else {
    console.log('✅ Loaded .env file from:', envPath)
  }
  
  // Ensure required environment variables are set for tests
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only'
  }
  
  if (!process.env.ENCRYPTION_KEY) {
    // Generate a 32-byte (256-bit) key in hex format for testing
    process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
  }
})
