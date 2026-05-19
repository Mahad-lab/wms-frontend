import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { api, setToken, removeToken, getToken, type Owner } from '@/lib/api'

interface AuthContextType {
  user: Owner | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: { name: string; email: string; slug: string; password: string }) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Owner | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = getToken()
    if (token) {
      api.auth.me()
        .then(setUser)
        .catch(() => removeToken())
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    const response = await api.auth.login(email, password)
    setToken(response.token)
    setUser(response.user as Owner)
  }

  const register = async (data: { name: string; email: string; slug: string; password: string }) => {
    const response = await api.auth.register(data)
    setToken(response.token)
    setUser(response.user as Owner)
  }

  const logout = () => {
    removeToken()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
