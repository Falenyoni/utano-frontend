import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useAuth } from '@/shared/lib/auth/AuthContext'
import { getPracticeFeatures } from './featuresApi'

interface FeaturesContextValue {
  enabledFeatures: string[]
  hasFeature: (key: string) => boolean
}

const FeaturesContext = createContext<FeaturesContextValue | undefined>(undefined)

export function FeaturesProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [enabledFeatures, setEnabledFeatures] = useState<string[]>([])

  useEffect(() => {
    if (!isAuthenticated) {
      setEnabledFeatures([])
      return
    }
    getPracticeFeatures().then(setEnabledFeatures).catch(() => setEnabledFeatures([]))
  }, [isAuthenticated])

  function hasFeature(key: string): boolean {
    return enabledFeatures.includes(key)
  }

  return (
    <FeaturesContext.Provider value={{ enabledFeatures, hasFeature }}>
      {children}
    </FeaturesContext.Provider>
  )
}

export function useFeatures() {
  const ctx = useContext(FeaturesContext)
  if (!ctx) throw new Error('useFeatures must be used within FeaturesProvider')
  return ctx
}
