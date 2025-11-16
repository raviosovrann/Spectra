// Coinbase API Type Definitions

export interface Account {
  uuid: string
  name: string
  currency: string
  available_balance: {
    value: string
    currency: string
  }
  default: boolean
  active: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
  type: string
  ready: boolean
  hold: {
    value: string
    currency: string
  }
}

export interface Product {
  product_id: string
  price: string
  price_percentage_change_24h: string
  volume_24h: string
  volume_percentage_change_24h: string
  base_increment: string
  quote_increment: string
  quote_min_size: string
  quote_max_size: string
  base_min_size: string
  base_max_size: string
  base_name: string
  quote_name: string
  watched: boolean
  is_disabled: boolean
  new: boolean
  status: string
  cancel_only: boolean
  limit_only: boolean
  post_only: boolean
  trading_disabled: boolean
  auction_mode: boolean
  product_type: string
  quote_currency_id: string
  base_currency_id: string
  mid_market_price: string
}

export interface OrderRequest {
  client_order_id: string
  product_id: string
  side: 'BUY' | 'SELL'
  order_configuration: {
    market_market_ioc?: {
      quote_size?: string
      base_size?: string
    }
    limit_limit_gtc?: {
      base_size: string
      limit_price: string
      post_only: boolean
    }
  }
}

export interface OrderResponse {
  success: boolean
  failure_reason?: string
  order_id?: string
  success_response?: {
    order_id: string
    product_id: string
    side: string
    client_order_id: string
  }
  error_response?: {
    error: string
    message: string
    error_details: string
    preview_failure_reason: string
  }
}

export interface Order {
  order_id: string
  product_id: string
  user_id: string
  order_configuration: {
    market_market_ioc?: {
      quote_size?: string
      base_size?: string
    }
    limit_limit_gtc?: {
      base_size: string
      limit_price: string
      post_only: boolean
    }
  }
  side: 'BUY' | 'SELL'
  client_order_id: string
  status: 'OPEN' | 'FILLED' | 'CANCELLED' | 'EXPIRED' | 'FAILED' | 'PENDING'
  time_in_force: string
  created_time: string
  completion_percentage: string
  filled_size: string
  average_filled_price: string
  fee: string
  number_of_fills: string
  filled_value: string
  pending_cancel: boolean
  size_in_quote: boolean
  total_fees: string
  size_inclusive_of_fees: boolean
  total_value_after_fees: string
  trigger_status: string
  order_type: string
  reject_reason: string
  settled: boolean
  product_type: string
  reject_message: string
  cancel_message: string
}

export interface CoinbaseError {
  error: string
  message: string
  error_details?: string
}
