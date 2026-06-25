import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, collection, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Modal, message, Dropdown } from 'antd'
import {
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  LeftOutlined,
  RightOutlined,
} from '@ant-design/icons'
import { useAuth } from '@/store/AuthContext'
import { deletePost } from '@/services/postsService'
import { formatRelativeTime, getInitials } from '@/lib/utils'
import ReactionBar from '@/features/reactions/components/ReactionBar'
import CommentComposer from '@/features/comments/components/CommentComposer'
import CommentList from '@/features/comments/components/CommentList'

export default function PostCard({ post, onEdit }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [imageOpen, setImageOpen] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [deleting, setDeleting] = useState(false)
  const [commentCount, setCommentCount] = useState(0)

  const isOwner = user?.uid === post.authorId
  const [authorProfile, setAuthorProfile] = useState(null)
  // prepare media list (support new mediaItems and legacy image-only fields)
  const rawMedia = Array.isArray(post.mediaItems) && post.mediaItems.length > 0
    ? post.mediaItems
    : (Array.isArray(post.imageUrls) && post.imageUrls.length > 0
      ? post.imageUrls.map((u, i) => ({ url: u, type: 'image', path: Array.isArray(post.imagePaths) ? post.imagePaths[i] || null : (post.imagePath || null) }))
      : (post.imageUrl ? [{ url: post.imageUrl, type: 'image', path: post.imagePath || null }] : []))

  const media = []
  const _seen = new Set()
  for (const item of rawMedia) {
    if (!item) continue
    const url = typeof item === 'string' ? item : (item.url || '')
    const type = typeof item === 'object' && item.type ? item.type : 'image'
    const path = typeof item === 'object' ? item.path || null : null
    if (!url) continue
    if (_seen.has(url)) continue
    _seen.add(url)
    media.push({ url, type, path })
  }

  // debug: log raw vs normalized media to help track duplication issues
  useEffect(() => {
    try {
      console.debug('[PostCard] debug', { postId: post?.id, rawMedia, media, post })
    } catch (e) {
      /* ignore */
    }
  }, [post?.id, rawMedia?.length, media.length])

  const authorName = (authorProfile?.displayName) || post.authorName || 'Anonymous'
  const photoURL = (authorProfile?.photoURL) || post.authorPhotoURL || null

  useEffect(() => {
    if (!post?.authorId) return
    if (user?.uid === post.authorId) {
      setAuthorProfile(null)
      return
    }

    let unsub = null
    let canceled = false
    import('@/lib/profileCache').then((mod) => {
      if (canceled) return
      unsub = mod.subscribeToProfile(post.authorId, (p) => setAuthorProfile(p))
    }).catch((err) => console.warn('failed loading profileCache', err))
    return () => { canceled = true; if (unsub) unsub() }
  }, [post.authorId, user])

  // subscribe to live comment count for this post
  useEffect(() => {
    if (!post?.id) return
    const commentsCol = collection(doc(db, 'posts', post.id), 'comments')
    const unsub = onSnapshot(commentsCol, (snap) => {
      setCommentCount(snap.size)
    }, (err) => {
      console.warn('comments snapshot error', err)
    })
    return () => unsub()
  }, [post?.id])

  async function handleDelete() {
    Modal.confirm({
      title: 'Delete this post?',
      content: 'This action cannot be undone.',
      okText: 'Delete',
      okButtonProps: { danger: true },
      cancelText: 'Cancel',
      centered: true,
      onOk: async () => {
        setDeleting(true)
        try {
          const mediaPaths = Array.isArray(post.mediaItems)
            ? post.mediaItems.map((item) => item.path).filter(Boolean)
            : (Array.isArray(post.imagePaths) ? post.imagePaths : (post.imagePath ? [post.imagePath] : []))
          await deletePost(post.id, mediaPaths)
          message.success('Post deleted')
        } catch {
          message.error('Failed to delete post')
        } finally {
          setDeleting(false)
        }
      },
    })
  }

  const menuItems = [
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: 'Edit Post',
      onClick: () => onEdit?.(post),
    },
    { type: 'divider' },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: 'Delete Post',
      danger: true,
      onClick: handleDelete,
    },
  ]

  const allImages = media.every((item) => item.type === 'image')

  return (
    <article className="post-card animate-fade-in-up mb-5 bg-white rounded-md shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-neutral-100">
      {/* Post media */}
      {media.length > 1 && allImages && (
        <div className="p-1">
          {/* 2 images: side-by-side */}
          {media.length === 2 && (
            <div className="grid grid-cols-2 gap-1">
              {media.map((item, i) => (
                <div key={i} className="overflow-hidden rounded-md" onClick={() => { setCurrentImageIndex(i); setImageOpen(true) }}>
                  <img loading="lazy" src={item.url} alt={post.caption || `image-${i+1}`} className="w-full h-48 object-cover block hover:scale-105 transition-transform duration-200" />
                </div>
              ))}
            </div>
          )}

          {/* 3 images: large left + two stacked right */}
          {media.length === 3 && (
            <div className="grid grid-cols-2 grid-rows-2 gap-1">
              <div className="row-span-2 overflow-hidden rounded-md" onClick={() => { setCurrentImageIndex(0); setImageOpen(true) }}>
                <img loading="lazy" src={media[0].url} alt="image-1" className="w-full h-full object-cover block hover:scale-105 transition-transform duration-200" />
              </div>
              <div className="overflow-hidden rounded-md" onClick={() => { setCurrentImageIndex(1); setImageOpen(true) }}>
                <img loading="lazy" src={media[1].url} alt="image-2" className="w-full h-full object-cover block hover:scale-105 transition-transform duration-200" />
              </div>
              <div className="overflow-hidden rounded-md" onClick={() => { setCurrentImageIndex(2); setImageOpen(true) }}>
                <img loading="lazy" src={media[2].url} alt="image-3" className="w-full h-full object-cover block hover:scale-105 transition-transform duration-200" />
              </div>
            </div>
          )}

          {/* 4 images: 2x2 grid */}
          {media.length === 4 && (
            <div className="grid grid-cols-2 gap-1">
              {media.map((item, i) => (
                <div key={i} className="overflow-hidden rounded-md" onClick={() => { setCurrentImageIndex(i); setImageOpen(true) }}>
                  <img loading="lazy" src={item.url} alt={`image-${i+1}`} className="w-full h-40 object-cover block hover:scale-105 transition-transform duration-200" />
                </div>
              ))}
            </div>
          )}

          {/* 5+ images: large left, top-right, and two small bottom-right; overlay +N on last */}
          {media.length >= 5 && (
            <div className="grid grid-cols-2 gap-1">
              <div className="row-span-2 overflow-hidden rounded-md" onClick={() => { setCurrentImageIndex(0); setImageOpen(true) }}>
                <img loading="lazy" src={media[0].url} alt="image-1" className="w-full h-full object-cover block hover:scale-105 transition-transform duration-200" />
              </div>
              <div className="overflow-hidden rounded-md" onClick={() => { setCurrentImageIndex(1); setImageOpen(true) }}>
                <img loading="lazy" src={media[1].url} alt="image-2" className="w-full h-48 object-cover block hover:scale-105 transition-transform duration-200" />
              </div>
              <div className="grid grid-cols-2 gap-1">
                <div className="overflow-hidden rounded-md" onClick={() => { setCurrentImageIndex(2); setImageOpen(true) }}>
                  <img loading="lazy" src={media[2].url} alt="image-3" className="w-full h-24 object-cover block hover:scale-105 transition-transform duration-200" />
                </div>
                <div className="overflow-hidden rounded-md relative" onClick={() => { setCurrentImageIndex(3); setImageOpen(true) }}>
                  <img loading="lazy" src={media[3].url} alt="image-4" className="w-full h-24 object-cover block hover:scale-105 transition-transform duration-200" />
                  {media.length > 5 && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-lg font-semibold">+{media.length - 4}</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {media.length > 1 && !allImages && (
        <div className="p-1 grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
          {media.map((item, i) => (
            <div key={i} className="overflow-hidden rounded-md bg-black/5 cursor-pointer" onClick={() => { setCurrentImageIndex(i); setImageOpen(true) }}>
              {item.type === 'video' ? (
                <video src={item.url} className="w-full h-48 object-cover" muted playsInline preload="metadata" />
              ) : (
                <img loading="lazy" src={item.url} alt={post.caption || `media-${i+1}`} className="w-full h-48 object-cover" />
              )}
            </div>
          ))}
        </div>
      )}
      {media.length === 1 && (
        <div className="border-b p-1 flex justify-center">
          <div className="w-full max-w-3xl overflow-hidden rounded-md" onClick={() => { setCurrentImageIndex(0); setImageOpen(true) }}>
            {media[0]?.type === 'video' ? (
              <video controls src={media[0].url} className="w-full h-auto max-h-[60vh] object-contain block mx-auto" />
            ) : (
              <img loading="lazy" src={media[0]?.url} alt={post.caption || `media-1`} className="w-full h-auto max-h-[60vh] object-contain block mx-auto" />
            )}
          </div>
        </div>
      )}
      {media.length === 0 && null}

      <div className="p-4 sm:p-5">
        {/* Author Row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <button onClick={() => navigate(`/profile/${post.authorId}`)} className="flex items-center gap-3 p-0 border-0 bg-transparent cursor-pointer">
              {photoURL ? (
                <img src={photoURL} alt={authorName} className="w-9 h-9 rounded-full object-cover border-2 border-neutral-200 flex-shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center font-bold text-neutral-700 border-2 border-neutral-200 flex-shrink-0">
                  {getInitials(authorName)}
                </div>
              )}

              <div className="text-left">
                <p className="m-0 font-semibold text-sm text-neutral-800 leading-snug">{authorName}</p>
                <p className="m-0 text-xs text-neutral-500 flex items-center gap-1">
                  <ClockCircleOutlined style={{ fontSize: 10 }} />
                  {formatRelativeTime(post.createdAt)}
                  {post.updatedAt && post.updatedAt?.seconds !== post.createdAt?.seconds && (
                    <span className="text-neutral-600"> · edited</span>
                  )}
                </p>
              </div>
            </button>
          </div>

          {/* Menu (owner only) */}
          {isOwner && (
            <Dropdown
              menu={{ items: menuItems }}
              placement="bottomRight"
              trigger={['click']}
            >
              <button className="p-2 rounded-full text-neutral-600 hover:bg-neutral-100">
                <MoreOutlined style={{ fontSize: 18 }} />
              </button>
            </Dropdown>
          )}
        </div>

        {/* Title */}
        {post.title && (
          <h2 className="mb-2 font-semibold text-lg text-neutral-800 leading-tight">{post.title}</h2>
        )}

        {/* Caption / body */}
        {post.caption && (
          <p className="mb-4 text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap">{post.caption}</p>
        )}

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag) => (
              <span key={tag} className="text-xs bg-neutral-100 px-2 py-0.5 rounded">#{tag}</span>
            ))}
          </div>
        )}

        {/* Divider */}
        <div className="border-t my-3" />

        {/* Reactions */}
        <ReactionBar post={post} />

        {/* Action row: reactions total + comments count */}
        <div className="mt-3 flex items-center justify-between text-sm text-neutral-500">
          <div className="flex items-center gap-3">
            <span>{Object.values(post.reactions || {}).reduce((a,b) => a + (b||0), 0)} reactions</span>
            <span>·</span>
            <span>{commentCount} comments</span>
          </div>
          <div />
        </div>

        {/* Comments */}
        <div className="mt-4">
          <CommentComposer postId={post.id} />
          <CommentList postId={post.id} />
        </div>
      </div>

      {/* Lightbox / Gallery Modal */}
      <Modal open={imageOpen} onCancel={() => setImageOpen(false)} footer={null} centered width={900} styles={{ padding: 0 }} closable={false}>
        <div className="relative bg-black/90 p-4 rounded-lg flex flex-col items-center">
          <button aria-label="Close" onClick={() => setImageOpen(false)} className="absolute top-3 right-3 z-50 bg-white/20 hover:bg-white/30 text-white rounded-full w-9 h-9 flex items-center justify-center">
            <CloseOutlined style={{ fontSize: 14 }} />
          </button>

          <div className="w-full flex items-center justify-center mb-2">
            <div className="text-sm text-neutral-200">{post.title || ''}</div>
          </div>
          <div className="w-full flex justify-center relative">
            <button aria-label="Previous media" onClick={() => setCurrentImageIndex((i) => Math.max(0, i - 1))} disabled={currentImageIndex === 0} className="absolute left-2 top-1/2 -translate-y-1/2 z-40 bg-black/40 hover:bg-black/50 text-white rounded-full w-10 h-10 flex items-center justify-center">
              <LeftOutlined />
            </button>
            {media[currentImageIndex]?.type === 'video' ? (
              <video controls src={media[currentImageIndex]?.url} className="max-h-[70vh] max-w-[100%] object-contain rounded-md" />
            ) : (
              <img loading="lazy" src={media[currentImageIndex]?.url} alt={post.caption || `media-${currentImageIndex+1}`} className="max-h-[70vh] max-w-[100%] object-contain rounded-md" />
            )}
            <button aria-label="Next media" onClick={() => setCurrentImageIndex((i) => Math.min(media.length - 1, i + 1))} disabled={currentImageIndex === media.length - 1} className="absolute right-2 top-1/2 -translate-y-1/2 z-40 bg-black/40 hover:bg-black/50 text-white rounded-full w-10 h-10 flex items-center justify-center">
              <RightOutlined />
            </button>
          </div>
          {post.caption && (
            <div className="mt-3 text-sm text-neutral-200 max-w-[90%] text-center">{post.caption}</div>
          )}
          {media.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto w-full py-2">
              {media.map((item, i) => (
                item.type === 'video' ? (
                  <video loading="lazy" key={i} src={item.url} onClick={() => setCurrentImageIndex(i)} className={`w-16 h-12 object-cover rounded cursor-pointer ${i === currentImageIndex ? 'ring-2 ring-white' : ''}`} muted playsInline preload="metadata" />
                ) : (
                  <img loading="lazy" key={i} src={item.url} alt={`thumb-${i}`} onClick={() => setCurrentImageIndex(i)} className={`w-16 h-12 object-cover rounded cursor-pointer ${i === currentImageIndex ? 'ring-2 ring-white' : ''}`} />
                )
              ))}
            </div>
          )}
        </div>
      </Modal>
    </article>
  )
}
