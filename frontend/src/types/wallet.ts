export interface CoinbaseAccount {
  uuid: string
  name: string
  currency: string
  available_balance: {
    value: string
    currency: string
  }
  hold: {
    value: string
    currency: string
  }
  type: string
  active: boolean
}

export interface CoinbasePaymentMethod {
  id: string
  type: string
  name?: string
  currency?: string
  allow_deposit?: boolean
  allow_withdraw?: boolean
  allow_buy?: boolean
  allow_sell?: boolean
  primary_buy?: boolean
  primary_sell?: boolean
  resource?: string
  resource_path?: string
}
