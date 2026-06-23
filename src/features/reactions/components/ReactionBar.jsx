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

export default function ReactionBar({ post }) {
  const { user } = useAuth()
  const [showPicker, setShowPicker] = useState(false)
  const [pending, setPending] = useState(false)
  const pickerRef = useRef(null)
  const btnRef = useRef(null)
  const timerRef = useRef(null)

  const reactions = post.reactions || {}
  const reactedBy = post.reactedBy || {}
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
      await toggleReaction(post.id, user.uid, reactionKey)
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
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', position: 'relative' }}>
      {/* Reaction summary badges */}
      {topReactions.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            marginRight: '0.25rem',
          }}
        >
          {topReactions.map((r) => (
            <span
              key={r.key}
              title={`${reactions[r.key]} ${r.label}`}
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: '#fff',
                border: '1.5px solid oklch(91% 0 0)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.7rem',
                lineHeight: 1,
                marginLeft: -4,
                boxShadow: '0 1px 3px oklch(0% 0 0 / 0.08)',
                cursor: 'default',
              }}
            >
              {r.emoji}
            </span>
          ))}
          {totalReactions > 0 && (
            <span
              style={{
                fontSize: '0.78rem',
                color: 'oklch(46% 0 0)',
                marginLeft: 6,
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 500,
              }}
            >
              {totalReactions}
            </span>
          )}
        </div>
      )}

      {/* React button */}
      <div style={{ position: 'relative' }}>
        <button
          ref={btnRef}
          className="reaction-btn"
          onClick={handleMainBtnClick}
          disabled={pending}
          style={{
            color: myReaction ? myReactionInfo?.color : undefined,
            background: myReaction ? `${myReactionInfo?.color}15` : undefined,
            fontWeight: myReaction ? 600 : undefined,
          }}
        >
          <span style={{ fontSize: '1rem', lineHeight: 1 }}>
            {myReactionInfo ? myReactionInfo.emoji : '👍'}
          </span>
          <span style={{ fontSize: '0.8rem' }}>
            {myReactionInfo ? myReactionInfo.label : 'React'}
          </span>
        </button>

        {/* Reaction picker popup */}
        {showPicker && (
          <div
            ref={pickerRef}
            style={{
              position: 'absolute',
              bottom: 'calc(100% + 8px)',
              left: 0,
              background: '#fff',
              border: '1px solid oklch(91% 0 0)',
              borderRadius: 999,
              boxShadow: '0 8px 28px oklch(0% 0 0 / 0.13)',
              padding: '0.45rem 0.75rem',
              display: 'flex',
              gap: '0.2rem',
              zIndex: 50,
              animation: 'scaleIn 0.18s ease both',
              transformOrigin: 'bottom left',
            }}
          >
            {REACTIONS.map((r, i) => (
              <button
                key={r.key}
                title={r.label}
                onClick={() => handleReact(r.key)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: '1.4rem',
                  lineHeight: 1,
                  padding: '0.2rem',
                  borderRadius: '50%',
                  transition: 'transform 0.15s ease',
                  animation: `popIn 0.25s ease ${i * 30}ms both`,
                }}
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
