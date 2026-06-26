import { useEffect, useState } from 'react'
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
  const [lastDoc, setLastDoc] = useState(null)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

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

  function renderTextWithLinks(text) {
    if (!text) return null
    const urlRegex = /(https?:\/\/[^\s<>"'()]+|(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?(?:\/[^\s<>"'()]*)?)/gi
    const parts = []
    let lastIndex = 0
    let match
    while ((match = urlRegex.exec(text)) !== null) {
      const url = match[0]
      const href = /^(https?:\/\/)/i.test(url) ? url : `http://${url}`
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index))
      }
      parts.push(
        <a key={`${url}-${match.index}`} href={href} target="_blank" rel="noreferrer noopener" className="text-sky-600 hover:underline">
          {url}
        </a>
      )
      lastIndex = match.index + url.length
    }
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex))
    }
    return parts.length ? parts : text
  }

  function normalizePostMedia(post) {
    const rawMedia = Array.isArray(post.mediaItems) && post.mediaItems.length
      ? post.mediaItems
      : (Array.isArray(post.imageUrls) && post.imageUrls.length
        ? post.imageUrls.map((url) => ({ url, type: 'image' }))
        : (post.imageUrl ? [{ url: post.imageUrl, type: 'image' }] : []))

    const seen = new Set()
    return rawMedia.reduce((acc, item) => {
      if (!item) return acc
      const url = typeof item === 'string' ? item : item.url
      const type = typeof item === 'object' && item.type ? item.type : 'image'
      if (!url || seen.has(url)) return acc
      seen.add(url)
      acc.push({ url, type })
      return acc
    }, [])
  }

  function renderTimelineMedia(media) {
    if (!media?.length) return null

    const allImages = media.every((item) => item.type === 'image')

    if (media.length === 1) {
      const item = media[0]
      return (
        <div className="rounded-3xl overflow-hidden border border-neutral-200 bg-neutral-100">
          {item.type === 'video' ? (
            <video loading="lazy" src={item.url} controls className="w-full h-64 object-cover" />
          ) : (
            <img loading="lazy" src={item.url} alt="Post media" className="w-full h-64 object-cover" />
          )}
        </div>
      )
    }

    if (allImages) {
      return (
        <div className="grid gap-1">
          {media.length === 2 && (
            <div className="grid grid-cols-2 gap-1">
              {media.map((item, idx) => (
                <img key={idx} loading="lazy" src={item.url} alt={`media-${idx + 1}`} className="w-full h-40 object-cover rounded-xl" />
              ))}
            </div>
          )}
          {media.length === 3 && (
            <div className="grid grid-cols-2 grid-rows-2 gap-1">
              <img loading="lazy" src={media[0].url} alt="media-1" className="row-span-2 w-full h-full object-cover rounded-xl" />
              <img loading="lazy" src={media[1].url} alt="media-2" className="w-full h-full object-cover rounded-xl" />
              <img loading="lazy" src={media[2].url} alt="media-3" className="w-full h-full object-cover rounded-xl" />
            </div>
          )}
          {media.length === 4 && (
            <div className="grid grid-cols-2 gap-1">
              {media.map((item, idx) => (
                <img key={idx} loading="lazy" src={item.url} alt={`media-${idx + 1}`} className="w-full h-40 object-cover rounded-xl" />
              ))}
            </div>
          )}
          {media.length >= 5 && (
            <div className="grid grid-cols-2 gap-1">
              <img loading="lazy" src={media[0].url} alt="media-1" className="row-span-2 w-full h-full object-cover rounded-xl" />
              <img loading="lazy" src={media[1].url} alt="media-2" className="w-full h-48 object-cover rounded-xl" />
              <div className="grid grid-cols-2 gap-1">
                <img loading="lazy" src={media[2].url} alt="media-3" className="w-full h-24 object-cover rounded-xl" />
                <div className="relative w-full h-24 overflow-hidden rounded-xl">
                  <img loading="lazy" src={media[3].url} alt="media-4" className="w-full h-full object-cover" />
                  {media.length > 4 && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-lg font-semibold">+{media.length - 4}</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )
    }

    return (
      <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
        {media.map((item, idx) => (
          <div key={idx} className="overflow-hidden rounded-3xl bg-neutral-100 border border-neutral-200">
            {item.type === 'video' ? (
              <video loading="lazy" src={item.url} muted loop controls className="w-full h-40 object-cover" />
            ) : (
              <img loading="lazy" src={item.url} alt={`media-${idx + 1}`} className="w-full h-40 object-cover" />
            )}
          </div>
        ))}
      </div>
    )
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
      if (photoFile) {
        const res = await uploadProfileImage(photoFile, user.uid, () => {})
        photoURL = res.url
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
        <h2 className="text-lg font-semibold mb-3">Timeline</h2>
        <p className="text-sm text-neutral-500 mb-6">Browse your past posts with richer previews, media cards, and engagement details.</p>
        {posts.length === 0 ? (
          <p className="text-neutral-500">No posts yet.</p>
        ) : (
          <div className="relative border-l border-neutral-200 pl-6">
            {posts.map((p, index) => {
              const media = normalizePostMedia(p)
              const reactionsTotal = Object.values(p.reactions || {}).reduce((sum, value) => sum + (value || 0), 0)

              return (
                <div key={p.id} className="relative mb-8 last:mb-0">
                  <span className="absolute -left-3 top-4 h-6 w-6 rounded-full bg-sky-500 ring-4 ring-white shadow-sm" />
                  <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-sky-600">Post {posts.length - index}</p>
                        <h3 className="text-lg font-semibold text-neutral-900 mt-1">{p.title || 'Untitled memory'}</h3>
                      </div>
                      <span className="text-xs text-neutral-500">{formatRelativeTime(p.createdAt)}</span>
                    </div>

                    {p.caption && (
                      <p className="mt-4 text-sm text-neutral-700 whitespace-pre-wrap wrap-break-word">
                        {renderTextWithLinks(p.caption)}
                      </p>
                    )}

                    {media.length > 0 ? (
                      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(280px,380px)_auto]">
                        <div>{renderTimelineMedia(media)}</div>
                        <div className="space-y-3">
                          <div className="rounded-3xl border border-neutral-100 bg-neutral-50 p-4 text-sm text-neutral-600">
                            <p><span className="font-semibold text-neutral-800">Reactions:</span> {reactionsTotal}</p>
                            <p><span className="font-semibold text-neutral-800">Comments:</span> {p.commentEnabled === false ? 'Disabled' : 'Open'}</p>
                            <p><span className="font-semibold text-neutral-800">Media count:</span> {media.length}</p>
                          </div>
                          {p.tags?.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {p.tags.map((t) => (
                                <span key={t} className="text-xs bg-neutral-100 px-2 py-1 rounded-full text-neutral-700">#{t}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 space-y-3">
                        <div className="rounded-3xl border border-neutral-100 bg-neutral-50 p-4 text-sm text-neutral-600">
                          <p><span className="font-semibold text-neutral-800">Reactions:</span> {reactionsTotal}</p>
                          <p><span className="font-semibold text-neutral-800">Comments:</span> {p.commentEnabled === false ? 'Disabled' : 'Open'}</p>
                          <p><span className="font-semibold text-neutral-800">Media type:</span> None</p>
                        </div>
                        {p.tags?.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {p.tags.map((t) => (
                              <span key={t} className="text-xs bg-neutral-100 px-2 py-1 rounded-full text-neutral-700">#{t}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
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
