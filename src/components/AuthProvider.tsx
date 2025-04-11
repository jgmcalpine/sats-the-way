'use client'

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from 'react'
import { fetchProfileMetadataFromRelays } from '@/lib/nostr/profile'

type User = {
  pubkey: string
  name?: string
  picture?: string
}

interface AuthContextType {
  currentUser: User | null
  loading: boolean
  connect: () => Promise<void>
  disconnect: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const LOCAL_STORAGE_KEY = 'nostr_pubkey'

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // 🔁 On mount, check for pubkey in localStorage
  useEffect(() => {
    const loadCachedUser = async () => {
      const savedPubkey = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (savedPubkey) {
        let user: User = { pubkey: savedPubkey }
        try {
          const profile = await fetchProfileMetadataFromRelays(savedPubkey)
          if (profile) {
            user = { ...user, ...profile }
          }
        } catch (e) {
          console.warn('Failed to fetch cached profile:', e)
        }
        setCurrentUser(user)
      }
      setLoading(false)
    }

    loadCachedUser()
  }, [])

  const connect = async () => {
    setLoading(true)
    try {
      if (!(window as any).nostr) throw new Error('Nostr extension not found')

      const pubkey = await (window as any).nostr.getPublicKey()
      localStorage.setItem(LOCAL_STORAGE_KEY, pubkey)

      let user: User = { pubkey }
      try {
        const profile = await fetchProfileMetadataFromRelays(pubkey)
        if (profile) {
          user = { ...user, ...profile }
        }
      } catch (e) {
        console.warn('Failed to fetch profile after connect:', e)
      }

      setCurrentUser(user)
    } catch (e) {
      console.warn('Failed to connect Nostr:', e)
    } finally {
      setLoading(false)
    }
  }

  const disconnect = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY)
    setCurrentUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        connect,
        disconnect,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
