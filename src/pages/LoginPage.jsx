import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { message } from 'antd'
import { GoogleOutlined, CameraOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons'
import { useAuth } from '@/store/AuthContext'

export default function LoginPage() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleGoogleSignIn() {
    setLoading(true)
    try {
      await signInWithGoogle()
      message.success('Welcome back! 🎉')
      navigate('/')
    } catch (err) {
      message.error(err.message || 'Google sign-in failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleEmailAuth() {
    if (!email || !password) { message.warning('Please fill in all fields'); return }
    if (mode === 'signup' && !displayName.trim()) { message.warning('Enter your display name'); return }
    if (password.length < 6) { message.warning('Password must be at least 6 characters'); return }

    setLoading(true)
    try {
      if (mode === 'login') {
        await signInWithEmail(email, password)
        message.success('Welcome back! 🌞')
      } else {
        await signUpWithEmail(email, password, displayName.trim())
        message.success('Account created! Welcome to Dayfie 🎉')
      }
      navigate('/')
    } catch (err) {
      const errorMap = {
        'auth/user-not-found': 'No account with that email',
        'auth/wrong-password': 'Incorrect password',
        'auth/email-already-in-use': 'Email already registered',
        'auth/invalid-email': 'Invalid email address',
        'auth/invalid-credential': 'Invalid email or password',
      }
      message.error(errorMap[err.code] || err.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'oklch(99.5% 0 0)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.25rem',
        fontFamily: 'Poppins, sans-serif',
      }}
    >
      {/* Decorative blobs */}
      <div style={{ position: 'fixed', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: 'oklch(96% 0.04 265)', filter: 'blur(60px)', zIndex: 0, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: -60, left: -60, width: 260, height: 260, borderRadius: '50%', background: 'oklch(97% 0.02 200)', filter: 'blur(50px)', zIndex: 0, pointerEvents: 'none' }} />

      <div
        className="animate-scale-in"
        style={{
          background: '#fff',
          border: '1px solid oklch(91% 0 0)',
          borderRadius: '1.5rem',
          boxShadow: '0 8px 40px oklch(0% 0 0 / 0.09)',
          padding: '2.5rem',
          width: '100%',
          maxWidth: 420,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: '16px',
              background: 'oklch(55% 0.18 265)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 0.85rem',
              boxShadow: '0 4px 16px oklch(55% 0.18 265 / 0.35)',
            }}
          >
            <CameraOutlined style={{ color: '#fff', fontSize: 24 }} />
          </div>
          <h1 style={{ margin: 0, fontWeight: 700, fontSize: '1.65rem', color: 'oklch(16% 0 0)', letterSpacing: '-0.02em' }}>
            Dayfie
          </h1>
          <p style={{ margin: '0.3rem 0 0', fontSize: '0.82rem', color: 'oklch(58% 0 0)' }}>
            {mode === 'login' ? 'Sign in to your account' : 'Create your Dayfie account'}
          </p>
        </div>

        {/* Google */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          style={{
            width: '100%',
            padding: '0.7rem 1rem',
            borderRadius: '0.625rem',
            border: '1.5px solid oklch(88% 0 0)',
            background: '#fff',
            cursor: 'pointer',
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 500,
            fontSize: '0.88rem',
            color: 'oklch(26% 0 0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.6rem',
            marginBottom: '1.25rem',
            transition: 'border-color 0.2s, box-shadow 0.2s',
            opacity: loading ? 0.6 : 1,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'oklch(72% 0 0)'; e.currentTarget.style.boxShadow = '0 2px 8px oklch(0% 0 0 / 0.07)' }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'oklch(88% 0 0)'; e.currentTarget.style.boxShadow = 'none' }}
        >
          <GoogleOutlined style={{ fontSize: 16, color: '#4285F4' }} />
          Continue with Google
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div className="divider" style={{ flex: 1 }} />
          <span style={{ fontSize: '0.75rem', color: 'oklch(58% 0 0)', whiteSpace: 'nowrap' }}>or with email</span>
          <div className="divider" style={{ flex: 1 }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* Display name (signup only) */}
          {mode === 'signup' && (
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'oklch(46% 0 0)', display: 'block', marginBottom: '0.35rem' }}>
                Display Name
              </label>
              <input
                className="input-field"
                type="text"
                placeholder="What should we call you?"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
          )}

          {/* Email */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'oklch(46% 0 0)', display: 'block', marginBottom: '0.35rem' }}>
              Email
            </label>
            <input
              className="input-field"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleEmailAuth()}
            />
          </div>

          {/* Password */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'oklch(46% 0 0)', display: 'block', marginBottom: '0.35rem' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                className="input-field"
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleEmailAuth()}
                style={{ paddingRight: '2.5rem' }}
              />
              <button
                onClick={() => setShowPass((v) => !v)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'oklch(58% 0 0)',
                  padding: 0,
                  display: 'flex',
                }}
              >
                {showPass ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              </button>
            </div>
          </div>

          <button
            className="btn-primary"
            onClick={handleEmailAuth}
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '0.7rem', marginTop: '0.25rem', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </div>

        {/* Toggle mode */}
        <p style={{ textAlign: 'center', marginTop: '1.35rem', fontSize: '0.82rem', color: 'oklch(58% 0 0)' }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setEmail(''); setPassword(''); setDisplayName('') }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'oklch(55% 0.18 265)',
              fontFamily: 'Poppins, sans-serif',
              fontWeight: 600,
              fontSize: '0.82rem',
              padding: 0,
            }}
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>

        <p style={{ textAlign: 'center', marginTop: '1rem' }}>
          <Link to="/" style={{ fontSize: '0.78rem', color: 'oklch(58% 0 0)', textDecoration: 'none' }}>
            ← Back to feed
          </Link>
        </p>
      </div>
    </div>
  )
}
