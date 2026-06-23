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
  // prepare images array (support legacy single image and new multiple images)
  const rawImages = Array.isArray(post.imageUrls) && post.imageUrls.length > 0 ? post.imageUrls : (post.imageUrl ? [post.imageUrl] : [])
  // normalize and dedupe
  const images = []
  const _seen = new Set()
  for (const it of rawImages) {
    if (!it) continue
    const url = typeof it === 'string' ? it : (it.url || '')
    if (!url) continue
    if (_seen.has(url)) continue
    _seen.add(url)
    images.push(url)
  }

  // debug: log raw vs normalized images to help track duplication issues
  useEffect(() => {
    try {
      console.debug('[PostCard] debug', { postId: post?.id, rawImages, images, post })
    } catch (e) {
      /* ignore */
    }
  }, [post?.id, rawImages?.length, images.length])

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
          await deletePost(post.id, post.imagePath)
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

  return (
    <article className="post-card animate-fade-in-up mb-5 bg-white rounded-md shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-neutral-100">
      {/* Post Images (single or multiple) */}
      {images.length > 1 && (
        <div className="p-1">
          {/* 2 images: side-by-side */}
          {images.length === 2 && (
            <div className="grid grid-cols-2 gap-1">
              {images.map((src, i) => (
                <div key={i} className="overflow-hidden rounded-md" onClick={() => { setCurrentImageIndex(i); setImageOpen(true) }}>
                  <img loading="lazy" src={src} alt={post.caption || `image-${i+1}`} className="w-full h-48 object-cover block hover:scale-105 transition-transform duration-200" />
                </div>
              ))}
            </div>
          )}

          {/* 3 images: large left + two stacked right */}
          {images.length === 3 && (
            <div className="grid grid-cols-2 grid-rows-2 gap-1">
              <div className="row-span-2 overflow-hidden rounded-md" onClick={() => { setCurrentImageIndex(0); setImageOpen(true) }}>
                <img loading="lazy" src={images[0]} alt="image-1" className="w-full h-full object-cover block hover:scale-105 transition-transform duration-200" />
              </div>
              <div className="overflow-hidden rounded-md" onClick={() => { setCurrentImageIndex(1); setImageOpen(true) }}>
                <img loading="lazy" src={images[1]} alt="image-2" className="w-full h-full object-cover block hover:scale-105 transition-transform duration-200" />
              </div>
              <div className="overflow-hidden rounded-md" onClick={() => { setCurrentImageIndex(2); setImageOpen(true) }}>
                <img loading="lazy" src={images[2]} alt="image-3" className="w-full h-full object-cover block hover:scale-105 transition-transform duration-200" />
              </div>
            </div>
          )}

          {/* 4 images: 2x2 grid */}
          {images.length === 4 && (
            <div className="grid grid-cols-2 gap-1">
              {images.map((src, i) => (
                <div key={i} className="overflow-hidden rounded-md" onClick={() => { setCurrentImageIndex(i); setImageOpen(true) }}>
                  <img loading="lazy" src={src} alt={`image-${i+1}`} className="w-full h-40 object-cover block hover:scale-105 transition-transform duration-200" />
                </div>
              ))}
            </div>
          )}

          {/* 5+ images: large left, top-right, and two small bottom-right; overlay +N on last */}
          {images.length >= 5 && (
            <div className="grid grid-cols-2 gap-1">
              <div className="row-span-2 overflow-hidden rounded-md" onClick={() => { setCurrentImageIndex(0); setImageOpen(true) }}>
                <img loading="lazy" src={images[0]} alt="image-1" className="w-full h-full object-cover block hover:scale-105 transition-transform duration-200" />
              </div>
              <div className="overflow-hidden rounded-md" onClick={() => { setCurrentImageIndex(1); setImageOpen(true) }}>
                <img loading="lazy" src={images[1]} alt="image-2" className="w-full h-48 object-cover block hover:scale-105 transition-transform duration-200" />
              </div>
              <div className="grid grid-cols-2 gap-1">
                <div className="overflow-hidden rounded-md" onClick={() => { setCurrentImageIndex(2); setImageOpen(true) }}>
                  <img loading="lazy" src={images[2]} alt="image-3" className="w-full h-24 object-cover block hover:scale-105 transition-transform duration-200" />
                </div>
                <div className="overflow-hidden rounded-md relative" onClick={() => { setCurrentImageIndex(3); setImageOpen(true) }}>
                  <img loading="lazy" src={images[3]} alt="image-4" className="w-full h-24 object-cover block hover:scale-105 transition-transform duration-200" />
                  {images.length > 5 && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-lg font-semibold">+{images.length - 4}</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {/* {images.length > 1 && (
        <div className={`grid gap-1 border-b p-1 ${images.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {images.slice(0, 6).map((src, i) => (
            <div key={i} className={`overflow-hidden rounded-md ${images.length === 2 ? '' : (i === 0 ? 'col-span-2 row-span-2' : '')}`} onClick={() => { setCurrentImageIndex(i); setImageOpen(true) }}>
              <img loading="lazy" src={src} alt={post.caption || `image-${i+1}`} className="w-full h-36 object-cover block hover:scale-105 transition-transform duration-200" />
            </div>
          ))}
        </div>
      )} */}

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
      <Modal open={imageOpen} onCancel={() => setImageOpen(false)} footer={null} centered width={900} bodyStyle={{ padding: 0 }} closable={false}>
        <div className="relative bg-black/90 p-4 rounded-lg flex flex-col items-center">
          <button aria-label="Close" onClick={() => setImageOpen(false)} className="absolute top-3 right-3 z-50 bg-white/20 hover:bg-white/30 text-white rounded-full w-9 h-9 flex items-center justify-center">
            <CloseOutlined style={{ fontSize: 14 }} />
          </button>

          <div className="w-full flex items-center justify-center mb-2">
            <div className="text-sm text-neutral-200">{post.title || ''}</div>
          </div>
          <div className="w-full flex justify-center relative">
            <button aria-label="Previous image" onClick={() => setCurrentImageIndex((i) => Math.max(0, i - 1))} disabled={currentImageIndex === 0} className="absolute left-2 top-1/2 -translate-y-1/2 z-40 bg-black/40 hover:bg-black/50 text-white rounded-full w-10 h-10 flex items-center justify-center">
              <LeftOutlined />
            </button>
            <img loading="lazy" src={images[currentImageIndex]} alt={post.caption || `image-${currentImageIndex+1}`} className="max-h-[70vh] max-w-[100%] object-contain rounded-md" />
            <button aria-label="Next image" onClick={() => setCurrentImageIndex((i) => Math.min(images.length - 1, i + 1))} disabled={currentImageIndex === images.length - 1} className="absolute right-2 top-1/2 -translate-y-1/2 z-40 bg-black/40 hover:bg-black/50 text-white rounded-full w-10 h-10 flex items-center justify-center">
              <RightOutlined />
            </button>
          </div>
          {post.caption && (
            <div className="mt-3 text-sm text-neutral-200 max-w-[90%] text-center">{post.caption}</div>
          )}
          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto w-full py-2">
              {images.map((s, i) => (
                <img loading="lazy" key={i} src={s} alt={`thumb-${i}`} onClick={() => setCurrentImageIndex(i)} className={`w-16 h-12 object-cover rounded cursor-pointer ${i === currentImageIndex ? 'ring-2 ring-white' : ''}`} />
              ))}
            </div>
          )}
        </div>
      </Modal>
    </article>
  )
}
