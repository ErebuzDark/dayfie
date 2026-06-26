import { useEffect, useState } from 'react'
import { useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { Spin, Empty, Button } from 'antd'
import { LeftOutlined } from '@ant-design/icons'
import PostCard from '@/features/posts/components/PostCard'
import { getPost } from '@/services/postsService'

export default function PostDetailPage() {
  const { postId } = useParams()
  const { onEditPost } = useOutletContext() || {}
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!postId) return
    setLoading(true)
    setError(null)
    getPost(postId)
      .then(setPost)
      .catch((err) => {
        console.error(err)
        setError(err?.message || 'Unable to load post')
      })
      .finally(() => setLoading(false))
  }, [postId])

  if (loading) {
    return (
      <main style={{ maxWidth: 680, margin: '0 auto', padding: '3rem 1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
          <Spin size="large" />
        </div>
      </main>
    )
  }

  if (error || !post) {
    return (
      <main style={{ maxWidth: 680, margin: '0 auto', padding: '3rem 1.25rem' }}>
        <Button type="link" icon={<LeftOutlined />} onClick={() => navigate(-1)}>
          Back
        </Button>
        <Empty description={error || 'Post not found'} />
      </main>
    )
  }

  return (
    <main style={{ maxWidth: 680, margin: '0 auto', padding: '3rem 1.25rem' }}>
      <Button type="link" icon={<LeftOutlined />} onClick={() => navigate(-1)}>
        Back
      </Button>
      <PostCard post={post} onEdit={onEditPost} />
    </main>
  )
}
