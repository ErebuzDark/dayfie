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
      title={<span className="font-semibold text-base text-neutral-800">{isEditing ? 'Edit Post' : 'Share a Dayfie'}</span>}
      closable={!submitting}
      maskClosable={!submitting}
      bodyStyle={{ padding: '1rem 1.5rem 1.5rem' }}
    >
      {/* Author hint */}
      <div className="flex items-center gap-3 mb-4">
        {photoURL ? (
          <img src={photoURL} alt={displayName} className="w-9 h-9 rounded-full object-cover border-2 border-neutral-200" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center font-bold text-neutral-700 border-2 border-neutral-200">
            {getInitials(displayName)}
          </div>
        )}
        <div>
          <p className="m-0 font-semibold text-sm text-neutral-800">{displayName}</p>
          <p className="m-0 text-xs text-neutral-500">Posting publicly</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-neutral-600 mb-1">Title <span className="text-neutral-500">(optional)</span></label>
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
          <label className="block text-sm font-medium text-neutral-600 mb-1">What's on your mind? <span className="text-red-500">*</span></label>
          <textarea className="textarea-field" placeholder="Share your thoughts, your story, your day…" value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={2000} rows={4} />
          <p className="mt-1 text-xs text-neutral-500 text-right">{caption.length}/2000</p>
        </div>

        {/* Image upload */}
        <div>
          <label className="block text-sm font-medium text-neutral-600 mb-1">Photo <span className="text-neutral-500">(optional)</span></label>

          {imagePreview ? (
            <div className="relative rounded-xl overflow-hidden border-[1.5px] border-neutral-200">
              <img src={imagePreview} alt="Preview" className="w-full max-h-[260px] object-cover block" />
              <button onClick={removeImage} className="absolute top-2 right-2 bg-black/60 rounded-full w-7 h-7 flex items-center justify-center text-white backdrop-blur-sm">
                <CloseOutlined style={{ fontSize: 12 }} />
              </button>
            </div>
          ) : (
            <Upload.Dragger accept="image/*" beforeUpload={handleImageSelect} showUploadList={false} className="rounded-xl border-dashed border-[1.5px] border-neutral-300 bg-white">
              <div className="p-4 text-center">
                <CameraOutlined style={{ fontSize: 28, color: 'var(--color-neutral-600)', marginBottom: 8 }} />
                <p className="m-0 text-sm text-neutral-600 font-medium">Click or drag a photo here</p>
                <p className="mt-1 text-xs text-neutral-500">PNG, JPG, WEBP · Max 8MB</p>
              </div>
            </Upload.Dragger>
          )}
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-neutral-600 mb-1">Tags <span className="text-neutral-500">(optional, comma-separated)</span></label>
          <input className="input-field" placeholder="e.g. travel, food, selfie" value={tags} onChange={(e) => setTags(e.target.value)} />
        </div>

        {/* Upload progress */}
        {submitting && uploadProgress > 0 && uploadProgress < 100 && (
          <Progress percent={uploadProgress} strokeColor="oklch(55% 0.18 265)" size="small" />
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end mt-1">
          <button className="btn-ghost" onClick={handleClose} disabled={submitting}>Cancel</button>
          <button className="btn-primary disabled:opacity-60" onClick={handleSubmit} disabled={submitting || (!caption.trim() && !title.trim())}>
            {submitting ? (uploadProgress > 0 ? `Uploading ${uploadProgress}%…` : 'Saving…') : isEditing ? 'Save Changes' : 'Share Post'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
