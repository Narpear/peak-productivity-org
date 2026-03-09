'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'
import { getRandomRole } from '@/lib/roles'
import Link from 'next/link'

const AVATAR_COLORS = ['#0ea5e9','#8b5cf6','#10b981','#ef4444','#f59e0b','#ec4899','#6366f1','#14b8a6','#f97316','#84cc16']

export default function SignupPage() {
  const router = useRouter()
  const setUser = useAuthStore((s) => s.setUser)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: existing } = await supabase.from('users').select('id').eq('email', email.toLowerCase().trim()).single()
    if (existing) { setError('An account with this email already exists.'); setLoading(false); return }

    const role = getRandomRole()
    const avatar_color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]

    const { data, error: err } = await supabase.from('users').insert({
      email: email.toLowerCase().trim(), password, name: name.trim(), role, avatar_color,
    }).select().single()

    if (err || !data) { setError('Something went wrong. Please try again.'); setLoading(false); return }

    setUser({ id: data.id, email: data.email, name: data.name, role: data.role, avatar_color: data.avatar_color })
    router.push('/dashboard')
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(56,189,248,0.15)',
    borderRadius: 12, color: 'rgba(224,242,254,0.95)',
    fontSize: 13, outline: 'none',
    fontFamily: 'var(--font-outfit), sans-serif',
    boxSizing: 'border-box', transition: 'border-color 0.15s',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 600,
    textTransform: 'uppercase', letterSpacing: '0.12em',
    color: 'rgba(56,189,248,0.5)', marginBottom: 8,
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #020c1b 0%, #041529 30%, #062040 55%, #073a5e 80%, #0a4f7a 100%)' }}>

      {/* Glows */}
      <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(14,165,233,0.12) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 70%)', filter: 'blur(50px)', pointerEvents: 'none' }} />

      {/* Waves */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, pointerEvents: 'none' }}>
        <svg viewBox="0 0 1440 200" style={{ width: '100%', height: 160, display: 'block' }} preserveAspectRatio="none">
          <path d="M0,120 C200,160 400,80 600,120 C800,160 1000,80 1200,120 C1300,140 1380,130 1440,120 L1440,200 L0,200 Z" fill="rgba(14,165,233,0.06)" />
          <path d="M0,140 C240,100 480,170 720,140 C960,110 1200,160 1440,140 L1440,200 L0,200 Z" fill="rgba(6,182,212,0.05)" />
        </svg>
      </div>

      {/* Card */}
      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 420, padding: '0 24px' }}>

        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(14,165,233,0.2), rgba(34,211,238,0.08))', border: '1px solid rgba(34,211,238,0.2)', boxShadow: '0 0 14px rgba(34,211,238,0.15)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth={2.5}>
                <path d="M2 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0"/>
              </svg>
            </div>
            <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #e0f2fe, #7dd3fc, #22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Swiftflow</span>
          </div>
          <p style={{ fontSize: 12, color: 'rgba(56,189,248,0.45)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Join the crew</p>
        </div>

        {/* Form card */}
        <div style={{ borderRadius: 24, overflow: 'hidden', background: 'linear-gradient(135deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03))', border: '1px solid rgba(56,189,248,0.15)', boxShadow: '0 32px 80px rgba(0,0,0,0.4)' }}>
          <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.6), transparent)' }} />
          <div style={{ padding: 28 }}>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(56,189,248,0.4)', textAlign: 'center', marginBottom: 24 }}>Create your account</p>

            <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={labelStyle}>Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Your name" style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = 'rgba(34,211,238,0.5)')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(56,189,248,0.15)')}
                />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@yourco.com" style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = 'rgba(34,211,238,0.5)')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(56,189,248,0.15)')}
                />
              </div>
              <div>
                <label style={labelStyle}>Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = 'rgba(34,211,238,0.5)')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(56,189,248,0.15)')}
                />
              </div>

              <p style={{ fontSize: 12, color: 'rgba(56,189,248,0.35)', lineHeight: 1.5 }}>
                You'll be assigned a coastal role at random. You can change it later from your profile.
              </p>

              {error && (
                <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10 }}>
                  <span style={{ fontSize: 13, color: '#f87171' }}>{error}</span>
                </div>
              )}

              <button type="submit" disabled={loading} style={{ width: '100%', padding: '13px', background: loading ? 'rgba(6,182,212,0.3)' : 'linear-gradient(135deg, #0891b2, #0ea5e9)', border: 'none', borderRadius: 12, color: 'white', fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-outfit), sans-serif', boxShadow: loading ? 'none' : '0 8px 24px rgba(6,182,212,0.3)', transition: 'all 0.2s', marginTop: 4 }}>
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                    Setting sail...
                  </span>
                ) : 'Join the Crew'}
              </button>
            </form>

            <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(56,189,248,0.35)', marginTop: 20 }}>
              Already on board?{' '}
              <Link href="/login" style={{ color: 'rgba(34,211,238,0.7)', textDecoration: 'none', fontWeight: 500, transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#22d3ee')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(34,211,238,0.7)')}
              >Sign in</Link>
            </p>
          </div>
          <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.15), transparent)' }} />
        </div>
      </div>
    </div>
  )
}