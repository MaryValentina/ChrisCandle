import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  type User,
} from 'firebase/auth'
import { getAuthInstance } from '../lib/firebase'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { getDb } from '../lib/firebase'

interface AuthContextType {
  currentUser: User | null
  organizerId: string | null
  organizerName: string | null
  loading: boolean
  signup: (email: string, password: string, name: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [organizerId, setOrganizerId] = useState<string | null>(null)
  const [organizerName, setOrganizerName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const auth = getAuthInstance()
    if (!auth) {
      setLoading(false)
      return
    }

    // Configure auth persistence to use localStorage (default, but explicit for reliability)
    setPersistence(auth, browserLocalPersistence).catch((error) => {
      console.error('Failed to set auth persistence:', error)
    })

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user)
      
      if (user) {
        // Get organizer data from Firestore
        try {
          const db = getDb()
          if (db) {
            const userDoc = await getDoc(doc(db, 'users', user.uid))
            if (userDoc.exists()) {
              const userData = userDoc.data()
              setOrganizerId(user.uid)
              setOrganizerName(userData.name || user.displayName || null)
            } else {
              // User exists in auth but not in Firestore - create user doc
              setOrganizerId(user.uid)
              setOrganizerName(user.displayName || null)
            }
          } else {
            setOrganizerId(user.uid)
            setOrganizerName(user.displayName || null)
          }
        } catch (error) {
          console.error('Error fetching user data:', error)
          setOrganizerId(user.uid)
          setOrganizerName(user.displayName || null)
        }
      } else {
        setOrganizerId(null)
        setOrganizerName(null)
      }
      
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const signup = async (email: string, password: string, name: string) => {
    const auth = getAuthInstance()
    if (!auth) {
      throw new Error('Firebase Auth is not configured')
    }

    const db = getDb()
    if (!db) {
      throw new Error('Firestore is not configured')
    }

    // Create user account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Update display name
    await updateProfile(user, { displayName: name })

    // Create user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      email: user.email,
      name: name,
      createdAt: new Date().toISOString(),
    })

    setOrganizerId(user.uid)
    setOrganizerName(name)
  }

  const login = async (email: string, password: string) => {
    const auth = getAuthInstance()
    if (!auth) {
      throw new Error('Firebase Auth is not configured')
    }

    await signInWithEmailAndPassword(auth, email, password)
  }

  const logout = async () => {
    const auth = getAuthInstance()
    if (!auth) {
      throw new Error('Firebase Auth is not configured')
    }

    await signOut(auth)
    setOrganizerId(null)
    setOrganizerName(null)
  }

  const value: AuthContextType = {
    currentUser,
    organizerId,
    organizerName,
    loading,
    signup,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

