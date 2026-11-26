import { createContext, useContext, useState, type ReactNode } from 'react'
import type { TopTab } from '@/types'
import { auth } from '@/services/firebase'
import { signOut } from 'firebase/auth'

interface AppContextType {
  topTab: TopTab
  setTopTab: (tab: TopTab) => void
  activeMenu: string
  setActiveMenu: (menu: string) => void
  isSidebarCollapsed: boolean
  toggleSidebar: () => void
  globalSearch: string
  setGlobalSearch: (q: string) => void
  isAuthenticated: boolean
  login: (email?: string) => void
  logout: () => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('isAuthenticated') === 'true'
  })
  const [topTab, setTopTabState] = useState<TopTab>('services')
  const [activeMenu, setActiveMenu] = useState<string>('Hotels & Guest House')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [globalSearch, setGlobalSearch] = useState('')

  const login = (email?: string) => {
    localStorage.setItem('isAuthenticated', 'true')
    if (email) {
      localStorage.setItem('userEmail', email)
    }
    setIsAuthenticated(true)
  }

  const logout = () => {
    localStorage.removeItem('isAuthenticated')
    localStorage.removeItem('userEmail')
    signOut(auth).catch(() => {})
    setIsAuthenticated(false)
  }

  const setTopTab = (tab: TopTab) => {
    setTopTabState(tab)
    if (tab === 'services') {
      setActiveMenu('Hotels & Guest House')
    } else {
      setActiveMenu('Stalls')
    }
  }

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => !prev)
  }

  return (
    <AppContext.Provider
      value={{
        topTab,
        setTopTab,
        activeMenu,
        setActiveMenu,
        isSidebarCollapsed,
        toggleSidebar,
        globalSearch,
        setGlobalSearch,
        isAuthenticated,
        login,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
