import { describe, it, expect, beforeAll } from 'vitest'
import { CoinbaseAdvancedClient } from '../../src/services/CoinbaseAdvancedClient.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('Coinbase API Connection', () => {
  let client: CoinbaseAdvancedClient
  let apiKeyName: string
  let privateKey: string

  // Load CDP API key from environment variables or file AFTER setup
  beforeAll(() => {
    try {
      // Try environment variables first
      if (process.env.COINBASE_API_KEY_NAME && process.env.COINBASE_PRIVATE_KEY) {
        apiKeyName = process.env.COINBASE_API_KEY_NAME
        // Replace literal \n with actual newlines
        privateKey = process.env.COINBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        
        client = new CoinbaseAdvancedClient(apiKeyName, privateKey)
        
        console.log('\n📋 CDP API Key Info (from .env):')
        console.log('  API Key Name:', apiKeyName)
        console.log('  Type: ECDSA (CDP API Key)')
        console.log('  Private Key Format:', privateKey.includes('BEGIN EC PRIVATE KEY') ? '✅ Valid' : '❌ Invalid')
        console.log()
      } else {
        // Fallback to cdp_api_key.json file
        const cdpKeyPath = path.resolve(__dirname, '../../../cdp_api_key(1).json')
        
        if (!fs.existsSync(cdpKeyPath)) {
          console.warn('⚠️  No API key configured - skipping Coinbase connection tests')
          console.warn('   Set COINBASE_API_KEY_NAME and COINBASE_PRIVATE_KEY in .env')
        } else {
          const cdpKey = JSON.parse(fs.readFileSync(cdpKeyPath, 'utf-8'))
          
          // Use full API key name
          apiKeyName = cdpKey.name
          privateKey = cdpKey.privateKey
          
          client = new CoinbaseAdvancedClient(apiKeyName, privateKey)
          
          console.log('\n📋 CDP API Key Info (from file):')
          console.log('  API Key Name:', apiKeyName)
          console.log('  Type: ECDSA (CDP API Key)')
          console.log('  Private Key Format:', privateKey.includes('BEGIN EC PRIVATE KEY') ? '✅ Valid' : '❌ Invalid')
          console.log()
        }
      }
    } catch (error) {
      console.error('Failed to load CDP API key:', error)
    }
  })

  it('should have valid CDP API key format', () => {
    expect(apiKeyName).toBeDefined()
    expect(apiKeyName).toMatch(/^organizations\/[a-f0-9-]+\/apiKeys\/[a-f0-9-]+$/) // Full CDP key format
    expect(privateKey).toContain('BEGIN EC PRIVATE KEY')
    expect(privateKey).toContain('END EC PRIVATE KEY')
  })

  it('should authenticate and fetch accounts', async () => {
    if (!client) {
      console.log('⏭️  Skipping test - no API key configured')
      return
    }

    console.log('📊 Fetching accounts from Coinbase...')
    
    const accounts = await client.getAccounts()
    
    expect(accounts).toBeDefined()
    expect(Array.isArray(accounts)).toBe(true)
    
    console.log(`✅ Successfully fetched ${accounts.length} account(s)`)
    
    if (accounts.length > 0) {
      console.log('\n  Account Details:')
      accounts.forEach((account, index) => {
        const balance = parseFloat(account.available_balance.value)
        const held = parseFloat(account.hold.value)
        
        if (balance > 0 || held > 0 || account.active) {
          console.log(`    ${index + 1}. ${account.currency} (${account.type})`)
          console.log(`       Available: ${balance.toFixed(8)} ${account.currency}`)
          if (held > 0) {
            console.log(`       Held: ${held.toFixed(8)} ${account.currency}`)
          }
          console.log(`       Status: ${account.active ? 'Active' : 'Inactive'}`)
        }
      })
    } else {
      console.log('  ℹ️  No accounts found (this is normal for new accounts)')
    }
  }, 30000) // 30 second timeout

  it('should fetch available trading products', async () => {
    if (!client) {
      console.log('⏭️  Skipping test - no API key configured')
      return
    }

    console.log('\n📈 Fetching trading products from Coinbase...')
    
    const products = await client.getProducts()
    
    expect(products).toBeDefined()
    expect(Array.isArray(products)).toBe(true)
    expect(products.length).toBeGreaterThan(0)
    
    console.log(`✅ Successfully fetched ${products.length} trading pair(s)`)
    
    // Show some popular products
    const popularSymbols = ['BTC-USD', 'ETH-USD', 'SOL-USD', 'USDC-USD']
    const popularProducts = products.filter(p => popularSymbols.includes(p.product_id))
    
    if (popularProducts.length > 0) {
      console.log('\n  Popular Trading Pairs:')
      popularProducts.forEach(product => {
        const price = parseFloat(product.price)
        const change = parseFloat(product.price_percentage_change_24h)
        
        console.log(`    ${product.product_id}: $${price.toFixed(2)}`)
        
        
      })
    }
  }, 30000) // 30 second timeout
})
