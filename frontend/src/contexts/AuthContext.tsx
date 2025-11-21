import React, { useState, useCallback, useEffect } from 'react'
import axios from 'axios'
import { User, LoginRequest, RegisterRequest } from '../types/auth'
import { AuthContext, AuthContextType } from './AuthContext'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// Configure axios to always send credentials (cookies)
axios.defaults.withCredentials = true

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true) // Start as loading
  const [error, setError] = useState<string | null>(null)

  const verifySession = useCallback(async () => {
    try {
      const response = await axios.get<{ user: User }>(`${API_URL}/api/auth/me`, {
        withCredentials: true, // Send cookies with request
      })
      setUser(response.data.user)
      setToken('cookie-based') // Placeholder
      console.log('Session verified successfully', response.data.user)
      return true
    } catch (err: unknown) {
      // Session is invalid or expired
      console.log('Session verification failed', err)
      setToken(null)
      setUser(null)
      return false
    }
  }, [])

  // Initialize session on mount
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true)
      await verifySession()
      setIsLoading(false)
    }
    
    initAuth()
  }, [verifySession])

  const login = useCallback(async (credentials: LoginRequest) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await axios.post<{ user: User; message: string }>(
        `${API_URL}/api/auth/login`,
        credentials,
        { withCredentials: true } // Important: Send/receive cookies
      )

      const { user: userData } = response.data

      setUser(userData)
      setToken('cookie-based') // Placeholder since token is in HTTP-only cookie
    } catch (err: unknown) {
      const errorMessage = axios.isAxiosError(err) ? err.response?.data?.error || err.message : 'Login failed'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const register = useCallback(
    async (data: RegisterRequest) => {
      setIsLoading(true)
      setError(null)

      try {
        await axios.post(`${API_URL}/api/auth/register`, data, {
          withCredentials: true,
        })

        // Auto-login after registration
        await login({
          identifier: data.emailAddress,
          password: data.password,
        })
      } catch (err: unknown) {
        const errorMessage = axios.isAxiosError(err) ? err.response?.data?.error || err.message : 'Registration failed'
        setError(errorMessage)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [login]
  )

  const logout = useCallback(async () => {
    try {
      // Call backend logout endpoint to clear cookie
      await axios.post(
        `${API_URL}/api/auth/logout`,
        {},
        {
          withCredentials: true,
        }
      )
    } catch (err) {
      // Even if logout fails, clear local state
      console.error('Logout error:', err)
    } finally {
      setToken(null)
      setUser(null)
    }
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
