import { useEffect, useState } from 'react'
import CommentCard from './CommentCard'
import { subscribeToComments } from '@/services/postsService'

// CommentList supports an optional preview limit via `maxTopComments`.
// If `onSeeMore` is provided and there are more top-level comments than the limit,
// a "See more" button will be rendered to allow the parent to open a drawer.
export default function CommentList({ postId, maxTopComments, onSeeMore }) {
  const [comments, setComments] = useState([])

  useEffect(() => {
    if (!postId) return
    const unsub = subscribeToComments(postId, setComments)
    return () => unsub && unsub()
  }, [postId])

  // organize comments into top-level and replies (one level)
  const repliesByParent = {}
  const top = []
  comments.forEach((c) => {
    if (c.parentId) {
      repliesByParent[c.parentId] = repliesByParent[c.parentId] || []
      repliesByParent[c.parentId].push(c)
    } else {
      top.push(c)
    }
  })

  const VISIBLE = Number.isInteger(maxTopComments) && maxTopComments > 0 ? maxTopComments : Infinity
  const shownTop = top.slice(0, VISIBLE)

  return (
    <div className="mt-3">
      {shownTop.map((c) => (
        <CommentCard key={c.id} comment={c} postId={postId} replies={repliesByParent[c.id] || []} />
      ))}

      {top.length > VISIBLE && onSeeMore && (
        <div className="my-2">
          <button
            onClick={() => onSeeMore()}
            className="text-sm text-slate-400 hover:underline"
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
          >
            See more comments...
          </button>
        </div>
      )}
    </div>
  )
}
