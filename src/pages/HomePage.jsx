import { useEffect, useState } from 'react'
import { Spin, Empty } from 'antd'
import {
  CameraOutlined,
  FireOutlined,
  GlobalOutlined,
} from '@ant-design/icons'
import { useAuth } from '@/store/AuthContext'
import { subscribeToPosts } from '@/services/postsService'
import PostCard from '@/features/posts/components/PostCard'

export default function HomePage({ onNewPost, onEditPost }) {
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = subscribeToPosts((newPosts) => {
      setPosts(newPosts)
      setLoading(false)
    })
    console.log("fectch")
    return unsub
  }, [])

  return (
    <main
      style={{
        maxWidth: 680,
        margin: '0 auto',
        padding: '2rem 1.25rem 4rem',
      }}
    >
      {/* Hero welcome (only when not logged in) */}
      {!user && (
        <div
          className="animate-fade-in-up"
          style={{
            background: '#fff',
            border: '1px solid oklch(91% 0 0)',
            borderRadius: '1.5rem',
            boxShadow: '0 4px 24px oklch(0% 0 0 / 0.07)',
            padding: '2.5rem 2rem',
            textAlign: 'center',
            marginBottom: '2.5rem',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* Decorative background shapes */}
          <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'oklch(96% 0.04 265)', opacity: 0.6 }} />
          <div style={{ position: 'absolute', bottom: -20, left: -20, width: 80, height: 80, borderRadius: '50%', background: 'oklch(97% 0.02 200)', opacity: 0.6 }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.75rem', lineHeight: 1 }}>📸</span>
            <h1 style={{ margin: '0 0 0.5rem', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '1.65rem', color: 'oklch(16% 0 0)', letterSpacing: '-0.02em' }}>
              Your daily story, shared.
            </h1>
            <p style={{ margin: '0 0 1.5rem', fontFamily: 'Poppins, sans-serif', fontSize: '0.9rem', color: 'oklch(46% 0 0)', lineHeight: 1.7, maxWidth: 340, marginLeft: 'auto', marginRight: 'auto' }}>
              Dayfie is a personal blog where every post is a tiny window into your day. No noise, just you.
            </p>
            <a
              href="/login"
              className="btn-primary"
              style={{ display: 'inline-flex', textDecoration: 'none' }}
            >
              <CameraOutlined /> Start Sharing
            </a>
          </div>
        </div>
      )}

      {/* Feed header */}
      {user && (
        <div
          className="animate-fade-in-up"
          style={{ marginBottom: '1.5rem' }}
        >
          {/* Composer prompt card */}
          <div
            onClick={onNewPost}
            style={{
              background: '#fff',
              border: '1.5px dashed oklch(88% 0 0)',
              borderRadius: '1.25rem',
              padding: '0.9rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              cursor: 'pointer',
              transition: 'border-color 0.2s, box-shadow 0.2s',
              marginBottom: '1.5rem',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'oklch(72% 0 0)'; e.currentTarget.style.boxShadow = '0 2px 12px oklch(0% 0 0 / 0.06)' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'oklch(88% 0 0)'; e.currentTarget.style.boxShadow = 'none' }}
          >
            <CameraOutlined style={{ fontSize: 18, color: 'oklch(72% 0 0)' }} />
            <span style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.9rem', color: 'oklch(58% 0 0)' }}>
              What's your dayfie today?
            </span>
          </div>
        </div>
      )}

      {/* Section label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <GlobalOutlined style={{ color: 'oklch(55% 0.18 265)' }} />
        <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: '0.85rem', color: 'oklch(36% 0 0)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          Latest Posts
        </span>
        {posts.length > 0 && (
          <span style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.78rem', color: 'oklch(58% 0 0)', fontWeight: 400, marginLeft: 'auto' }}>
            {posts.length} post{posts.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Feed */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem 0' }}>
          <Spin size="large" />
        </div>
      ) : posts.length === 0 ? (
        <div
          className="animate-fade-in"
          style={{
            background: '#fff',
            border: '1px solid oklch(91% 0 0)',
            borderRadius: '1.5rem',
            padding: '4rem 2rem',
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🌅</span>
          <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: '1rem', color: 'oklch(36% 0 0)', margin: '0 0 0.4rem' }}>
            No posts yet!
          </p>
          <p style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.85rem', color: 'oklch(58% 0 0)', margin: 0 }}>
            {user ? 'Be the first to share your dayfie ✨' : 'Sign in to start sharing your story'}
          </p>
          {user && (
            <button className="btn-primary" onClick={onNewPost} style={{ marginTop: '1.25rem' }}>
              <CameraOutlined /> Share Your First Post
            </button>
          )}
        </div>
      ) : (
        <div className="stagger">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onEdit={onEditPost} />
          ))}
        </div>
      )}
    </main>
  )
}
