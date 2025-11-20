import { beforeAll } from 'vitest'
import dotenv from 'dotenv'

// Load environment variables for testing
beforeAll(() => {
  dotenv.config()
  
  // Ensure required environment variables are set for tests
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only'
  }
  
  if (!process.env.ENCRYPTION_KEY) {
    // Generate a 32-byte (256-bit) key in hex format for testing
    process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
  }
})
