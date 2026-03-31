'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin() {
    if (!email || !password) return setError('Please enter email and password')
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  const inputStyle = {
    width: '100%', background: '#0f0f0f', border: '1px solid #2a2a2a',
    borderRadius: 8, padding: '11px 14px', color: '#e5e5e5', fontSize: 14,
    outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'system-ui, sans-serif',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ width: 380 }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40, justifyContent: 'center' }}>
          <div style={{ width: 44, height: 44, background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#EAB308', fontWeight: 700 }}>A&S</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>AAMIR & SONS</div>
            <div style={{ fontSize: 11, color: '#555' }}>TRADING LTD.</div>
          </div>
        </div>

        {/* Card */}
        <div style={{ background: '#161616', border: '1px solid #222', borderRadius: 12, padding: '32px 28px' }}>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: '#fff', margin: '0 0 6px' }}>Sign in</h1>
          <p style={{ fontSize: 13, color: '#555', margin: '0 0 28px' }}>Sign in to your account to continue</p>

          {error && (
            <div style={{ background: '#2a0a0a', border: '1px solid #4a1a1a', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: '#ef4444' }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: '#777', marginBottom: 6, display: 'block' }}>Email</label>
            <input
              style={inputStyle}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 12, color: '#777', marginBottom: 6, display: 'block' }}>Password</label>
            <input
              style={inputStyle}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: '100%', background: loading ? '#a07800' : '#EAB308',
              border: 'none', color: '#000', borderRadius: 8, padding: '12px',
              fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#444' }}>
          Aamir & Sons Trading — Fleet Management System
        </div>
      </div>
    </div>
  )
}