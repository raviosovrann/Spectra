import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16 // 128 bits
const AUTH_TAG_LENGTH = 16 // 128 bits

export interface EncryptedData {
  encrypted: string
  iv: string
  authTag: string
}

export function encryptApiKey(apiKey: string): EncryptedData {
  const encryptionKey = process.env.ENCRYPTION_KEY

  if (!encryptionKey) {
    throw new Error('ENCRYPTION_KEY environment variable not set')
  }

  // Convert hex string to buffer
  const key = Buffer.from(encryptionKey, 'hex')

  if (key.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be 32 bytes (256 bits) in hex format')
  }

  // Generate random IV
  const iv = crypto.randomBytes(IV_LENGTH)

  // Create cipher
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  // Encrypt the API key
  let encrypted = cipher.update(apiKey, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  // Get auth tag
  const authTag = cipher.getAuthTag()

  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  }
}

export function decryptApiKey(encrypted: string, iv: string, authTag: string): string {
  const encryptionKey = process.env.ENCRYPTION_KEY

  if (!encryptionKey) {
    throw new Error('ENCRYPTION_KEY environment variable not set')
  }

  // Convert hex strings to buffers
  const key = Buffer.from(encryptionKey, 'hex')
  const ivBuffer = Buffer.from(iv, 'hex')
  const authTagBuffer = Buffer.from(authTag, 'hex')

  if (key.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be 32 bytes (256 bits) in hex format')
  }

  // Create decipher
  const decipher = crypto.createDecipheriv(ALGORITHM, key, ivBuffer)

  // Set auth tag
  decipher.setAuthTag(authTagBuffer)

  // Decrypt
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}
