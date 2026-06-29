import { useState, useRef, useEffect } from 'react'
import { message } from 'antd'
import { useAuth } from '@/store/AuthContext'
import { toggleReaction } from '@/services/postsService'

const REACTIONS = [
  { key: 'like',  emoji: '👍', label: 'Like',  color: '#6366f1' },
  { key: 'heart', emoji: '❤️', label: 'Heart', color: '#ef4444' },
  { key: 'care',  emoji: '🤗', label: 'Care',  color: '#f59e0b' },
  { key: 'laugh', emoji: '😂', label: 'Laugh', color: '#eab308' },
  { key: 'sad',   emoji: '😢', label: 'Sad',   color: '#3b82f6' },
  { key: 'angry', emoji: '😡', label: 'Angry', color: '#f97316' },
]

export default function ReactionBar({ post, item, onToggle }) {
  const { user } = useAuth()
  const [showPicker, setShowPicker] = useState(false)
  const [pending, setPending] = useState(false)
  const pickerRef = useRef(null)
  const btnRef = useRef(null)
  const timerRef = useRef(null)

  const target = item || post
  const reactions = target?.reactions || {}
  const reactedBy = target?.reactedBy || {}
  const myReaction = user ? reactedBy[user.uid] : null
  const myReactionInfo = REACTIONS.find((r) => r.key === myReaction)

  const totalReactions = Object.values(reactions).reduce((a, b) => a + b, 0)

  useEffect(() => {
    function handleClick(e) {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(e.target) &&
        btnRef.current &&
        !btnRef.current.contains(e.target)
      ) {
        setShowPicker(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleReact(reactionKey) {
    if (!user) {
      message.info('Sign in to react to posts 😊')
      setShowPicker(false)
      return
    }
    if (pending) return
    setPending(true)
    setShowPicker(false)
    try {
      if (onToggle) {
        await onToggle(target.id, user.uid, reactionKey)
      } else {
        await toggleReaction(post.id, user.uid, reactionKey)
      }
    } catch {
      message.error('Could not save reaction')
    } finally {
      setPending(false)
    }
  }

  function handleMainBtnClick() {
    if (!user) {
      message.info('Sign in to react to posts 😊')
      return
    }
    if (myReaction) {
      handleReact(myReaction) // toggle off
    } else {
      setShowPicker((v) => !v)
    }
  }

  // Top 3 distinct reaction emojis for summary
  const topReactions = REACTIONS.filter((r) => reactions[r.key] > 0)
    .sort((a, b) => reactions[b.key] - reactions[a.key])
    .slice(0, 3)

  return (
    <div className="flex items-center gap-2 relative">
      {/* Reaction summary badges */}
      {topReactions.length > 0 && (
        <div className="flex items-center -space-x-1 mr-1">
          {topReactions.map((r) => (
            <span
              key={r.key}
              title={`${reactions[r.key]} ${r.label}`}
              className="w-5 h-5 rounded-full bg-white border-[1.5px] border-neutral-200 flex items-center justify-center text-[10px] shadow-sm"
            >
              {r.emoji}
            </span>
          ))}
          {totalReactions > 0 && (
            <span className="ml-2 text-sm text-neutral-600 font-medium">{totalReactions}</span>
          )}
        </div>
      )}

      {/* React button */}
      <div className="relative">
        <button
          ref={btnRef}
          className={`reaction-btn inline-flex items-center gap-2 px-3 py-1 rounded-full shadow-sm border-slate-200 ${myReaction ? 'font-semibold' : ''}`}
          onClick={handleMainBtnClick}
          disabled={pending}
          style={{ color: myReaction ? myReactionInfo?.color : undefined, background: myReaction ? `${myReactionInfo?.color}15` : undefined }}
        >
          <span className="text-sm leading-none">{myReactionInfo ? myReactionInfo.emoji : '👍'}</span>
          <span className="text-xs">{myReactionInfo ? myReactionInfo.label : 'React'}</span>
        </button>

        {/* Reaction picker popup */}
        {showPicker && (
          <div
            ref={pickerRef}
            className="absolute bottom-[calc(100%+8px)] left-0 bg-white border border-slate-100 rounded-full shadow-lg p-2 flex gap-1 z-50 animate-scale-in origin-bottom-left"
          >
            {REACTIONS.map((r, i) => (
              <button
                key={r.key}
                title={r.label}
                onClick={() => handleReact(r.key)}
                className="bg-transparent border-0 cursor-pointer text-xl p-1 rounded-full transform transition-transform duration-150"
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.35)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                {r.emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
