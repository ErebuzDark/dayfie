import { Modal } from 'antd'
import { useState } from 'react'
import { useAuth } from '@/store/AuthContext'
import ReactionBar from '@/features/reactions/components/ReactionBar'
import { formatRelativeTime, getInitials } from '@/lib/utils'
import { deleteComment, toggleCommentReaction } from '@/services/postsService'
import CommentComposer from './CommentComposer'

export default function CommentCard({ comment, postId, replies = [] , isReply = false }) {
  const { user } = useAuth()
  const [showReply, setShowReply] = useState(false)

  const isOwner = user?.uid === comment.authorId

  async function handleDelete() {
    Modal.confirm({
      title: 'Delete this comment?',
      okText: 'Delete',
      okButtonProps: { danger: true },
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await deleteComment(postId, comment.id)
        } catch (e) {
          console.warn(e)
        }
      },
    })
  }

  return (
    <div style={{ display: 'flex', gap: '0.7rem', padding: isReply ? '0.3rem 0' : '0.6rem 0', marginLeft: isReply ? 36 : 0 }}>
      {comment.authorPhotoURL ? (
        <img src={comment.authorPhotoURL} alt={comment.authorName} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
      ) : (
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'oklch(96% 0.04 265)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
          {getInitials(comment.authorName)}
        </div>
      )}
        <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
          <div>
            <strong style={{ display: 'block' }}>{comment.authorName || 'Anonymous'}</strong>
            <small style={{ color: 'oklch(58% 0 0)' }}>{formatRelativeTime(comment.createdAt)}</small>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {!isReply && (
              <button onClick={() => setShowReply((v) => !v)} style={{ background: 'none', border: 'none', color: 'oklch(58% 0 0)', cursor: 'pointer' }}>{showReply ? 'Cancel' : 'Reply'}</button>
            )}
            {isOwner && (
              <button onClick={handleDelete} style={{ background: 'none', border: 'none', color: 'oklch(58% 0 0)', cursor: 'pointer' }}>Delete</button>
            )}
          </div>
        </div>
        <p style={{ margin: '0.4rem 0 0 0', whiteSpace: 'pre-wrap' }}>{comment.text}</p>

        <div style={{ marginTop: '0.45rem' }}>
            <ReactionBar item={comment} onToggle={(commentId, uid, reactionKey) => toggleCommentReaction(postId, commentId, uid, reactionKey)} />
        </div>
          {/* Reply composer */}
          {showReply && (
            <div style={{ marginTop: '0.5rem' }}>
              <CommentComposer postId={postId} parentId={comment.id} onCancel={() => setShowReply(false)} />
            </div>
          )}

          {/* Replies */}
          {replies?.length > 0 && (
            <div style={{ marginTop: '0.6rem' }}>
              <RepliesList replies={replies} postId={postId} />
            </div>
          )}
      </div>
    </div>
  )
}

function RepliesList({ replies, postId }) {
  const [expanded, setExpanded] = useState(false)
  const VISIBLE = 3
  if (!replies || replies.length === 0) return null
  const shown = expanded ? replies : replies.slice(0, VISIBLE)
  return (
    <div>
      {shown.map((r) => (
        <CommentCard key={r.id} comment={r} postId={postId} isReply />
      ))}
      {replies.length > VISIBLE && (
        <button onClick={() => setExpanded((v) => !v)} style={{ background: 'none', border: 'none', color: 'oklch(58% 0 0)', cursor: 'pointer', marginTop: 6 }}>
          {expanded ? `Hide replies` : `Show ${replies.length - VISIBLE} more replies`}
        </button>
      )}
    </div>
  )
}
