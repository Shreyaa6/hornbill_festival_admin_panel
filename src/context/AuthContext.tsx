import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { User } from '@/types'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const MOCK_ADMIN: User = {
  id: 'usr_admin_01',
  name: 'Festival Coordinator',
  email: 'admin@hornbillfestival.gov.in',
  role: 'superadmin',
  createdAt: '2026-01-01T00:00:00Z',
  lastLogin: new Date().toISOString(),
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('hornbill_auth_user')
    return saved ? JSON.parse(saved) : MOCK_ADMIN
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (user) {
      localStorage.setItem('hornbill_auth_user', JSON.stringify(user))
    } else {
      localStorage.removeItem('hornbill_auth_user')
    }
  }, [user])

  const login = async (email: string) => {
    setIsLoading(true)
    try {
      // Simulate auth call
      await new Promise((r) => setTimeout(r, 400))
      setUser({ ...MOCK_ADMIN, email })
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
