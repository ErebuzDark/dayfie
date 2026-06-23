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
import CommentComposer from '@/features/comments/components/CommentComposer'
import CommentList from '@/features/comments/components/CommentList'

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
    <article className="post-card animate-fade-in-up mb-5">
      {/* Post Image */}
      {post.imageUrl && (
        <div className="w-full max-h-[420px] overflow-hidden cursor-pointer border-b" onClick={() => setImageOpen(true)}>
          <img
            src={post.imageUrl}
            alt={post.caption || 'Post image'}
            className="w-full h-full object-cover block transition-transform duration-300 max-h-[420px]"
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.015)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          />
        </div>
      )}

      <div className="p-4 sm:p-5">
        {/* Author Row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            {photoURL ? (
              <img src={photoURL} alt={authorName} className="w-9 h-9 rounded-full object-cover border-2 border-neutral-200 flex-shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center font-bold text-neutral-700 border-2 border-neutral-200 flex-shrink-0">
                {getInitials(authorName)}
              </div>
            )}

            <div>
              <p className="m-0 font-semibold text-sm text-neutral-800 leading-snug">{authorName}</p>
              <p className="m-0 text-xs text-neutral-500 flex items-center gap-1">
                <ClockCircleOutlined style={{ fontSize: 10 }} />
                {formatRelativeTime(post.createdAt)}
                {post.updatedAt && post.updatedAt?.seconds !== post.createdAt?.seconds && (
                  <span className="text-neutral-600"> · edited</span>
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
          <div className="flex flex-wrap gap-1 mb-4">
            {post.tags.map((tag) => (
              <span key={tag} className="tag-chip">#{tag}</span>
            ))}
          </div>
        )}

        {/* Divider */}
        <div className="divider my-3" />

        {/* Reactions */}
        <ReactionBar post={post} />

        {/* Comments */}
        <div className="mt-4">
          <CommentComposer postId={post.id} />
          <CommentList postId={post.id} />
        </div>
      </div>

      {/* Lightbox */}
      <Modal open={imageOpen} onCancel={() => setImageOpen(false)} footer={null} centered width="auto" bodyStyle={{ padding: 0 }}>
        <img src={post.imageUrl} alt={post.caption || 'Post image'} className="max-w-[90vw] max-h-[85vh] object-contain block rounded-lg" />
      </Modal>
    </article>
  )
}
