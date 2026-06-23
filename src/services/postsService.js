import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  orderBy,
  serverTimestamp,
  onSnapshot,
  where,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

const POSTS_COLLECTION = 'posts'

// Upload image to Cloudinary (unsigned upload preset)
export async function uploadImage(file, uid, onProgress) {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  const unsignedPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
  if (!cloudName || !unsignedPreset) {
    throw new Error('Cloudinary not configured: set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET')
  }

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', url)

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return
      const progress = (event.loaded / event.total) * 100
      onProgress?.(Math.round(progress))
    }

    xhr.onerror = () => reject(new Error('Upload failed'))
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText)
          // return secure URL and public_id as a path-like identifier
          resolve({ url: res.secure_url, path: res.public_id })
        } catch (e) {
          reject(e)
        }
      } else {
        reject(new Error(`Upload failed: ${xhr.statusText}`))
      }
    }

    const fd = new FormData()
    fd.append('file', file)
    fd.append('upload_preset', unsignedPreset)
    xhr.send(fd)
  })
}

// Delete image from Cloudinary
// Note: Deletion requires Cloudinary API key/secret and should be done server-side.
export async function deleteImage(imagePath) {
  if (!imagePath) return
  console.warn('Client-side image deletion is disabled. Delete images server-side using Cloudinary Admin API for public_id:', imagePath)
}

// Create post
export async function createPost(data) {
  const ref = await addDoc(collection(db, POSTS_COLLECTION), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    reactions: { like: 0, heart: 0, care: 0, laugh: 0, sad: 0, angry: 0 },
    reactedBy: {},
  })
  return ref.id
}

// Update post
export async function updatePost(postId, data) {
  const postRef = doc(db, POSTS_COLLECTION, postId)
  await updateDoc(postRef, {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

// Delete post
export async function deletePost(postId, imagePath) {
  await deleteDoc(doc(db, POSTS_COLLECTION, postId))
  if (imagePath) await deleteImage(imagePath)
}

// Get all posts (real-time)
export function subscribeToPosts(callback) {
  const q = query(
    collection(db, POSTS_COLLECTION),
    orderBy('createdAt', 'desc')
  )
  return onSnapshot(q, (snap) => {
    const posts = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    callback(posts)
  })
}

// Get single post
export async function getPost(postId) {
  const snap = await getDoc(doc(db, POSTS_COLLECTION, postId))
  if (!snap.exists()) throw new Error('Post not found')
  return { id: snap.id, ...snap.data() }
}

// Toggle reaction
export async function toggleReaction(postId, uid, reactionType) {
  const postRef = doc(db, POSTS_COLLECTION, postId)
  const snap = await getDoc(postRef)
  if (!snap.exists()) return

  const data = snap.data()
  const reactedBy = { ...data.reactedBy }
  const reactions = { ...data.reactions }
  const previousReaction = reactedBy[uid]

  // Remove previous reaction if any
  if (previousReaction && previousReaction !== reactionType) {
    reactions[previousReaction] = Math.max(0, (reactions[previousReaction] || 1) - 1)
  }

  if (previousReaction === reactionType) {
    // Toggle off
    delete reactedBy[uid]
    reactions[reactionType] = Math.max(0, (reactions[reactionType] || 1) - 1)
  } else {
    // Set new reaction
    reactedBy[uid] = reactionType
    reactions[reactionType] = (reactions[reactionType] || 0) + 1
  }

  await updateDoc(postRef, { reactions, reactedBy })
}
