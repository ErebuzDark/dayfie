import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { updateProfile } from 'firebase/auth'
import { uploadImage } from './postsService'

const USERS_COLLECTION = 'users'

export async function getUserProfile(uid) {
  const ref = doc(db, USERS_COLLECTION, uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error('User not found')
  return { uid: snap.id, ...snap.data() }
}

export async function updateUserProfile(uid, { displayName, bio, email, photoURL }) {
  const ref = doc(db, USERS_COLLECTION, uid)
  const data = {}
  if (displayName !== undefined) data.displayName = displayName
  if (bio !== undefined) data.bio = bio
  if (email !== undefined) data.email = email
  if (photoURL !== undefined) data.photoURL = photoURL
  await updateDoc(ref, data)

  // Also update Firebase Auth profile if it's the current user
  if (auth.currentUser && auth.currentUser.uid === uid) {
    const update = {}
    if (displayName !== undefined) update.displayName = displayName
    if (photoURL !== undefined) update.photoURL = photoURL
    if (Object.keys(update).length > 0) {
      await updateProfile(auth.currentUser, update)
    }
  }

  // Propagate displayName and photoURL updates to user's posts so existing posts show new profile info
  try {
    const needsName = displayName !== undefined
    const needsPhoto = photoURL !== undefined
    if (needsName || needsPhoto) {
      const postsCol = collection(db, 'posts')
      const q = query(postsCol, where('authorId', '==', uid))
      const snaps = await getDocs(q)
      if (!snaps.empty) {
        const batch = writeBatch(db)
        snaps.forEach((s) => {
          const postRef = doc(db, 'posts', s.id)
          const updateData = {}
          if (needsName) updateData.authorName = displayName
          if (needsPhoto) updateData.authorPhotoURL = photoURL
          if (Object.keys(updateData).length) batch.update(postRef, updateData)
        })
        await batch.commit()
      }
    }
  } catch (e) {
    // don't block profile update if batch fails; log for debugging
    console.error('Failed to propagate profile to posts', e)
  }
}

export async function uploadProfileImage(file, uid, onProgress) {
  // Reuse Cloudinary upload helper
  return await uploadImage(file, uid, onProgress)
}
