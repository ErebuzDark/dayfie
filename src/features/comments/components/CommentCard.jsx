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
    <div className={`flex gap-3 ${isReply ? 'py-1 ml-9' : 'py-2'}`}>
      {comment.authorPhotoURL ? (
        <img src={comment.authorPhotoURL} alt={comment.authorName} className="w-9 h-9 rounded-full object-cover" />
      ) : (
        <div className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center font-bold text-neutral-700">
          {getInitials(comment.authorName)}
        </div>
      )}
      <div className="flex-1">
        <div className="flex justify-between gap-2">
          <div>
            <strong className="block text-sm">{comment.authorName || 'Anonymous'}</strong>
            <small className="text-xs text-neutral-500">{formatRelativeTime(comment.createdAt)}</small>
          </div>
          <div className="flex gap-2 items-center">
            {!isReply && (
              <button onClick={() => setShowReply((v) => !v)} className="text-sm text-neutral-600 hover:underline">{showReply ? 'Cancel' : 'Reply'}</button>
            )}
            {isOwner && (
              <button onClick={handleDelete} className="text-sm text-red-500 hover:underline">Delete</button>
            )}
          </div>
        </div>
        <p className="mt-1 text-sm whitespace-pre-wrap">{comment.text}</p>

        <div className="mt-2">
          <ReactionBar item={comment} onToggle={(commentId, uid, reactionKey) => toggleCommentReaction(postId, commentId, uid, reactionKey)} />
        </div>

        {showReply && (
          <div className="mt-3">
            <CommentComposer postId={postId} parentId={comment.id} onCancel={() => setShowReply(false)} />
          </div>
        )}

        {replies?.length > 0 && (
          <div className="mt-3">
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
