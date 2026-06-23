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
  // images: array of { file?, preview?, url?, path? }
  const [images, setImages] = useState([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  const isEditing = !!editPost

  // Populate form when editing
  useEffect(() => {
    if (editPost) {
      setTitle(editPost.title || '')
      setCaption(editPost.caption || '')
      setTags(editPost.tags?.join(', ') || '')
      // initialize images from editPost: support legacy single image or new imageUrls
      const existingUrls = Array.isArray(editPost.imageUrls) ? editPost.imageUrls : (editPost.imageUrl ? [editPost.imageUrl] : [])
      const existingPaths = Array.isArray(editPost.imagePaths) ? editPost.imagePaths : (editPost.imagePath ? [editPost.imagePath] : [])
      const initial = existingUrls.map((u, i) => ({ url: u, path: existingPaths[i] || null }))
      setImages(initial)
    } else {
      resetForm()
    }
  }, [editPost, open])

  function resetForm() {
    setTitle('')
    setCaption('')
    setTags('')
    setImages([])
    setUploadProgress(0)
  }

  function handleClose() {
    if (!submitting) {
      resetForm()
      onClose()
    }
  }

  function handleImageSelect(file) {
    const isImage = file.type && file.type.startsWith('image/')
    const isLt8M = file.size / 1024 / 1024 < 8
    if (!isImage) { message.error('Please upload an image file'); return Upload.LIST_IGNORE }
    if (!isLt8M) { message.error('Image must be smaller than 8MB'); return Upload.LIST_IGNORE }
    if (images.length >= 10) { message.error('Maximum 10 images per post'); return Upload.LIST_IGNORE }
    const preview = URL.createObjectURL(file)
    setImages((prev) => [...prev, { file, preview }])
    return false // prevent auto-upload
  }

  function removeImage(index) {
    setImages((prev) => {
      const copy = prev.slice()
      const removed = copy.splice(index, 1)
      // revoke preview URL if created
      if (removed[0]?.preview) URL.revokeObjectURL(removed[0].preview)
      return copy
    })
  }

  async function handleSubmit() {
    if (!caption.trim() && !title.trim()) {
      message.warning('Add a title or caption to your post')
      return
    }

    setSubmitting(true)
    try {
      // prepare existing images and files
      const original = (editPost ? (Array.isArray(editPost.imagePaths) ? editPost.imagePaths : (editPost.imagePath ? [editPost.imagePath] : [])) : [])
      const originalUrls = (editPost ? (Array.isArray(editPost.imageUrls) ? editPost.imageUrls : (editPost.imageUrl ? [editPost.imageUrl] : [])) : [])

      // images state items: some have { url, path } (existing) or { file, preview }
      const newFiles = images.filter((i) => i.file)
      const keptExisting = images.filter((i) => i.url).map((i) => i.url)

      const uploadedResults = []
      // upload new files sequentially and aggregate progress
      if (newFiles.length > 0) {
        const total = newFiles.length
        let uploadedSoFar = 0
        for (let idx = 0; idx < newFiles.length; idx++) {
          const f = newFiles[idx].file
          const res = await uploadImage(f, user.uid, (p) => {
            // aggregate: uploadedSoFar completes previous files, plus p% of current
            const agg = Math.round(((uploadedSoFar + (p / 100)) / total) * 100)
            setUploadProgress(agg)
          })
          uploadedResults.push(res)
          uploadedSoFar += 1
        }
      }

      // build final arrays: start with kept existing (url + maybe path), then append uploaded results
      let finalImageUrls = []
      let finalImagePaths = []
      // preserved existing (in order)
      images.forEach((it) => {
        if (it.url) {
          finalImageUrls.push(it.url)
          if (it.path) finalImagePaths.push(it.path)
        }
      })
      // append uploaded in insertion order
      uploadedResults.forEach((r) => {
        finalImageUrls.push(r.url)
        finalImagePaths.push(r.path)
      })

      // Remove duplicate URLs while preserving order, and keep corresponding paths aligned when possible
      const seen = new Set()
      const dedupedUrls = []
      const dedupedPaths = []
      for (let i = 0; i < finalImageUrls.length; i++) {
        const u = finalImageUrls[i]
        if (!u || seen.has(u)) continue
        seen.add(u)
        dedupedUrls.push(u)
        dedupedPaths.push(finalImagePaths[i] || null)
      }
      finalImageUrls = dedupedUrls
      finalImagePaths = dedupedPaths

      // Determine removed original paths to delete
      const removedPaths = (originalUrls || []).map((u, i) => original[i]).filter(Boolean).filter((path) => !finalImagePaths.includes(path))
      // delete removed images (best-effort)
      for (const p of removedPaths) {
        try { await deleteImage(p) } catch (e) { console.warn('failed deleting image', p, e) }
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
        imageUrls: finalImageUrls.length ? finalImageUrls : null,
        imagePaths: finalImagePaths.length ? finalImagePaths : null,
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

          {images.length > 0 ? (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {images.map((it, i) => (
                  <div key={i} className="relative rounded-md overflow-hidden">
                    <img loading="lazy" src={it.preview || it.url} alt={`preview-${i}`} className="w-full h-28 object-cover block" />
                    <button onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-black/60 rounded-full w-7 h-7 flex items-center justify-center text-white"><CloseOutlined style={{ fontSize: 12 }} /></button>
                  </div>
                ))}
              </div>
              {images.length < 10 && (
                <Upload.Dragger accept="image/*" beforeUpload={handleImageSelect} showUploadList={false} className="rounded-xl border-dashed border-[1.5px] border-neutral-300 bg-white">
                  <div className="p-3 text-center">
                    <PlusOutlined style={{ fontSize: 20, color: 'var(--color-neutral-600)', marginBottom: 6 }} />
                    <p className="m-0 text-sm text-neutral-600">Add more images (max 10)</p>
                  </div>
                </Upload.Dragger>
              )}
            </div>
          ) : (
            <Upload.Dragger accept="image/*" beforeUpload={handleImageSelect} showUploadList={false} className="rounded-xl border-dashed border-[1.5px] border-neutral-300 bg-white">
              <div className="p-4 text-center">
                <CameraOutlined style={{ fontSize: 28, color: 'var(--color-neutral-600)', marginBottom: 8 }} />
                <p className="m-0 text-sm text-neutral-600 font-medium">Click or drag a photo here</p>
                <p className="mt-1 text-xs text-neutral-500">PNG, JPG, WEBP · Max 8MB (up to 10 images)</p>
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
