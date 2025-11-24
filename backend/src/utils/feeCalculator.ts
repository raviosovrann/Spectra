/**
 * Fee Calculator Utility
 * Calculates Spectra platform fees for trades
 */

// Platform fee configuration
const SPECTRA_FEE_PERCENT = 0.5 // 0.5% platform fee
const MIN_FEE = 0.01 // Minimum fee of $0.01

export interface FeeCalculation {
  spectraFee: number
  coinbaseFee: number
  totalFees: number
  tradeValue: number
  totalCost: number
}

/**
 * Calculate Spectra platform fee
 * @param tradeValue - The value of the trade (amount * price)
 * @returns The calculated fee in USD
 */
export function calculateSpectraFee(tradeValue: number): number {
  const fee = (tradeValue * SPECTRA_FEE_PERCENT) / 100
  return Math.max(fee, MIN_FEE) // Ensure minimum fee
}

/**
 * Calculate total fees for a trade
 * @param amount - Amount of cryptocurrency
 * @param price - Price per unit in USD
 * @param coinbaseFee - Coinbase fee (if known, otherwise 0)
 * @returns Complete fee breakdown
 */
export function calculateTradeFees(
  amount: number,
  price: number,
  coinbaseFee: number = 0
): FeeCalculation {
  const tradeValue = amount * price
  const spectraFee = calculateSpectraFee(tradeValue)
  const totalFees = spectraFee + coinbaseFee
  const totalCost = tradeValue + totalFees

  return {
    spectraFee: parseFloat(spectraFee.toFixed(2)),
    coinbaseFee: parseFloat(coinbaseFee.toFixed(2)),
    totalFees: parseFloat(totalFees.toFixed(2)),
    tradeValue: parseFloat(tradeValue.toFixed(2)),
    totalCost: parseFloat(totalCost.toFixed(2)),
  }
}

/**
 * Get the current platform fee percentage
 * @returns The fee percentage (e.g., 0.5 for 0.5%)
 */
export function getPlatformFeePercent(): number {
  return SPECTRA_FEE_PERCENT
}

/**
 * Calculate fee for a specific user (future: support subscription tiers)
 * @param tradeValue - The value of the trade
 * @param userTier - User subscription tier (future enhancement)
 * @returns The calculated fee
 */
export function calculateUserFee(
  tradeValue: number,
  userTier: 'free' | 'premium' | 'pro' = 'free'
): number {
  // Future enhancement: different fee tiers
  // For now, all users pay the same fee
  let feePercent = SPECTRA_FEE_PERCENT

  switch (userTier) {
    case 'premium':
      feePercent = 0.3 // 0.3% for premium users
      break
    case 'pro':
      feePercent = 0.1 // 0.1% for pro users
      break
    default:
      feePercent = SPECTRA_FEE_PERCENT
  }

  const fee = (tradeValue * feePercent) / 100
  return Math.max(fee, MIN_FEE)
}
