// Utility functions for formatting numbers and currencies

/**
 * Format a number as currency with $ symbol
 * @param value - The number to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted currency string
 */
export function formatCurrency(value: number, decimals: number = 2): string {
  if (!value || value === 0) {
    return '--'
  }
  return `$${value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`
}

/**
 * Format a number with K/M/B suffixes for large numbers
 * @param value - The number to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted number string with suffix
 */
export function formatNumber(value: number, decimals: number = 2): string {
  if (!value || value === 0) {
    return '--'
  }
  if (value >= 1e9) {
    return `${(value / 1e9).toFixed(decimals)}B`
  }
  if (value >= 1e6) {
    return `${(value / 1e6).toFixed(decimals)}M`
  }
  if (value >= 1e3) {
    return `${(value / 1e3).toFixed(decimals)}K`
  }
  return value.toFixed(decimals)
}

/**
 * Format a percentage value
 * @param value - The percentage value (e.g., 5.24 for 5.24%)
 * @param decimals - Number of decimal places (default: 2)
 * @param includeSign - Whether to include + sign for positive values (default: true)
 * @returns Formatted percentage string
 */
export function formatPercent(
  value: number,
  decimals: number = 2,
  includeSign: boolean = true
): string {
  const sign = includeSign && value > 0 ? '+' : ''
  return `${sign}${value.toFixed(decimals)}%`
}

/**
 * Format a date to a readable string
 * @param date - Date object or timestamp
 * @param includeTime - Whether to include time (default: true)
 * @returns Formatted date string
 */
export function formatDate(date: Date | number, includeTime: boolean = true): string {
  const dateObj = typeof date === 'number' ? new Date(date) : date
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }
  
  if (includeTime) {
    options.hour = 'numeric'
    options.minute = '2-digit'
    options.hour12 = true
  }
  
  return dateObj.toLocaleString('en-US', options)
}
