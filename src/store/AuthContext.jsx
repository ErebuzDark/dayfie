import { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db, googleProvider } from '@/lib/firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        // Fetch extended profile from Firestore
        const profileRef = doc(db, 'users', firebaseUser.uid)
        const snap = await getDoc(profileRef)
        if (snap.exists()) {
          setUserProfile(snap.data())
        }
      } else {
        setUser(null)
        setUserProfile(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  async function signInWithGoogle() {
    const result = await signInWithPopup(auth, googleProvider)
    await ensureUserProfile(result.user)
    return result
  }

  async function signInWithEmail(email, password) {
    return signInWithEmailAndPassword(auth, email, password)
  }

  async function signUpWithEmail(email, password, displayName) {
    const result = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(result.user, { displayName })
    await ensureUserProfile(result.user, displayName)
    return result
  }

  async function ensureUserProfile(firebaseUser, displayName) {
    const profileRef = doc(db, 'users', firebaseUser.uid)
    const snap = await getDoc(profileRef)
    if (!snap.exists()) {
      const profile = {
        uid: firebaseUser.uid,
        displayName: displayName || firebaseUser.displayName || 'Anonymous',
        email: firebaseUser.email,
        photoURL: firebaseUser.photoURL || null,
        bio: '',
        createdAt: serverTimestamp(),
      }
      await setDoc(profileRef, profile)
      setUserProfile(profile)
    } else {
      setUserProfile(snap.data())
    }
  }

  async function logout() {
    await signOut(auth)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        setUserProfile,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
