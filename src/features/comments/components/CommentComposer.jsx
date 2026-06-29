import { useState } from 'react'
import { Button, Input, message } from 'antd'
import { useAuth } from '@/store/AuthContext'
import { createComment } from '@/services/postsService'

import { LuSendHorizontal } from "react-icons/lu";
import { BsReply } from "react-icons/bs";

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
    <div className="flex gap-2 items-start">
      <Input.TextArea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={user ? (parentId ? 'Write a reply...' : 'Write a comment...') : 'Sign in to comment'}
        autoSize={{ minRows: 1, maxRows: 4 }}
        disabled={!user}
        className="min-w-0 w-full p-2 rounded-md border border-neutral-200 focus:border-primary-500"
      />
      <div className="flex flex-row gap-2">
        <Button type="primary" onClick={handleSubmit} loading={sending} disabled={!user || !text.trim()} className="whitespace-nowrap">
          {parentId ? <BsReply /> : <LuSendHorizontal />}
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
