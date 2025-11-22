import { describe, it, expect, beforeAll } from 'vitest'
import { CoinbaseAdvancedClient } from '../../src/services/CoinbaseAdvancedClient.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('Coinbase API Connection', () => {
  let client: CoinbaseAdvancedClient | null = null
  let apiKeyName: string | null = null
  let privateKey: string | null = null
  let skipTests = false

  // Load CDP API key from environment variables or file
  beforeAll(() => {
    try {
      // Try environment variables first
      if (process.env.COINBASE_API_KEY_NAME && process.env.COINBASE_PRIVATE_KEY) {
        apiKeyName = process.env.COINBASE_API_KEY_NAME
        // Replace literal \n with actual newlines
        privateKey = process.env.COINBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        
        client = new CoinbaseAdvancedClient(apiKeyName!, privateKey!)
      } else {
        // Fallback to cdp_api_key.json file
        const cdpKeyPath = path.resolve(__dirname, '../../../cdp_api_key(1).json')
        
        if (!fs.existsSync(cdpKeyPath)) {
          console.warn('⚠️  No Coinbase API credentials configured - skipping connection tests')
          skipTests = true
          return
        }
        
        const cdpKey = JSON.parse(fs.readFileSync(cdpKeyPath, 'utf-8'))
        
        // Use full API key name
        apiKeyName = cdpKey.name
        privateKey = cdpKey.privateKey
        
        client = new CoinbaseAdvancedClient(apiKeyName!, privateKey!)
      }
    } catch (error) {
      console.error('Failed to load CDP API key:', error)
      skipTests = true
    }
  })

  it('should have valid CDP API key format', (ctx) => {
    if (skipTests) {
      ctx.skip()
    }
    if (!apiKeyName || !privateKey) {
      throw new Error('API credentials not loaded')
    }
    
    expect(apiKeyName).toBeDefined()
    expect(typeof apiKeyName).toBe('string')
    expect(apiKeyName).toMatch(/^organizations\/[a-f0-9-]+\/apiKeys\/[a-f0-9-]+$/) // Full CDP key format
    expect(privateKey).toContain('BEGIN EC PRIVATE KEY')
    expect(privateKey).toContain('END EC PRIVATE KEY')
  })

  it('should authenticate and fetch accounts', async (ctx) => {
    if (skipTests) {
      ctx.skip()
    }
    if (!client) {
      throw new Error('Client not initialized')
    }
    
    const accounts = await client.getAccounts()
    
    expect(accounts).toBeDefined()
    expect(Array.isArray(accounts)).toBe(true)
  }, 30000) // 30 second timeout

  it('should fetch available trading products', async (ctx) => {
    if (skipTests) {
      ctx.skip()
    }
    if (!client) {
      throw new Error('Client not initialized')
    }
    
    const products = await client.getProducts()
    
    expect(products).toBeDefined()
    expect(Array.isArray(products)).toBe(true)
    expect(products.length).toBeGreaterThan(0)
  }, 30000) // 30 second timeout
})
