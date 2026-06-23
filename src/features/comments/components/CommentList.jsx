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

  return (
    <div style={{ marginTop: '0.6rem' }}>
      {comments.map((c) => (
        <CommentCard key={c.id} comment={c} postId={postId} />
      ))}
    </div>
  )
}
