import { describe, it, expect } from 'vitest'
import { encryptApiKey, decryptApiKey } from '../../src/utils/encryption.js'

describe('Encryption - API Key Encryption/Decryption', () => {
  it('should encrypt API key successfully', () => {
    const apiKey = 'test-api-key-12345'
    
    const result = encryptApiKey(apiKey)
    
    expect(result.encrypted).toBeDefined()
    expect(result.iv).toBeDefined()
    expect(result.authTag).toBeDefined()
    expect(result.encrypted).not.toBe(apiKey)
    expect(result.iv.length).toBe(32) // 16 bytes in hex = 32 characters
    expect(result.authTag.length).toBe(32) // 16 bytes in hex = 32 characters
  })

  it('should decrypt API key successfully', () => {
    const apiKey = 'test-api-key-12345'
    
    const encrypted = encryptApiKey(apiKey)
    const decrypted = decryptApiKey(encrypted.encrypted, encrypted.iv, encrypted.authTag)
    
    expect(decrypted).toBe(apiKey)
  })

  it('should produce different encrypted values for same input', () => {
    const apiKey = 'test-api-key-12345'
    
    const result1 = encryptApiKey(apiKey)
    const result2 = encryptApiKey(apiKey)
    
    // Different IVs should produce different encrypted values
    expect(result1.encrypted).not.toBe(result2.encrypted)
    expect(result1.iv).not.toBe(result2.iv)
    
    // But both should decrypt to the same value
    const decrypted1 = decryptApiKey(result1.encrypted, result1.iv, result1.authTag)
    const decrypted2 = decryptApiKey(result2.encrypted, result2.iv, result2.authTag)
    
    expect(decrypted1).toBe(apiKey)
    expect(decrypted2).toBe(apiKey)
  })

  it('should handle long API keys', () => {
    const longApiKey = 'a'.repeat(500)
    
    const encrypted = encryptApiKey(longApiKey)
    const decrypted = decryptApiKey(encrypted.encrypted, encrypted.iv, encrypted.authTag)
    
    expect(decrypted).toBe(longApiKey)
  })

  it('should handle special characters in API keys', () => {
    const specialApiKey = 'test-key!@#$%^&*()_+-=[]{}|;:,.<>?'
    
    const encrypted = encryptApiKey(specialApiKey)
    const decrypted = decryptApiKey(encrypted.encrypted, encrypted.iv, encrypted.authTag)
    
    expect(decrypted).toBe(specialApiKey)
  })

  it('should fail decryption with wrong IV', () => {
    const apiKey = 'test-api-key-12345'
    const encrypted = encryptApiKey(apiKey)
    const wrongIv = '0'.repeat(32)
    
    expect(() => {
      decryptApiKey(encrypted.encrypted, wrongIv, encrypted.authTag)
    }).toThrow()
  })

  it('should fail decryption with wrong auth tag', () => {
    const apiKey = 'test-api-key-12345'
    const encrypted = encryptApiKey(apiKey)
    const wrongAuthTag = '0'.repeat(32)
    
    expect(() => {
      decryptApiKey(encrypted.encrypted, encrypted.iv, wrongAuthTag)
    }).toThrow()
  })

  it('should fail decryption with tampered encrypted data', () => {
    const apiKey = 'test-api-key-12345'
    const encrypted = encryptApiKey(apiKey)
    const tamperedEncrypted = encrypted.encrypted.substring(0, encrypted.encrypted.length - 2) + 'ff'
    
    expect(() => {
      decryptApiKey(tamperedEncrypted, encrypted.iv, encrypted.authTag)
    }).toThrow()
  })

  it('should throw error if ENCRYPTION_KEY is not set', () => {
    const originalKey = process.env.ENCRYPTION_KEY
    delete process.env.ENCRYPTION_KEY
    
    expect(() => {
      encryptApiKey('test-key')
    }).toThrow('ENCRYPTION_KEY environment variable not set')
    
    // Restore the key
    process.env.ENCRYPTION_KEY = originalKey
  })

  it('should handle empty string encryption', () => {
    const emptyKey = ''
    
    const encrypted = encryptApiKey(emptyKey)
    const decrypted = decryptApiKey(encrypted.encrypted, encrypted.iv, encrypted.authTag)
    
    expect(decrypted).toBe(emptyKey)
  })
})

describe('Encryption - Coinbase API Credentials', () => {
  it('should encrypt and decrypt Coinbase API key', () => {
    const coinbaseApiKey = 'organizations/abc123/apiKeys/def456'
    
    const encrypted = encryptApiKey(coinbaseApiKey)
    const decrypted = decryptApiKey(encrypted.encrypted, encrypted.iv, encrypted.authTag)
    
    expect(decrypted).toBe(coinbaseApiKey)
  })

  it('should encrypt and decrypt Coinbase API secret', () => {
    const coinbaseApiSecret = '-----BEGIN EC PRIVATE KEY-----\nMHcCAQEEIBKJKm...\n-----END EC PRIVATE KEY-----'
    
    const encrypted = encryptApiKey(coinbaseApiSecret)
    const decrypted = decryptApiKey(encrypted.encrypted, encrypted.iv, encrypted.authTag)
    
    expect(decrypted).toBe(coinbaseApiSecret)
  })

  it('should maintain data integrity for multiple encrypt/decrypt cycles', () => {
    const apiKey = 'test-api-key-12345'
    
    // Encrypt and decrypt multiple times
    let encrypted = encryptApiKey(apiKey)
    let decrypted = decryptApiKey(encrypted.encrypted, encrypted.iv, encrypted.authTag)
    expect(decrypted).toBe(apiKey)
    
    encrypted = encryptApiKey(decrypted)
    decrypted = decryptApiKey(encrypted.encrypted, encrypted.iv, encrypted.authTag)
    expect(decrypted).toBe(apiKey)
    
    encrypted = encryptApiKey(decrypted)
    decrypted = decryptApiKey(encrypted.encrypted, encrypted.iv, encrypted.authTag)
    expect(decrypted).toBe(apiKey)
  })
})
