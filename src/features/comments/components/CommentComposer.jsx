import { useState } from 'react'
import { Button, Input, message } from 'antd'
import { useAuth } from '@/store/AuthContext'
import { createComment } from '@/services/postsService'

export default function CommentComposer({ postId, parentId = null, onPosted, onCancel }) {
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
        parentId,
      })
      setText('')
      onPosted?.()
      onCancel?.()
      message.success(parentId ? 'Reply posted' : 'Comment posted')
    } catch (e) {
      console.error('Comment post failed', e)
      message.error(e?.message || 'Could not post comment')
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
      <Input.TextArea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={user ? (parentId ? 'Write a reply...' : 'Write a comment...') : 'Sign in to comment'}
        autoSize={{ minRows: 1, maxRows: 4 }}
        disabled={!user}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <Button type="primary" onClick={handleSubmit} loading={sending} disabled={!user || !text.trim()}>
          {parentId ? 'Reply' : 'Comment'}
        </Button>
        {onCancel && (
          <Button onClick={onCancel} disabled={sending}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  )
}
