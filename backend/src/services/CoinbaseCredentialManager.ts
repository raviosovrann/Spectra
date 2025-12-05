import pool from '../database/config.js'
import { decryptApiKey } from '../utils/encryption.js'
import logger from '../utils/logger.js'
import { CoinbaseAdvancedClient } from './CoinbaseAdvancedClient.js'

const serviceApiKeyName =
  process.env.COINBASE_API_KEY_NAME ||
  process.env.COINBASE_API_KEY ||
  ''

const serviceApiPrivateKey =
  process.env.COINBASE_API_PRIVATE_KEY ||
  process.env.COINBASE_PRIVATE_KEY ||
  process.env.COINBASE_API_SECRET ||
  ''

let serviceClient: CoinbaseAdvancedClient | null = null
let serviceClientInitialized = false

function initServiceClient(): CoinbaseAdvancedClient | null {
  if (serviceClientInitialized) {
    return serviceClient
  }

  serviceClientInitialized = true

  if (!serviceApiKeyName || !serviceApiPrivateKey) {
    logger.warn(
      'Service-level Coinbase API credentials not configured. Falling back to user-provided keys for authenticated requests.'
    )
    return null
  }

  try {
    serviceClient = new CoinbaseAdvancedClient(serviceApiKeyName, serviceApiPrivateKey)
    logger.info('Initialized service-level Coinbase client using environment credentials')
  } catch (error) {
    logger.error('Failed to initialize service-level Coinbase client', {
      error: error instanceof Error ? error.message : String(error),
    })
    serviceClient = null
  }

  return serviceClient
}

export function getServiceCoinbaseClient(): CoinbaseAdvancedClient | null {
  return initServiceClient()
}

export async function getUserCoinbaseClient(userId: string): Promise<CoinbaseAdvancedClient | null> {
  const result = await pool.query(
    `SELECT user_coinbase_public, user_coinbase_public_iv, user_coinbase_public_tag,
            user_coinbase_secret, user_coinbase_secret_iv, user_coinbase_secret_tag
     FROM spectra_user_t WHERE user_id = $1`,
    [userId]
  )

  if (result.rows.length === 0) {
    return null
  }

  const user = result.rows[0]

  if (
    !user.user_coinbase_public ||
    !user.user_coinbase_secret ||
    !user.user_coinbase_public_iv ||
    !user.user_coinbase_secret_iv ||
    !user.user_coinbase_public_tag ||
    !user.user_coinbase_secret_tag
  ) {
    return null
  }

  const apiKey = decryptApiKey(
    user.user_coinbase_public,
    user.user_coinbase_public_iv,
    user.user_coinbase_public_tag
  )

  const apiSecret = decryptApiKey(
    user.user_coinbase_secret,
    user.user_coinbase_secret_iv,
    user.user_coinbase_secret_tag
  )

  return new CoinbaseAdvancedClient(apiKey, apiSecret)
}

type CoinbaseClientSource = 'service' | 'user'

interface ResolvedCoinbaseClient {
  client: CoinbaseAdvancedClient
  source: CoinbaseClientSource
}

interface ResolveOptions {
  preferService?: boolean
  userOnly?: boolean
}

export async function resolveCoinbaseClient(
  userId?: string,
  options?: ResolveOptions
): Promise<ResolvedCoinbaseClient | null> {
  const preferService = options?.preferService ?? false
  const userOnly = options?.userOnly ?? false

  if (userOnly) {
    if (!userId) {
      return null
    }
    try {
      const userClient = await getUserCoinbaseClient(userId)
      return userClient ? { client: userClient, source: 'user' } : null
    } catch (error) {
      logger.error('Failed to build Coinbase client from user credentials', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      })
      return null
    }
  }

  if (preferService) {
    const serviceClient = getServiceCoinbaseClient()
    if (serviceClient) {
      return { client: serviceClient, source: 'service' }
    }
  }

  if (userId) {
    try {
      const userClient = await getUserCoinbaseClient(userId)
      if (userClient) {
        return { client: userClient, source: 'user' }
      }
    } catch (error) {
      logger.error('Failed to build Coinbase client from user credentials', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  if (!preferService) {
    const serviceClient = getServiceCoinbaseClient()
    if (serviceClient) {
      return { client: serviceClient, source: 'service' }
    }
  }

  return null
}
