import { useState, useEffect, useRef } from "react";
import { Modal, Upload, Progress, message, Switch } from "antd";
import { CameraOutlined, CloseOutlined, PlusOutlined, FolderOpenOutlined } from "@ant-design/icons";
import { useAuth } from "@/store/AuthContext";
import { createPost, updatePost, uploadMedia, deleteMedia } from "@/services/postsService";
import { getInitials } from "@/lib/utils";

export default function PostComposer({ open, onClose, editPost }) {
  const { user, userProfile } = useAuth();

  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState("");
  const [commentEnabled, setCommentEnabled] = useState(true);
  const [shareEnabled, setShareEnabled] = useState(true);
  // media items: array of { file?, preview?, url?, path?, type:'image'|'video' }
  const [mediaItems, setMediaItems] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const isEditing = !!editPost;

  // Populate form when editing
  useEffect(() => {
    if (editPost) {
      setTitle(editPost.title || "");
      setCaption(editPost.caption || "");
      setTags(editPost.tags?.join(", ") || "");
      setCommentEnabled(editPost.commentEnabled !== false);
      setShareEnabled(editPost.shareEnabled !== false);
      // initialize media from editPost: support legacy single image or new mediaItems
      let initial = [];
      if (Array.isArray(editPost.mediaItems) && editPost.mediaItems.length) {
        initial = editPost.mediaItems.map((item) => ({
          url: item.url,
          path: item.path || null,
          type: item.type || "image",
        }));
      } else {
        const existingUrls = Array.isArray(editPost.imageUrls)
          ? editPost.imageUrls
          : editPost.imageUrl
            ? [editPost.imageUrl]
            : [];
        const existingPaths = Array.isArray(editPost.imagePaths)
          ? editPost.imagePaths
          : editPost.imagePath
            ? [editPost.imagePath]
            : [];
        initial = existingUrls.map((u, i) => ({ url: u, path: existingPaths[i] || null, type: "image" }));
      }
      setMediaItems(initial);
    } else {
      resetForm();
    }
  }, [editPost, open]);

  function resetForm() {
    setTitle("");
    setCaption("");
    setTags("");
    setCommentEnabled(true);
    setShareEnabled(true);
    setMediaItems([]);
    setUploadProgress(0);
  }

  function handleClose() {
    if (!submitting) {
      resetForm();
      onClose();
    }
  }

  function handleMediaSelect(file) {
    const isImage = file.type && file.type.startsWith("image/");
    const isVideo = file.type && file.type.startsWith("video/");
    const isLt8M = file.size / 1024 / 1024 < 8;
    const isLt100M = file.size / 1024 / 1024 < 100;
    if (!isImage && !isVideo) {
      message.error("Please upload an image or video file");
      return Upload.LIST_IGNORE;
    }
    if (isImage && !isLt8M) {
      message.error("Image must be smaller than 8MB");
      return Upload.LIST_IGNORE;
    }
    if (isVideo && !isLt100M) {
      message.error("Video must be smaller than 100MB");
      return Upload.LIST_IGNORE;
    }
    if (mediaItems.length >= 10) {
      message.error("Maximum 10 media items per post");
      return Upload.LIST_IGNORE;
    }
    const preview = URL.createObjectURL(file);
    const type = isVideo ? "video" : "image";
    setMediaItems((prev) => {
      if (prev.length >= 10) return prev;
      return [...prev, { file, preview, type }];
    });
    return false; // prevent auto-upload
  }

  function addFiles(fileList) {
    const arr = Array.from(fileList || []);
    if (!arr.length) return;
    setMediaItems((prev) => {
      const copy = prev.slice();
      for (const file of arr) {
        if (copy.length >= 10) {
          message.error("Maximum 10 media items per post");
          break;
        }
        const isImage = file.type && file.type.startsWith("image/");
        const isVideo = file.type && file.type.startsWith("video/");
        const isLt8M = file.size / 1024 / 1024 < 8;
        const isLt100M = file.size / 1024 / 1024 < 100;
        if (!isImage && !isVideo) {
          message.error("Only image or video files are allowed");
          continue;
        }
        if (isImage && !isLt8M) {
          message.error("Image must be smaller than 8MB");
          continue;
        }
        if (isVideo && !isLt100M) {
          message.error("Video must be smaller than 100MB");
          continue;
        }
        const preview = URL.createObjectURL(file);
        const type = isVideo ? "video" : "image";
        copy.push({ file, preview, type });
      }
      return copy;
    });
  }

  function handleFilesFromInput(e) {
    addFiles(e.target.files);
    e.target.value = null;
  }

  function removeMedia(index) {
    setMediaItems((prev) => {
      const copy = prev.slice();
      const removed = copy.splice(index, 1);
      // revoke preview URL if created
      if (removed[0]?.preview) URL.revokeObjectURL(removed[0].preview);
      return copy;
    });
  }

  async function handleSubmit() {
    if (!caption.trim() && !title.trim()) {
      message.warning("Add a title or caption to your post");
      return;
    }

    setSubmitting(true);
    try {
      // prepare existing media and files
      const originalMedia = editPost
        ? Array.isArray(editPost.mediaItems)
          ? editPost.mediaItems
          : Array.isArray(editPost.imageUrls)
            ? editPost.imageUrls.map((u, i) => ({
                url: u,
                path: Array.isArray(editPost.imagePaths) ? editPost.imagePaths[i] : editPost.imagePath || null,
                type: "image",
              }))
            : editPost.imageUrl
              ? [{ url: editPost.imageUrl, path: editPost.imagePath || null, type: "image" }]
              : []
        : [];

      // mediaItems state items: some have { url, path, type } (existing) or { file, preview, type }
      const newFiles = mediaItems.filter((item) => item.file);
      const keptExisting = mediaItems.filter((item) => item.url);

      const uploadedResults = [];
      // upload new files sequentially and aggregate progress
      if (newFiles.length > 0) {
        const total = newFiles.length;
        let uploadedSoFar = 0;
        for (let idx = 0; idx < newFiles.length; idx++) {
          const f = newFiles[idx].file;
          const res = await uploadMedia(f, user.uid, (p) => {
            const agg = Math.round(((uploadedSoFar + p / 100) / total) * 100);
            setUploadProgress(agg);
          });
          uploadedResults.push({
            url: res.url,
            path: res.path,
            type: res.type || (f.type.startsWith("video/") ? "video" : "image"),
          });
          uploadedSoFar += 1;
        }
      }

      // build final media list: keep existing items then append newly uploaded items
      const finalMediaItems = [];
      keptExisting.forEach((it) => {
        finalMediaItems.push({ url: it.url, path: it.path || null, type: it.type || "image" });
      });
      uploadedResults.forEach((res) => {
        finalMediaItems.push({ url: res.url, path: res.path || null, type: res.type || "image" });
      });

      // Remove duplicates while preserving order
      const seen = new Set();
      const dedupedMedia = [];
      for (const item of finalMediaItems) {
        if (!item.url || seen.has(item.url)) continue;
        seen.add(item.url);
        dedupedMedia.push(item);
      }

      // Determine removed original paths to delete
      const originalPaths = originalMedia.map((item) => item.path).filter(Boolean);
      const keptPaths = dedupedMedia.map((item) => item.path).filter(Boolean);
      const removedPaths = originalPaths.filter((path) => !keptPaths.includes(path));
      for (const p of removedPaths) {
        try {
          await deleteMedia(p);
        } catch (e) {
          console.warn("failed deleting media", p, e);
        }
      }

      const parsedTags = tags
        .split(",")
        .map((t) => t.trim().toLowerCase().replace(/\s+/g, "-"))
        .filter(Boolean)
        .slice(0, 5);

      const authorName = userProfile?.displayName || user?.displayName || "Anonymous";
      const authorPhotoURL = userProfile?.photoURL || user?.photoURL || null;

      const imageOnly = dedupedMedia.every((item) => item.type !== "video");
      const postData = {
        title: title.trim(),
        caption: caption.trim(),
        tags: parsedTags,
        mediaItems: dedupedMedia.length ? dedupedMedia : null,
        imageUrls: imageOnly ? dedupedMedia.map((item) => item.url) : null,
        imagePaths: imageOnly ? dedupedMedia.map((item) => item.path || null) : null,
        authorId: user.uid,
        authorName,
        authorPhotoURL,
        commentEnabled,
        shareEnabled,
      };

      if (isEditing) {
        await updatePost(editPost.id, postData);
        message.success("Post updated! ✨");
      } else {
        await createPost(postData);
        message.success("Post shared! 🎉");
      }

      handleClose();
    } catch (err) {
      console.error(err);
      message.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  }

  const displayName = userProfile?.displayName || user?.displayName || "You";
  const photoURL = userProfile?.photoURL || user?.photoURL;

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
      centered
      width={520}
      title={
        <span className="font-semibold text-base text-neutral-800">{isEditing ? "Edit Post" : "Share a Dayfie"}</span>
      }
      closable={!submitting}
      maskClosable={!submitting}
      style={{ padding: "1rem 1.5rem 1.5rem" }}
    >
      {/* Author hint */}
      <div className="flex items-center gap-3 mb-4">
        {photoURL ? (
          <img
            src={photoURL}
            alt={displayName}
            className="w-9 h-9 rounded-full object-cover border-2 border-neutral-200"
          />
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
          <label className="block text-sm font-medium text-neutral-600 mb-1">
            Title <span className="text-neutral-500">(optional)</span>
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
          <label className="block text-sm font-medium text-neutral-600 mb-1">
            What's on your mind? <span className="text-red-500">*</span>
          </label>
          <textarea
            className="textarea-field"
            placeholder="Share your thoughts, your story, your day…"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={2000}
            rows={4}
          />
          <p className="mt-1 text-xs text-neutral-500 text-right">{caption.length}/2000</p>
        </div>

        {/* Image upload */}
        <div>
          <label className="block text-sm font-medium text-neutral-600 mb-1">
            Photo <span className="text-neutral-500">(optional)</span>
          </label>

          {mediaItems.length > 0 ? (
            <div className="">
              <div className="grid grid-cols-3 gap-2">
                {mediaItems.map((it, i) => (
                  <div key={i} className="relative rounded-md overflow-hidden bg-black/5">
                    {it.type === "video" ? (
                      <video
                        src={it.preview || it.url}
                        className="w-full h-28 object-cover block"
                        muted
                        playsInline
                        preload="metadata"
                      />
                    ) : (
                      <img
                        loading="lazy"
                        src={it.preview || it.url}
                        alt={`preview-${i}`}
                        className="w-full h-28 object-cover block"
                      />
                    )}
                    <button
                      onClick={() => removeMedia(i)}
                      className="absolute top-1 right-1 bg-black/60 rounded-full w-7 h-7 flex items-center justify-center text-white"
                    >
                      <CloseOutlined style={{ fontSize: 12 }} />
                    </button>
                  </div>
                ))}
              </div>

              {mediaItems.length < 10 && (
                <div>
                  <Upload.Dragger
                    multiple
                    accept="image/*,video/*"
                    beforeUpload={handleMediaSelect}
                    showUploadList={false}
                    className="rounded-xl border-dashed border-[1.5px] border-neutral-300 bg-white"
                  >
                    <div className="p-3 text-center">
                      <PlusOutlined style={{ fontSize: 20, color: "var(--color-neutral-600)", marginBottom: 6 }} />
                      <p className="m-0 text-sm text-neutral-600">Add more media — you can select multiple (max 10)</p>
                      <p className="mt-1 text-xs text-neutral-500">Images up to 8MB, videos up to 100MB</p>
                    </div>
                  </Upload.Dragger>
                  <div className="mt-2 text-center">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-sm text-neutral-600 underline"
                    >
                      Use camera / pick from device
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <Upload.Dragger
                multiple
                accept="image/*,video/*"
                beforeUpload={handleMediaSelect}
                showUploadList={false}
                className="rounded-xl border-dashed border-[1.5px] border-neutral-300 bg-white"
              >
                <div className="p-4 text-center">
                  <CameraOutlined style={{ fontSize: 28, color: "var(--color-neutral-600)", marginBottom: 8 }} />
                  <p className="m-0 text-sm text-neutral-600 font-medium">
                    Click or drag media here (you can select multiple)
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">Image max 8MB | Video max 100MB | Up to 10 items</p>
                </div>
              </Upload.Dragger>
              <div className="w-full mt-3 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-neutral-200 py-2 px-3 text-sm text-neutral-600 hover:bg-neutral-50"
                >
                  <FolderOpenOutlined />
                  From device
                </button>
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-neutral-200 py-2 px-3 text-sm text-neutral-600 hover:bg-neutral-50"
                >
                  <CameraOutlined />
                  Open camera
                </button>
              </div>
            </div>
          )}
          {/* hidden file inputs used for camera or manual file pick */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleFilesFromInput}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*,video/*"
            capture="environment"
            multiple
            onChange={handleFilesFromInput}
            className="hidden"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-neutral-600 mb-1">
            Tags <span className="text-neutral-500">(optional, comma-separated)</span>
          </label>
          <input
            className="input-field"
            placeholder="e.g. travel, food, selfie"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </div>

        {/* Comment toggle */}
        <div className="flex flex-col gap-2">
          <label className="block text-sm font-medium text-neutral-600">Permissions</label>
          <div className="flex items-center justify-between gap-4 rounded-md bg-neutral-100 p-3">
            <div>
              <p className="text-sm font-medium text-neutral-700">Allow comments</p>
              <p className="text-xs text-neutral-500">Users can reply to this post when enabled.</p>
            </div>
            <Switch checked={commentEnabled} onChange={(checked) => setCommentEnabled(checked)} />
          </div>

          {/* Share toggle */}
          <div className="flex items-center justify-between gap-4 rounded-md bg-neutral-100 p-3">
            <div>
              <p className="text-sm font-medium text-neutral-700">Allow sharing</p>
              <p className="text-xs text-neutral-500">Share button will appear for this post when enabled.</p>
            </div>
            <Switch checked={shareEnabled} onChange={(checked) => setShareEnabled(checked)} />
          </div>
        </div>

        {/* Upload progress */}
        {submitting && uploadProgress > 0 && uploadProgress < 100 && (
          <Progress percent={uploadProgress} strokeColor="oklch(55% 0.18 265)" size="small" />
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end mt-1">
          <button className="btn-ghost" onClick={handleClose} disabled={submitting}>
            Cancel
          </button>
          <button
            className="btn-primary disabled:opacity-60"
            onClick={handleSubmit}
            disabled={submitting || (!caption.trim() && !title.trim())}
          >
            {submitting
              ? uploadProgress > 0
                ? `Uploading ${uploadProgress}%…`
                : "Saving…"
              : isEditing
                ? "Save Changes"
                : "Share Post"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
