import { useState, useEffect } from 'react'
import { Modal, Upload, Progress, message, Input } from 'antd'
import {
  CameraOutlined,
  CloseOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import { useAuth } from '@/store/AuthContext'
import { createPost, updatePost, uploadImage, deleteImage } from '@/services/postsService'
import { getInitials } from '@/lib/utils'

export default function PostComposer({ open, onClose, editPost }) {
  const { user, userProfile } = useAuth()

  const [title, setTitle] = useState('')
  const [caption, setCaption] = useState('')
  const [tags, setTags] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  const isEditing = !!editPost

  // Populate form when editing
  useEffect(() => {
    if (editPost) {
      setTitle(editPost.title || '')
      setCaption(editPost.caption || '')
      setTags(editPost.tags?.join(', ') || '')
      setImagePreview(editPost.imageUrl || null)
    } else {
      resetForm()
    }
  }, [editPost, open])

  function resetForm() {
    setTitle('')
    setCaption('')
    setTags('')
    setImageFile(null)
    setImagePreview(null)
    setUploadProgress(0)
  }

  function handleClose() {
    if (!submitting) {
      resetForm()
      onClose()
    }
  }

  function handleImageSelect(file) {
    const isImage = file.type.startsWith('image/')
    const isLt8M = file.size / 1024 / 1024 < 8
    if (!isImage) { message.error('Please upload an image file'); return Upload.LIST_IGNORE }
    if (!isLt8M) { message.error('Image must be smaller than 8MB'); return Upload.LIST_IGNORE }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    return false // prevent auto-upload
  }

  function removeImage() {
    setImageFile(null)
    setImagePreview(null)
  }

  async function handleSubmit() {
    if (!caption.trim() && !title.trim()) {
      message.warning('Add a title or caption to your post')
      return
    }

    setSubmitting(true)
    try {
      let imageUrl = editPost?.imageUrl || null
      let imagePath = editPost?.imagePath || null

      // Upload new image if selected
      if (imageFile) {
        // Delete old image if editing
        if (editPost?.imagePath) {
          await deleteImage(editPost.imagePath)
        }
        const result = await uploadImage(imageFile, user.uid, (p) => setUploadProgress(p))
        imageUrl = result.url
        imagePath = result.path
      }

      // If editing and image was removed
      if (isEditing && !imagePreview && editPost?.imagePath && !imageFile) {
        await deleteImage(editPost.imagePath)
        imageUrl = null
        imagePath = null
      }

      const parsedTags = tags
        .split(',')
        .map((t) => t.trim().toLowerCase().replace(/\s+/g, '-'))
        .filter(Boolean)
        .slice(0, 5)

      const authorName = userProfile?.displayName || user?.displayName || 'Anonymous'
      const authorPhotoURL = userProfile?.photoURL || user?.photoURL || null

      const postData = {
        title: title.trim(),
        caption: caption.trim(),
        tags: parsedTags,
        imageUrl,
        imagePath,
        authorId: user.uid,
        authorName,
        authorPhotoURL,
      }

      if (isEditing) {
        await updatePost(editPost.id, postData)
        message.success('Post updated! ✨')
      } else {
        await createPost(postData)
        message.success('Post shared! 🎉')
      }

      handleClose()
    } catch (err) {
      console.error(err)
      message.error('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
      setUploadProgress(0)
    }
  }

  const displayName = userProfile?.displayName || user?.displayName || 'You'
  const photoURL = userProfile?.photoURL || user?.photoURL

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
      centered
      width={520}
      title={
        <span
          style={{
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 600,
            fontSize: '1rem',
            color: 'oklch(16% 0 0)',
          }}
        >
          {isEditing ? 'Edit Post' : 'Share a Dayfie'}
        </span>
      }
      closable={!submitting}
      maskClosable={!submitting}
      styles={{
        body: { padding: '1rem 1.5rem 1.5rem' },
      }}
    >
      {/* Author hint */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.1rem' }}>
        {photoURL ? (
          <img
            src={photoURL}
            alt={displayName}
            style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', border: '2px solid oklch(91% 0 0)' }}
          />
        ) : (
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: 'oklch(96% 0.04 265)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'Poppins, sans-serif',
              fontWeight: 700,
              fontSize: '0.78rem',
              color: 'oklch(55% 0.18 265)',
              border: '2px solid oklch(91% 0 0)',
            }}
          >
            {getInitials(displayName)}
          </div>
        )}
        <div>
          <p style={{ margin: 0, fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: '0.88rem', color: 'oklch(16% 0 0)', lineHeight: 1.3 }}>
            {displayName}
          </p>
          <p style={{ margin: 0, fontFamily: 'Poppins, sans-serif', fontSize: '0.75rem', color: 'oklch(58% 0 0)' }}>
            Posting publicly
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {/* Title */}
        <div>
          <label style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.8rem', fontWeight: 500, color: 'oklch(46% 0 0)', display: 'block', marginBottom: '0.35rem' }}>
            Title <span style={{ color: 'oklch(72% 0 0)' }}>(optional)</span>
          </label>
          <input
            className="input-field"
            placeholder="Give your post a title…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
          />
        </div>

        {/* Caption */}
        <div>
          <label style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.8rem', fontWeight: 500, color: 'oklch(46% 0 0)', display: 'block', marginBottom: '0.35rem' }}>
            What's on your mind? <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <textarea
            className="textarea-field"
            placeholder="Share your thoughts, your story, your day…"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={2000}
            rows={4}
          />
          <p style={{ margin: '0.25rem 0 0', fontFamily: 'Poppins, sans-serif', fontSize: '0.72rem', color: 'oklch(72% 0 0)', textAlign: 'right' }}>
            {caption.length}/2000
          </p>
        </div>

        {/* Image upload */}
        <div>
          <label style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.8rem', fontWeight: 500, color: 'oklch(46% 0 0)', display: 'block', marginBottom: '0.35rem' }}>
            Photo <span style={{ color: 'oklch(72% 0 0)' }}>(optional)</span>
          </label>

          {imagePreview ? (
            <div style={{ position: 'relative', borderRadius: '0.875rem', overflow: 'hidden', border: '1.5px solid oklch(91% 0 0)' }}>
              <img
                src={imagePreview}
                alt="Preview"
                style={{ width: '100%', maxHeight: 260, objectFit: 'cover', display: 'block' }}
              />
              <button
                onClick={removeImage}
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  background: 'rgba(0,0,0,0.55)',
                  border: 'none',
                  borderRadius: '50%',
                  width: 28,
                  height: 28,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  backdropFilter: 'blur(4px)',
                }}
              >
                <CloseOutlined style={{ fontSize: 12 }} />
              </button>
            </div>
          ) : (
            <Upload.Dragger
              accept="image/*"
              beforeUpload={handleImageSelect}
              showUploadList={false}
              style={{
                borderRadius: '0.875rem',
                border: '1.5px dashed oklch(85% 0 0)',
                background: 'oklch(99% 0 0)',
              }}
            >
              <div style={{ padding: '1.25rem', textAlign: 'center' }}>
                <CameraOutlined style={{ fontSize: 28, color: 'oklch(72% 0 0)', marginBottom: 8 }} />
                <p style={{ margin: 0, fontFamily: 'Poppins, sans-serif', fontSize: '0.85rem', color: 'oklch(58% 0 0)', fontWeight: 500 }}>
                  Click or drag a photo here
                </p>
                <p style={{ margin: '0.2rem 0 0', fontFamily: 'Poppins, sans-serif', fontSize: '0.72rem', color: 'oklch(72% 0 0)' }}>
                  PNG, JPG, WEBP · Max 8MB
                </p>
              </div>
            </Upload.Dragger>
          )}
        </div>

        {/* Tags */}
        <div>
          <label style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.8rem', fontWeight: 500, color: 'oklch(46% 0 0)', display: 'block', marginBottom: '0.35rem' }}>
            Tags <span style={{ color: 'oklch(72% 0 0)' }}>(optional, comma-separated)</span>
          </label>
          <input
            className="input-field"
            placeholder="e.g. travel, food, selfie"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </div>

        {/* Upload progress */}
        {submitting && uploadProgress > 0 && uploadProgress < 100 && (
          <Progress percent={uploadProgress} strokeColor="oklch(55% 0.18 265)" size="small" />
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
          <button className="btn-ghost" onClick={handleClose} disabled={submitting}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={submitting || (!caption.trim() && !title.trim())}
            style={{ opacity: submitting || (!caption.trim() && !title.trim()) ? 0.6 : 1, cursor: submitting ? 'not-allowed' : 'pointer' }}
          >
            {submitting ? (uploadProgress > 0 ? `Uploading ${uploadProgress}%…` : 'Saving…') : isEditing ? 'Save Changes' : 'Share Post'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
