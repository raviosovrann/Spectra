import React, { createContext, useState, useCallback, useEffect } from 'react'
import axios from 'axios'
import { User, LoginRequest, RegisterRequest, AuthResponse } from '../types/auth'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  error: string | null
  login: (credentials: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => void
  clearError: () => void
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const verifyToken = useCallback(async (authToken: string) => {
    try {
      const response = await axios.get<{ user: User }>(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      setUser(response.data.user)
    } catch (err: unknown) {
      // Token is invalid or expired
      localStorage.removeItem('spectra_auth_token')
      setToken(null)
      setUser(null)
    }
  }, [])

  // Initialize from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('spectra_auth_token')
    if (storedToken) {
      setToken(storedToken)
      // Verify token is still valid
      verifyToken(storedToken).catch(() => {
        // Token verification failed, user will be logged out
      })
    }
  }, [verifyToken])

  // Set up axios interceptor to include token
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
      delete axios.defaults.headers.common['Authorization']
    }
  }, [token])

  const login = useCallback(async (credentials: LoginRequest) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await axios.post<AuthResponse>(`${API_URL}/api/auth/login`, credentials)

      const { token: newToken, user: userData } = response.data

      setToken(newToken)
      setUser(userData)
      localStorage.setItem('spectra_auth_token', newToken)
    } catch (err: unknown) {
      const errorMessage = axios.isAxiosError(err) ? err.response?.data?.error || err.message : 'Login failed'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const register = useCallback(async (data: RegisterRequest) => {
    setIsLoading(true)
    setError(null)

    try {
      await axios.post(`${API_URL}/api/auth/register`, data)

      // Auto-login after registration
      await login({
        emailAddress: data.emailAddress,
        password: data.password,
      })
    } catch (err: unknown) {
      const errorMessage = axios.isAxiosError(err) ? err.response?.data?.error || err.message : 'Registration failed'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [login])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('spectra_auth_token')
    delete axios.defaults.headers.common['Authorization']
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
