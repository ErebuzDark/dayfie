import { Modal } from 'antd'
import { useAuth } from '@/store/AuthContext'
import ReactionBar from '@/features/reactions/components/ReactionBar'
import { formatRelativeTime, getInitials } from '@/lib/utils'
import { deleteComment, toggleCommentReaction } from '@/services/postsService'

export default function CommentCard({ comment, postId }) {
  const { user } = useAuth()

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
    <div style={{ display: 'flex', gap: '0.7rem', padding: '0.6rem 0' }}>
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
          {isOwner && (
            <button onClick={handleDelete} style={{ background: 'none', border: 'none', color: 'oklch(58% 0 0)', cursor: 'pointer' }}>Delete</button>
          )}
        </div>
        <p style={{ margin: '0.4rem 0 0 0', whiteSpace: 'pre-wrap' }}>{comment.text}</p>

        <div style={{ marginTop: '0.45rem' }}>
          <ReactionBar item={comment} onToggle={(commentId, uid, reactionKey) => toggleCommentReaction(postId, commentId, uid, reactionKey)} />
        </div>
      </div>
    </div>
  )
}
