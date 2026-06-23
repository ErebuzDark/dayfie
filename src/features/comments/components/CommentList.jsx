import { useEffect, useState } from 'react'
import CommentCard from './CommentCard'
import { subscribeToComments } from '@/services/postsService'

export default function CommentList({ postId }) {
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

  return (
    <div style={{ marginTop: '0.6rem' }}>
      {top.map((c) => (
        <CommentCard key={c.id} comment={c} postId={postId} replies={repliesByParent[c.id] || []} />
      ))}
    </div>
  )
}
