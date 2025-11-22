import { createContext } from 'react'
import { User, LoginRequest, RegisterRequest } from '../types/auth'

export interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  error: string | null
  login: (credentials: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => void
  clearError: () => void
  refreshUser: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Re-export AuthProvider from the implementation file
export { AuthProvider } from './AuthContext.tsx'
