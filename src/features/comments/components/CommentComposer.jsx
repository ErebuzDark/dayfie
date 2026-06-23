import { useState } from 'react'
import { Button, Input, message } from 'antd'
import { useAuth } from '@/store/AuthContext'
import { createComment } from '@/services/postsService'

export default function CommentComposer({ postId }) {
  const { user } = useAuth()
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)

  async function handleSubmit() {
    if (!user) return message.info('Sign in to comment')
    if (!text.trim()) return
    setSending(true)
    try {
      await createComment(postId, {
        text: text.trim(),
        authorId: user.uid,
        authorName: user.displayName || user.email || 'Anonymous',
        authorPhotoURL: user.photoURL || null,
      })
      setText('')
    } catch (e) {
      message.error('Could not post comment')
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
      <Input.TextArea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={user ? 'Write a comment...' : 'Sign in to comment'}
        autoSize={{ minRows: 1, maxRows: 4 }}
        disabled={!user}
      />
      <Button type="primary" onClick={handleSubmit} loading={sending} disabled={!user || !text.trim()}>
        Comment
      </Button>
    </div>
  )
}
