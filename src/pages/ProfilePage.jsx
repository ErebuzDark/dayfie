import { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '@/store/AuthContext'
import { getUserProfile, updateUserProfile, uploadProfileImage } from '@/services/userService'
import { getInitials, formatRelativeTime } from '@/lib/utils'
import { message, Input, Button, Upload, Spin } from 'antd'
import { CameraOutlined, CloseOutlined } from '@ant-design/icons'
import { getUserPosts } from '@/services/postsService'

export default function ProfilePage() {
  const { uid: routeUid } = useParams()
  const { user, userProfile, setUserProfile } = useAuth()
  const me = user?.uid === routeUid || !routeUid
  const targetUid = routeUid || user?.uid

  const [profile, setProfile] = useState(null)
  const [editing, setEditing] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [email, setEmail] = useState('')
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [posts, setPosts] = useState([])

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        if (me && userProfile) {
          setProfile(userProfile)
          setDisplayName(userProfile.displayName || '')
          setBio(userProfile.bio || '')
          setEmail(userProfile.email || '')
          setPhotoPreview(userProfile.photoURL || null)
        } else if (targetUid) {
          const p = await getUserProfile(targetUid)
          if (!mounted) return
          setProfile(p)
          setDisplayName(p.displayName || '')
          setBio(p.bio || '')
          setEmail(p.email || '')
          setPhotoPreview(p.photoURL || null)
        }
      } catch (e) {
        console.error(e)
        message.error('Failed to load profile')
      }
    }
    load()
    return () => { mounted = false }
  }, [targetUid, userProfile, me])

  useEffect(() => {
    let mounted = true
    if (!targetUid) return
    async function load() {
      try {
        const { posts: fetched, last } = await getUserPosts(targetUid, 6, null)
        if (!mounted) return
        setPosts(fetched)
        setLastDoc(last)
        setHasMore(Boolean(last))
      } catch (e) {
        console.error(e)
      }
    }
    load()
    return () => { mounted = false }
  }, [targetUid])

  const [lastDoc, setLastDoc] = useState(null)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  async function loadMore() {
    if (!hasMore || loadingMore) return
    setLoadingMore(true)
    try {
      const { posts: fetched, last } = await getUserPosts(targetUid, 6, lastDoc)
      setPosts((prev) => [...prev, ...fetched])
      setLastDoc(last)
      setHasMore(Boolean(last))
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingMore(false)
    }
  }

  function handleSelectPhoto(file) {
    const isImage = file.type && file.type.startsWith('image/')
    const isLt2M = file.size / 1024 / 1024 < 2
    if (!isImage) { message.error('Please select an image'); return Upload.LIST_IGNORE }
    if (!isLt2M) { message.error('Image must be smaller than 2MB'); return Upload.LIST_IGNORE }
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
    return false
  }

  function removePhoto() {
    setPhotoFile(null)
    setPhotoPreview(null)
  }

  async function handleSave() {
    if (!me) return
    setSaving(true)
    try {
      let photoURL = profile?.photoURL || null
      let photoPath = null
      if (photoFile) {
        const res = await uploadProfileImage(photoFile, user.uid, () => {})
        photoURL = res.url
        photoPath = res.path
      }
      await updateUserProfile(user.uid, { displayName: displayName.trim(), bio: bio.trim(), email: email.trim(), photoURL })
      // update local context
      if (setUserProfile) {
        setUserProfile({ ...(userProfile || {}), displayName: displayName.trim(), bio: bio.trim(), email: email.trim(), photoURL })
      }
      message.success('Profile updated')
      setEditing(false)
    } catch (e) {
      console.error(e)
      message.error('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  if (!profile) return <div className="p-6"><Spin /></div>

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center gap-4">
        {photoPreview ? (
          <img src={photoPreview} alt={profile.displayName} className="w-28 h-28 rounded-full object-cover" />
        ) : (
          <div className="w-28 h-28 rounded-full bg-neutral-100 flex items-center justify-center text-2xl font-bold text-neutral-700">
            {getInitials(profile.displayName || '')}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold">{profile.displayName}</h1>
          <p className="text-sm text-neutral-500">{profile.email}</p>
          <p className="mt-2 text-neutral-700">{profile.bio}</p>
          {me && (
            <div className="mt-3">
              {!editing ? (
                <Button onClick={() => setEditing(true)}>Edit Profile</Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button onClick={() => setEditing(false)}>Cancel</Button>
                  <Button type="primary" loading={saving} onClick={handleSave}>Save</Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {editing && me && (
        <div className="mt-6 grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1">Display name</label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1">Bio</label>
            <Input.TextArea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1">Email</label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1">Profile photo</label>
            <div>
              {photoPreview ? (
                <div className="relative inline-block">
                  <img src={photoPreview} alt="preview" className="w-20 h-20 rounded-full object-cover" />
                  <button onClick={removePhoto} className="absolute -top-2 -right-2 bg-black/60 rounded-full w-7 h-7 flex items-center justify-center text-white"><CloseOutlined /></button>
                </div>
              ) : (
                <Upload beforeUpload={handleSelectPhoto} showUploadList={false} accept="image/*">
                  <Button icon={<CameraOutlined />}>Upload Photo</Button>
                </Upload>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-10">
        <h2 className="text-lg font-semibold mb-3">Posts</h2>
        {posts.length === 0 ? (
          <p className="text-neutral-500">No posts yet.</p>
        ) : (
          <div className="grid gap-4">
            {posts.map((p) => (
              <div key={p.id} className="p-4 border rounded-lg flex gap-4 items-start">
                {(() => {
                  const firstMedia = Array.isArray(p.mediaItems) && p.mediaItems.length ? p.mediaItems[0] : (Array.isArray(p.imageUrls) && p.imageUrls.length ? { url: p.imageUrls[0], type: 'image' } : (p.imageUrl ? { url: p.imageUrl, type: 'image' } : null))
                  return firstMedia ? (
                    firstMedia.type === 'video' ? (
                      <video loading="lazy" src={firstMedia.url} muted loop className="w-28 h-20 object-cover rounded-md flex-shrink-0" />
                    ) : (
                      <img loading="lazy" src={firstMedia.url} alt={p.caption || p.title || 'Post image'} className="w-28 h-20 object-cover rounded-md flex-shrink-0" />
                    )
                  ) : (
                    <div className="w-28 h-20 bg-neutral-50 rounded-md flex items-center justify-center text-neutral-400">No media</div>
                  )
                })()}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">{p.title || 'Untitled'}</h3>
                    <small className="text-xs text-neutral-500">{formatRelativeTime(p.createdAt)}</small>
                  </div>
                  {p.caption && <p className="text-sm text-neutral-600 mt-1 truncate">{p.caption}</p>}
                  {p.tags?.length > 0 && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {p.tags.map((t) => (
                        <span key={t} className="text-xs bg-neutral-100 px-2 py-0.5 rounded">#{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {hasMore && (
              <div className="text-center mt-2">
                <Button onClick={loadMore} loading={loadingMore}>Load more</Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
