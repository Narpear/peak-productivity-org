'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'
import { getRandomRole } from '@/lib/roles'
import Link from 'next/link'

const AVATAR_COLORS = [
  '#0ea5e9', '#8b5cf6', '#10b981', '#ef4444',
  '#f59e0b', '#ec4899', '#6366f1', '#14b8a6',
  '#f97316', '#84cc16',
]

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

    // Check if email already exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (existing) {
      setError('An account with this email already exists.')
      setLoading(false)
      return
    }

    const role = getRandomRole()
    const avatar_color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]

    const { data, error: err } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase().trim(),
        password,
        name: name.trim(),
        role,
        avatar_color,
      })
      .select()
      .single()

    if (err || !data) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
      return
    }

    setUser({ id: data.id, email: data.email, name: data.name, role: data.role, avatar_color: data.avatar_color })
    router.push('/dashboard')
  }

  const inputStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(56,189,248,0.2)',
    boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.2)',
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #020c1b 0%, #041529 30%, #062040 55%, #073a5e 80%, #0a4f7a 100%)' }}>
      <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #0ea5e9 0%, transparent 70%)', filter: 'blur(40px)' }} />
      <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)', filter: 'blur(50px)' }} />

      <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
        <svg viewBox="0 0 1440 200" className="w-full" preserveAspectRatio="none" style={{ height: '180px' }}>
          <path d="M0,120 C200,160 400,80 600,120 C800,160 1000,80 1200,120 C1300,140 1380,130 1440,120 L1440,200 L0,200 Z" fill="rgba(14,165,233,0.07)" />
          <path d="M0,140 C240,100 480,170 720,140 C960,110 1200,160 1440,140 L1440,200 L0,200 Z" fill="rgba(6,182,212,0.07)" />
        </svg>
      </div>

      <div className="relative z-10 w-full max-w-md px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold tracking-tight mb-2" style={{ background: 'linear-gradient(90deg, #e0f2fe, #7dd3fc, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Tideflow
          </h1>
          <p className="text-sky-400/80 text-sm tracking-widest uppercase font-light">Join the crew</p>
        </div>

        <div className="relative rounded-3xl overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)', border: '1px solid rgba(56,189,248,0.2)', boxShadow: '0 32px 80px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)' }}>
          <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(56,189,248,0.6), transparent)' }} />

          <div className="p-8">
            <p className="text-sky-300/70 text-xs uppercase tracking-widest mb-6 text-center font-medium">Create your account</p>

            <form onSubmit={handleSignup} className="space-y-5">
              <div>
                <label className="block text-sky-300/80 text-xs font-semibold mb-2 tracking-wider uppercase">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Your name"
                  className="w-full rounded-xl px-4 py-3 text-white text-sm placeholder-sky-700 outline-none transition-all duration-200"
                  style={inputStyle}
                  onFocus={e => { e.target.style.border = '1px solid rgba(56,189,248,0.6)'; e.target.style.background = 'rgba(255,255,255,0.08)' }}
                  onBlur={e => { e.target.style.border = '1px solid rgba(56,189,248,0.2)'; e.target.style.background = 'rgba(255,255,255,0.05)' }}
                />
              </div>

              <div>
                <label className="block text-sky-300/80 text-xs font-semibold mb-2 tracking-wider uppercase">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@yourco.com"
                  className="w-full rounded-xl px-4 py-3 text-white text-sm placeholder-sky-700 outline-none transition-all duration-200"
                  style={inputStyle}
                  onFocus={e => { e.target.style.border = '1px solid rgba(56,189,248,0.6)'; e.target.style.background = 'rgba(255,255,255,0.08)' }}
                  onBlur={e => { e.target.style.border = '1px solid rgba(56,189,248,0.2)'; e.target.style.background = 'rgba(255,255,255,0.05)' }}
                />
              </div>

              <div>
                <label className="block text-sky-300/80 text-xs font-semibold mb-2 tracking-wider uppercase">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full rounded-xl px-4 py-3 text-white text-sm placeholder-sky-700 outline-none transition-all duration-200"
                  style={inputStyle}
                  onFocus={e => { e.target.style.border = '1px solid rgba(56,189,248,0.6)'; e.target.style.background = 'rgba(255,255,255,0.08)' }}
                  onBlur={e => { e.target.style.border = '1px solid rgba(56,189,248,0.2)'; e.target.style.background = 'rgba(255,255,255,0.05)' }}
                />
              </div>

              <p className="text-sky-500/70 text-xs">You'll be assigned a coastal role at random. You can change it later from your profile.</p>

              {error && (
                <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <span className="text-red-400 text-sm">{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full font-semibold py-3 rounded-xl text-sm tracking-wide transition-all duration-300 text-white mt-2"
                style={{ background: loading ? 'rgba(6,182,212,0.4)' : 'linear-gradient(135deg, #0891b2, #0ea5e9)', boxShadow: loading ? 'none' : '0 8px 32px rgba(6,182,212,0.35), inset 0 1px 0 rgba(255,255,255,0.2)' }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Setting sail...
                  </span>
                ) : 'Join the Crew'}
              </button>
            </form>

            <p className="text-center text-sky-600 text-xs mt-6">
              Already on board?{' '}
              <Link href="/login" className="text-sky-400 hover:text-sky-300 transition-colors font-medium">
                Sign in
              </Link>
            </p>
          </div>

          <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(56,189,248,0.2), transparent)' }} />
        </div>
      </div>
    </div>
  )
}