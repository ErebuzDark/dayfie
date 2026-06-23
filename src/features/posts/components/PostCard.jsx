import { useState } from 'react'
import { Modal, message, Dropdown } from 'antd'
import {
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons'
import { useAuth } from '@/store/AuthContext'
import { deletePost } from '@/services/postsService'
import { formatRelativeTime, getInitials } from '@/lib/utils'
import ReactionBar from '@/features/reactions/components/ReactionBar'

export default function PostCard({ post, onEdit }) {
  const { user } = useAuth()
  const [imageOpen, setImageOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const isOwner = user?.uid === post.authorId
  const authorName = post.authorName || 'Anonymous'
  const photoURL = post.authorPhotoURL

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
    <article className="post-card animate-fade-in-up" style={{ marginBottom: '1.25rem' }}>
      {/* Post Image */}
      {post.imageUrl && (
        <div
          style={{
            width: '100%',
            maxHeight: 420,
            overflow: 'hidden',
            cursor: 'pointer',
            borderBottom: '1px solid oklch(94% 0 0)',
          }}
          onClick={() => setImageOpen(true)}
        >
          <img
            src={post.imageUrl}
            alt={post.caption || 'Post image'}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              transition: 'transform 0.4s ease',
              maxHeight: 420,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.015)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          />
        </div>
      )}

      <div style={{ padding: '1.1rem 1.25rem' }}>
        {/* Author Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.85rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {/* Avatar */}
            {photoURL ? (
              <img
                src={photoURL}
                alt={authorName}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid oklch(91% 0 0)',
                  flexShrink: 0,
                }}
              />
            ) : (
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  background: 'oklch(96% 0.04 265)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  color: 'oklch(55% 0.18 265)',
                  border: '2px solid oklch(91% 0 0)',
                  flexShrink: 0,
                }}
              >
                {getInitials(authorName)}
              </div>
            )}

            <div>
              <p
                style={{
                  margin: 0,
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  color: 'oklch(16% 0 0)',
                  lineHeight: 1.3,
                }}
              >
                {authorName}
              </p>
              <p
                style={{
                  margin: 0,
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: '0.75rem',
                  color: 'oklch(58% 0 0)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                <ClockCircleOutlined style={{ fontSize: 10 }} />
                {formatRelativeTime(post.createdAt)}
                {post.updatedAt &&
                  post.updatedAt?.seconds !== post.createdAt?.seconds && (
                    <span style={{ color: 'oklch(72% 0 0)' }}> · edited</span>
                  )}
              </p>
            </div>
          </div>

          {/* Menu (owner only) */}
          {isOwner && (
            <Dropdown
              menu={{ items: menuItems }}
              placement="bottomRight"
              trigger={['click']}
            >
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.3rem',
                  borderRadius: '50%',
                  color: 'oklch(58% 0 0)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'oklch(95% 0 0)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
              >
                <MoreOutlined style={{ fontSize: 18 }} />
              </button>
            </Dropdown>
          )}
        </div>

        {/* Title */}
        {post.title && (
          <h2
            style={{
              margin: '0 0 0.5rem 0',
              fontFamily: 'Poppins, sans-serif',
              fontWeight: 600,
              fontSize: '1.05rem',
              color: 'oklch(16% 0 0)',
              lineHeight: 1.4,
            }}
          >
            {post.title}
          </h2>
        )}

        {/* Caption / body */}
        {post.caption && (
          <p
            style={{
              margin: '0 0 0.9rem 0',
              fontFamily: 'Poppins, sans-serif',
              fontSize: '0.9rem',
              color: 'oklch(36% 0 0)',
              lineHeight: 1.7,
              whiteSpace: 'pre-wrap',
            }}
          >
            {post.caption}
          </p>
        )}

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.9rem' }}>
            {post.tags.map((tag) => (
              <span key={tag} className="tag-chip">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Divider */}
        <div className="divider" style={{ margin: '0.75rem 0' }} />

        {/* Reactions */}
        <ReactionBar post={post} />
      </div>

      {/* Lightbox */}
      <Modal
        open={imageOpen}
        onCancel={() => setImageOpen(false)}
        footer={null}
        centered
        width="auto"
        styles={{ body: { padding: 0 }, content: { background: 'transparent', boxShadow: 'none', borderRadius: '1rem', overflow: 'hidden' } }}
      >
        <img
          src={post.imageUrl}
          alt={post.caption || 'Post image'}
          style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain', display: 'block', borderRadius: '1rem' }}
        />
      </Modal>
    </article>
  )
}
