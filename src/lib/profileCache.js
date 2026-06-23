import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'

// Simple in-memory profile subscription cache to avoid duplicate listeners
const cache = new Map()

export function subscribeToProfile(uid, cb) {
  if (!uid) return () => {}

  let entry = cache.get(uid)
  if (!entry) {
    entry = { data: null, subs: new Set(), unsub: null }
    const userDoc = doc(db, 'users', uid)
    const unsub = onSnapshot(userDoc, (snap) => {
      const val = snap.exists() ? snap.data() : null
      entry.data = val
      entry.subs.forEach((s) => s(val))
    }, (err) => {
      console.warn('profileCache snapshot error', err)
    })
    entry.unsub = unsub
    cache.set(uid, entry)
  }

  entry.subs.add(cb)
  // call immediately with cached data if available
  if (entry.data) cb(entry.data)

  return () => {
    const e = cache.get(uid)
    if (!e) return
    e.subs.delete(cb)
    if (e.subs.size === 0) {
      e.unsub()
      cache.delete(uid)
    }
  }
}

export function getCachedProfile(uid) {
  const e = cache.get(uid)
  return e ? e.data : null
}
