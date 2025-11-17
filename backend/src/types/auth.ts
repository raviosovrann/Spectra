export interface User {
  userId: string
  fullName: string
  username: string
  emailAddress: string
  password: string // hashed
  userCoinbasePublic?: string // encrypted
  userCoinbasePublicIv?: string
  userCoinbasePublicTag?: string
  userCoinbaseSecret?: string // encrypted
  userCoinbaseSecretIv?: string
  userCoinbaseSecretTag?: string
  createdAt: Date
  updatedAt: Date
  lastLogin?: Date
  isActive: boolean
}

export interface UserDTO {
  userId: string
  fullName: string
  username: string
  emailAddress: string
  hasCoinbaseKeys: boolean
  createdAt: Date
  lastLogin?: Date
}

export interface RegisterRequest {
  fullName: string
  username: string
  emailAddress: string
  password: string
}

export interface LoginRequest {
  emailAddress: string
  password: string
}

export interface AuthResponse {
  token: string
  user: UserDTO
}

export interface JWTPayload {
  userId: string
  emailAddress: string
  iat: number
  exp: number
}
