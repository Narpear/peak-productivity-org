'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'

const NAV = [
  { label: 'Dashboard', href: '/dashboard', icon: (a: boolean) => (
    <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={a ? 2 : 1.5}>
      <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
    </svg>
  )},
  { label: 'Projects', href: '/projects', icon: (a: boolean) => (
    <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={a ? 2 : 1.5}>
      <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/>
    </svg>
  )},
  { label: 'My Tasks', href: '/personal', icon: (a: boolean) => (
    <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={a ? 2 : 1.5}>
      <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
    </svg>
  )},
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuthStore()

  useEffect(() => { if (!user) router.push('/login') }, [user, router])
  if (!user) return null

  const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--ocean-950)' }}>

      {/* Sidebar */}
      <aside style={{ width: 232, display: 'flex', flexDirection: 'column', flexShrink: 0, background: 'linear-gradient(180deg, #050f1f 0%, #030b17 100%)', borderRight: '1px solid var(--border-subtle)', position: 'relative', overflow: 'hidden' }}>

        {/* Top glow */}
        <div style={{ position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)', width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,211,238,0.07) 0%, transparent 70%)', filter: 'blur(20px)', pointerEvents: 'none' }} />

        {/* Logo */}
        <div style={{ padding: '28px 20px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(14,165,233,0.2), rgba(34,211,238,0.08))', border: '1px solid rgba(34,211,238,0.18)', boxShadow: '0 0 14px rgba(34,211,238,0.12)', flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth={2.5}>
                <path d="M2 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #e0f2fe, #7dd3fc, #22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Tideflow</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em', marginTop: 1 }}>workspace</div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ margin: '0 16px 16px', height: 1, background: 'linear-gradient(90deg, transparent, var(--border-dim), transparent)' }} />

        {/* Nav */}
        <nav style={{ flex: 1, padding: '0 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV.map(item => {
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <Link key={item.href} href={item.href} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 12, fontSize: 13, fontWeight: 500, transition: 'all 0.15s ease', position: 'relative', border: '1px solid transparent', color: active ? '#7dd3fc' : 'var(--text-muted)', background: active ? 'linear-gradient(135deg, rgba(14,165,233,0.13), rgba(34,211,238,0.05))' : 'transparent', borderColor: active ? 'rgba(34,211,238,0.15)' : 'transparent' }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.color = 'rgba(125,211,252,0.8)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent' }}}
              >
                {active && <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: 18, borderRadius: 99, background: 'var(--glow-cyan)', boxShadow: '0 0 8px var(--glow-cyan)' }} />}
                {item.icon(active)}
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Bottom */}
        <div style={{ padding: '12px 10px 20px' }}>
          <div style={{ height: 1, margin: '0 6px 10px', background: 'linear-gradient(90deg, transparent, var(--border-subtle), transparent)' }} />

          {[
            { label: 'Settings', href: '/settings', icon: <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg> },
          ].map(item => (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 12, fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', transition: 'all 0.15s ease', marginBottom: 2 }}
              onMouseEnter={e => { e.currentTarget.style.color = 'rgba(125,211,252,0.8)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent' }}
            >
              {item.icon}{item.label}
            </Link>
          ))}

          <button onClick={() => { logout(); router.push('/login') }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 12, fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer', transition: 'all 0.15s ease', marginBottom: 12 }}
            onMouseEnter={e => { e.currentTarget.style.color = 'rgba(248,113,113,0.8)'; e.currentTarget.style.background = 'rgba(239,68,68,0.05)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent' }}
          >
            <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Sign Out
          </button>

          {/* User card */}
          <div style={{ padding: '12px 14px', borderRadius: 14, background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))', border: '1px solid rgba(34,211,238,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white', background: `linear-gradient(135deg, ${user.avatar_color}, ${user.avatar_color}99)`, boxShadow: `0 0 14px ${user.avatar_color}50` }}>
                  {initials}
                </div>
                <div style={{ position: 'absolute', bottom: -1, right: -1, width: 9, height: 9, borderRadius: '50%', background: '#34d399', border: '2px solid #050f1f', boxShadow: '0 0 6px rgba(52,211,153,0.7)' }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.role}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main style={{ flex: 1, overflowY: 'auto', background: 'var(--ocean-950)' }}>
        {children}
      </main>
    </div>
  )
}