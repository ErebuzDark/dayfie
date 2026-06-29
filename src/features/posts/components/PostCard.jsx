import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { doc, collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Modal, message, Dropdown, Drawer } from "antd";
import {
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  ShareAltOutlined,
  CloseOutlined,
  LeftOutlined,
  RightOutlined,
  LinkOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import { MdOutlineInsertComment, MdOutlineCommentsDisabled } from "react-icons/md";
import { useAuth } from "@/store/AuthContext";
import { deletePost } from "@/services/postsService";
import { formatRelativeTime, getInitials } from "@/lib/utils";
import ReactionBar from "@/features/reactions/components/ReactionBar";
import CommentComposer from "@/features/comments/components/CommentComposer";
import CommentList from "@/features/comments/components/CommentList";

// ─── Media Grid ──────────────────────────────────────────────────────────────

function MediaGrid({ media, onOpen }) {
  if (media.length === 0) return null;

  const imgClass = "w-full h-full object-cover block transition-transform duration-300 hover:scale-[1.03]";

  if (media.length === 1) {
    const item = media[0];
    return (
      <div className="w-full overflow-hidden cursor-pointer" style={{ maxHeight: "520px" }} onClick={() => onOpen(0)}>
        {item.type === "video" ? (
          <video
            controls
            src={item.url}
            className="w-full h-auto max-h-[520px] object-contain bg-black"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <img
            loading="lazy"
            src={item.url}
            alt="post media"
            className="w-full object-cover"
            style={{ maxHeight: "520px" }}
          />
        )}
      </div>
    );
  }

  if (media.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-0.5 w-full" style={{ height: "300px" }}>
        {media.map((item, i) => (
          <div key={i} className="overflow-hidden cursor-pointer bg-neutral-100" onClick={() => onOpen(i)}>
            {item.type === "video" ? (
              <video src={item.url} className={imgClass} muted playsInline preload="metadata" />
            ) : (
              <img loading="lazy" src={item.url} alt={`media-${i + 1}`} className={imgClass} />
            )}
          </div>
        ))}
      </div>
    );
  }

  if (media.length === 3) {
    return (
      <div className="grid gap-0.5 w-full" style={{ gridTemplateColumns: "2fr 1fr", height: "300px" }}>
        <div className="overflow-hidden cursor-pointer row-span-2 bg-neutral-100" onClick={() => onOpen(0)}>
          <img loading="lazy" src={media[0].url} alt="media-1" className={imgClass} />
        </div>
        {[1, 2].map((i) => (
          <div key={i} className="overflow-hidden cursor-pointer bg-neutral-100" onClick={() => onOpen(i)}>
            <img loading="lazy" src={media[i].url} alt={`media-${i + 1}`} className={imgClass} />
          </div>
        ))}
      </div>
    );
  }

  if (media.length === 4) {
    return (
      <div className="grid grid-cols-2 gap-0.5 w-full" style={{ height: "300px" }}>
        {media.map((item, i) => (
          <div key={i} className="overflow-hidden cursor-pointer bg-neutral-100" onClick={() => onOpen(i)}>
            <img loading="lazy" src={item.url} alt={`media-${i + 1}`} className={imgClass} />
          </div>
        ))}
      </div>
    );
  }

  // 5+
  return (
    <div className="grid gap-0.5 w-full" style={{ gridTemplateColumns: "2fr 1fr", height: "320px" }}>
      <div className="overflow-hidden cursor-pointer row-span-2 bg-neutral-100" onClick={() => onOpen(0)}>
        <img loading="lazy" src={media[0].url} alt="media-1" className={imgClass} />
      </div>
      <div className="overflow-hidden cursor-pointer bg-neutral-100" onClick={() => onOpen(1)}>
        <img loading="lazy" src={media[1].url} alt="media-2" className={imgClass} />
      </div>
      <div className="relative overflow-hidden cursor-pointer bg-neutral-100" onClick={() => onOpen(2)}>
        <img loading="lazy" src={media[2].url} alt="media-3" className={imgClass} />
        {media.length > 3 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white text-2xl font-semibold tracking-tight">+{media.length - 3}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Lightbox ────────────────────────────────────────────────────────────────

function Lightbox({ open, media, index, onClose, onNav, caption }) {
  if (!open || media.length === 0) return null;
  const current = media[index];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width="min(92vw, 1000px)"
      styles={{ content: { padding: 0, background: "#0d0d0d", borderRadius: 12, overflow: "hidden" } }}
      closable={false}
    >
      <div className="relative flex flex-col" style={{ minHeight: "60vh", maxHeight: "92vh" }}>
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <span className="text-white/50 text-xs tabular-nums">
            {index + 1} / {media.length}
          </span>
          <button
            aria-label="Close"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <CloseOutlined style={{ fontSize: 13 }} />
          </button>
        </div>

        {/* Main media */}
        <div className="flex-1 flex items-center justify-center relative overflow-hidden" style={{ minHeight: "50vh" }}>
          {index > 0 && (
            <button
              aria-label="Previous"
              onClick={() => onNav(index - 1)}
              className="absolute left-3 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <LeftOutlined style={{ fontSize: 12 }} />
            </button>
          )}

          {current?.type === "video" ? (
            <video controls src={current.url} className="max-h-[65vh] max-w-full object-contain" />
          ) : (
            <img
              loading="lazy"
              src={current?.url}
              alt={`media-${index + 1}`}
              className="max-h-[65vh] max-w-full object-contain"
            />
          )}

          {index < media.length - 1 && (
            <button
              aria-label="Next"
              onClick={() => onNav(index + 1)}
              className="absolute right-3 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <RightOutlined style={{ fontSize: 12 }} />
            </button>
          )}
        </div>

        {/* Caption */}
        {caption && (
          <div className="px-5 py-3 text-sm text-white/60 text-center leading-relaxed border-t border-white/10 max-h-20 overflow-y-auto">
            {caption}
          </div>
        )}

        {/* Thumbnail strip */}
        {media.length > 1 && (
          <div className="flex gap-1.5 overflow-x-auto px-4 py-3 border-t border-white/10 scrollbar-none">
            {media.map((item, i) => (
              <button
                key={i}
                onClick={() => onNav(i)}
                className={`flex-shrink-0 w-14 h-10 rounded overflow-hidden transition-all ${
                  i === index ? "ring-2 ring-amber-400 opacity-100" : "opacity-50 hover:opacity-80"
                }`}
              >
                {item.type === "video" ? (
                  <video src={item.url} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                ) : (
                  <img loading="lazy" src={item.url} alt={`thumb-${i}`} className="w-full h-full object-cover" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}

// ─── PostCard ─────────────────────────────────────────────────────────────────

export default function PostCard({ post, onEdit }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareLinkCopied, setShareLinkCopied] = useState(false);
  const [authorProfile, setAuthorProfile] = useState(null);
  const [commentsDrawerOpen, setCommentsDrawerOpen] = useState(false);

  const isOwner = user?.uid === post.authorId;

  // ── Normalise media ──────────────────────────────────────────────────────
  const rawMedia =
    Array.isArray(post.mediaItems) && post.mediaItems.length > 0
      ? post.mediaItems
      : Array.isArray(post.imageUrls) && post.imageUrls.length > 0
        ? post.imageUrls.map((u, i) => ({
            url: u,
            type: "image",
            path: Array.isArray(post.imagePaths) ? (post.imagePaths[i] ?? null) : (post.imagePath ?? null),
          }))
        : post.imageUrl
          ? [{ url: post.imageUrl, type: "image", path: post.imagePath ?? null }]
          : [];

  const media = [];
  const _seen = new Set();
  for (const item of rawMedia) {
    if (!item) continue;
    const url = typeof item === "string" ? item : (item.url ?? "");
    const type = typeof item === "object" && item.type ? item.type : "image";
    const path = typeof item === "object" ? (item.path ?? null) : null;
    if (!url || _seen.has(url)) continue;
    _seen.add(url);
    media.push({ url, type, path });
  }

  const authorName = authorProfile?.displayName || post.authorName || "Anonymous";
  const photoURL = authorProfile?.photoURL || post.authorPhotoURL || null;
  const commentsAllowed = post.commentEnabled !== false;
  const shareEnabled = post.shareEnabled !== false;
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/posts/${post.id}` : `/posts/${post.id}`;
  const totalReactions = Object.values(post.reactions || {}).reduce((a, b) => a + (b || 0), 0);

  // ── Link rendering ────────────────────────────────────────────────────────
  function renderTextWithLinks(text) {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s<>"'()]+|(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?(?:\/[^\s<>"'()]*)?)/gi;
    const parts = [];
    let lastIndex = 0;
    let match;
    while ((match = urlRegex.exec(text)) !== null) {
      const url = match[0];
      const href = /^https?:\/\//i.test(url) ? url : `http://${url}`;
      if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
      parts.push(
        <a
          key={`link-${match.index}`}
          href={href}
          target="_blank"
          rel="noreferrer noopener"
          className="text-amber-700 hover:text-amber-900 underline underline-offset-2 decoration-amber-300"
        >
          {url}
        </a>,
      );
      lastIndex = match.index + url.length;
    }
    if (lastIndex < text.length) parts.push(text.slice(lastIndex));
    return parts.length > 0 ? parts : text;
  }

  // ── Effects ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (shareModalOpen) setShareLinkCopied(false);
  }, [shareModalOpen]);

  useEffect(() => {
    if (!post?.authorId || user?.uid === post.authorId) return setAuthorProfile(null);
    let unsub = null;
    let canceled = false;
    import("@/lib/profileCache")
      .then((mod) => {
        if (!canceled) unsub = mod.subscribeToProfile(post.authorId, setAuthorProfile);
      })
      .catch((err) => console.warn("profileCache error", err));
    return () => {
      canceled = true;
      unsub?.();
    };
  }, [post.authorId, user]);

  useEffect(() => {
    if (!post?.id) return;
    const col = collection(doc(db, "posts", post.id), "comments");
    const unsub = onSnapshot(
      col,
      (snap) => setCommentCount(snap.size),
      (err) => console.warn(err),
    );
    return () => unsub();
  }, [post?.id]);

  // ── Delete ────────────────────────────────────────────────────────────────
  async function handleDelete() {
    Modal.confirm({
      title: "Delete this post?",
      content: "This action cannot be undone.",
      okText: "Delete",
      okButtonProps: { danger: true },
      cancelText: "Cancel",
      centered: true,
      onOk: async () => {
        setDeleting(true);
        try {
          const mediaPaths = Array.isArray(post.mediaItems)
            ? post.mediaItems.map((i) => i.path).filter(Boolean)
            : Array.isArray(post.imagePaths)
              ? post.imagePaths
              : post.imagePath
                ? [post.imagePath]
                : [];
          await deletePost(post.id, mediaPaths);
          message.success("Post deleted");
        } catch {
          message.error("Failed to delete post");
        } finally {
          setDeleting(false);
        }
      },
    });
  }

  const menuItems = [
    { key: "edit", icon: <EditOutlined />, label: "Edit post", onClick: () => onEdit?.(post) },
    { type: "divider" },
    {
      key: "delete",
      icon: <DeleteOutlined />,
      label: "Delete post",
      danger: true,
      disabled: deleting,
      onClick: handleDelete,
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <article
        className="post-card bg-white rounded-xl overflow-hidden mb-4 transition-shadow duration-200"
        style={{
          boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.05)",
        }}
      >
        {/* ── Media (bleed to edges, no padding) ── */}
        {media.length > 0 && (
          <div className="overflow-hidden">
            <MediaGrid
              media={media}
              onOpen={(i) => {
                setLightboxIndex(i);
                setLightboxOpen(true);
              }}
            />
          </div>
        )}

        {/* ── Content body ── */}
        <div className="px-5 pt-4 pb-3">
          {/* Author row */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => navigate(`/profile/${post.authorId}`)}
              className="flex items-center gap-2.5 group border-0 bg-transparent p-0 cursor-pointer"
            >
              {photoURL ? (
                <img
                  src={photoURL}
                  alt={authorName}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-transparent group-hover:ring-amber-300 transition-all shrink-0 border border-slate-200 shadow-md"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-xs font-bold text-amber-800 group-hover:bg-amber-100 transition-colors shrink-0">
                  {getInitials(authorName)}
                </div>
              )}
              <div className="text-left">
                <p className="m-0 text-sm font-semibold text-neutral-800 leading-snug group-hover:text-amber-800 transition-colors">
                  {authorName}
                </p>
                <p className="m-0 text-[11px] text-neutral-400 leading-none mt-0.5 flex items-center gap-1">
                  {formatRelativeTime(post.createdAt)}
                  {post.updatedAt && post.updatedAt?.seconds !== post.createdAt?.seconds && (
                    <span className="text-neutral-300">· edited</span>
                  )}
                </p>
              </div>
            </button>

            {isOwner && (
              <Dropdown menu={{ items: menuItems }} placement="bottomRight" trigger={["click"]}>
                <button className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors">
                  <MoreOutlined style={{ fontSize: 16 }} />
                </button>
              </Dropdown>
            )}
          </div>

          {/* Title */}
          {post.title && (
            <h2 className="mb-1.5 font-bold text-[17px] text-neutral-900 leading-snug tracking-tight">{post.title}</h2>
          )}

          {/* Caption */}
          {post.caption && (
            <p className="mb-3 text-sm text-neutral-600 leading-relaxed whitespace-pre-wrap break-words">
              {renderTextWithLinks(post.caption)}
            </p>
          )}

          {/* Tags */}
          {post.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Reactions */}
          <ReactionBar post={post} />

          {/* Stats + Actions row */}
          <div className="mt-3 pt-3 border-t border-neutral-100 flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-neutral-400">
              {totalReactions > 0 && (
                <span>
                  {totalReactions} {totalReactions === 1 ? "reaction" : "reactions"}
                </span>
              )}
              {totalReactions > 0 && commentCount > 0 && <span className="text-neutral-200">·</span>}
              {commentCount > 0 && (
                <span className="flex items-center gap-1">
                  <MessageOutlined style={{ fontSize: 11 }} />
                  {commentCount} {commentCount === 1 ? "comment" : "comments"}
                </span>
              )}
            </div>

            {shareEnabled && (
              <button
                type="button"
                onClick={() => setShareModalOpen(true)}
                className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-amber-700 transition-colors px-2 py-1 rounded-lg hover:bg-amber-50"
              >
                <ShareAltOutlined style={{ fontSize: 12 }} />
                Share
              </button>
            )}
          </div>
        </div>

        {/* Comments section */}
        {commentsAllowed ? (
          <div className="px-5 pb-4 border-t border-neutral-50">
            <div className="pt-3">
              <CommentList postId={post.id} maxTopComments={3} onSeeMore={() => setCommentsDrawerOpen(true)} />
              <CommentComposer postId={post.id} />
            </div>
          </div>
        ) : (
          <div className="flex flex-row items-center gap-2 mx-5 mb-4 mt-1 rounded-lg bg-neutral-50 border border-neutral-100 px-4 py-3 text-xs text-neutral-400">
            <MdOutlineCommentsDisabled className="size-6"/>Comments are turned off for this post.
          </div>
        )}
      </article>

      {/* Comments drawer (bottom) */}
      <Drawer
        open={commentsDrawerOpen}
        onClose={() => setCommentsDrawerOpen(false)}
        placement="bottom"
        height="60vh"
        closeIcon={null}
        bodyStyle={{ padding: 0 }}
      >
        <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
          <h3 className="m-0 text-sm font-semibold">Comments</h3>
          <button onClick={() => setCommentsDrawerOpen(false)} className="text-sm text-neutral-500 hover:text-neutral-700">Close</button>
        </div>
        <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(60vh - 64px)' }}>
          <CommentList postId={post.id} />
          <div className="mt-4">
            <CommentComposer postId={post.id} />
          </div>
        </div>
      </Drawer>

      {/* Lightbox */}
      <Lightbox
        open={lightboxOpen}
        media={media}
        index={lightboxIndex}
        onClose={() => setLightboxOpen(false)}
        onNav={setLightboxIndex}
        caption={post.caption}
      />

      {/* Share modal */}
      <Modal
        open={shareModalOpen}
        onCancel={() => setShareModalOpen(false)}
        title={null}
        centered
        footer={null}
        width={420}
        styles={{ content: { borderRadius: 16, padding: 0, overflow: "hidden" } }}
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center">
              <LinkOutlined style={{ fontSize: 15, color: "#92400e" }} />
            </div>
            <div>
              <p className="m-0 font-semibold text-sm text-neutral-800">Share this post</p>
              <p className="m-0 text-xs text-neutral-400">Copy the link below</p>
            </div>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 flex items-center gap-2 mb-4">
            <span className="flex-1 text-xs text-neutral-500 truncate">{shareUrl}</span>
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShareModalOpen(false)}
              className="px-3 py-1.5 text-sm text-neutral-500 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(shareUrl);
                } catch {
                  /* silent */
                }
                setShareLinkCopied(true);
                message.success("Link copied!");
              }}
              className="px-4 py-1.5 text-sm font-medium rounded-lg transition-colors"
              style={{
                background: shareLinkCopied ? "#d1fae5" : "#fffbeb",
                color: shareLinkCopied ? "#065f46" : "#92400e",
                border: `1px solid ${shareLinkCopied ? "#6ee7b7" : "#fde68a"}`,
              }}
            >
              {shareLinkCopied ? "✓ Copied" : "Copy link"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
