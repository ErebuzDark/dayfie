import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import PostComposer from '@/features/posts/components/PostComposer'

export default function RootLayout() {
  const [composerOpen, setComposerOpen] = useState(false)
  const [editPost, setEditPost] = useState(null)

  function handleNewPost() {
    setEditPost(null)
    setComposerOpen(true)
  }

  function handleEditPost(post) {
    setEditPost(post)
    setComposerOpen(true)
  }

  function handleCloseComposer() {
    setComposerOpen(false)
    setEditPost(null)
  }

  return (
    <>
      <Navbar onNewPost={handleNewPost} />
      <Outlet context={{ onNewPost: handleNewPost, onEditPost: handleEditPost }} />
      <PostComposer
        open={composerOpen}
        onClose={handleCloseComposer}
        editPost={editPost}
      />
    </>
  )
}
