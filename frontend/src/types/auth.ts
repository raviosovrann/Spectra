export interface User {
  userId: string
  fullName: string
  username: string
  emailAddress: string
  hasCoinbaseKeys: boolean
  createdAt: string
  lastLogin?: string
}

export interface LoginRequest {
  emailAddress: string
  password: string
}

export interface RegisterRequest {
  fullName: string
  username: string
  emailAddress: string
  password: string
}

export interface AuthResponse {
  token: string
  user: User
}
