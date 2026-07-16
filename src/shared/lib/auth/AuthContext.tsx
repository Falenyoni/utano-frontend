import { createContext, useContext, useState, type ReactNode } from 'react'

export interface User {
  userId: string
  fullName: string
  email: string
  role: string
  roles: string[]
  permissions: string[]
  practiceId: string
  practiceName: string
  primaryColor?: string | null
  logoBase64?: string | null
}

function applyBrandingVars(primaryColor?: string | null) {
  document.documentElement.style.setProperty('--color-primary', primaryColor || '#3b82f6')
}

export interface LoginResponse extends User {
  accessToken: string
  refreshToken: string
  expiresAt: string
}

export interface StoredAuth {
  user: User
  accessToken: string
  refreshToken: string
  expiresAt: string
}

const STORAGE_KEY = 'utano_auth'

export function getStoredAuth(): StoredAuth | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function setStoredTokens(accessToken: string, refreshToken: string, expiresAt: string) {
  const existing = getStoredAuth()
  if (!existing) return
  const updated = { ...existing, accessToken, refreshToken, expiresAt }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
}

export function clearStoredAuth() {
  localStorage.removeItem(STORAGE_KEY)
}

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  login: (response: LoginResponse) => void
  logout: () => void
  hasPermission: (permission: string) => boolean
  hasAnyRole: (...roles: string[]) => boolean
  updateBranding: (primaryColor: string | null, logoBase64: string | null) => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = getStoredAuth()
    // Apply saved branding once on initialisation (safe side-effect in lazy initializer)
    if (stored?.user?.primaryColor) applyBrandingVars(stored.user.primaryColor)
    return stored?.user ?? null
  })

  function login(response: LoginResponse) {
    const { accessToken, refreshToken, expiresAt, ...userData } = response
    setUser(userData)
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ user: userData, accessToken, refreshToken, expiresAt }),
    )
    applyBrandingVars(userData.primaryColor)
  }

  function logout() {
    setUser(null)
    clearStoredAuth()
    applyBrandingVars(null)
  }

  function hasPermission(permission: string): boolean {
    return user?.permissions.includes(permission) ?? false
  }

  function hasAnyRole(...roles: string[]): boolean {
    return roles.some((r) => user?.roles.includes(r) ?? false)
  }

  function updateBranding(primaryColor: string | null, logoBase64: string | null) {
    setUser((u) => {
      if (!u) return u
      const updated = { ...u, primaryColor, logoBase64 }
      const s = getStoredAuth()
      if (s) localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...s, user: updated }))
      return updated
    })
    applyBrandingVars(primaryColor)
  }

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: user !== null, login, logout, hasPermission, hasAnyRole, updateBranding }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
