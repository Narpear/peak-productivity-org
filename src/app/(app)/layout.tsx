'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: GridIcon },
  { label: 'Projects',  href: '/projects',  icon: FolderIcon },
  { label: 'My Tasks',  href: '/personal',  icon: CheckIcon },
]

function GridIcon({ active }: { active: boolean }) {
  return (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
      <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
    </svg>
  )
}
function FolderIcon({ active }: { active: boolean }) {
  return (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
      <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/>
    </svg>
  )
}
function CheckIcon({ active }: { active: boolean }) {
  return (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
      <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
    </svg>
  )
}
function SettingsIcon() {
  return (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
    </svg>
  )
}
function LogoutIcon() {
  return (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  )
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuthStore()

  useEffect(() => {
    if (!user) router.push('/login')
  }, [user, router])

  if (!user) return null

  function handleLogout() {
    logout()
    router.push('/login')
  }

  const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--ocean-950)' }}>

      {/* Sidebar */}
      <aside className="w-60 flex flex-col shrink-0 relative overflow-hidden" style={{
        background: 'linear-gradient(180deg, #050f1f 0%, #030b17 100%)',
        borderRight: '1px solid var(--border-subtle)',
      }}>

        {/* Ambient glow top */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full pointer-events-none" style={{
          background: 'radial-gradient(circle, rgba(34,211,238,0.08) 0%, transparent 70%)',
          filter: 'blur(20px)',
        }} />

        {/* Logo */}
        <div className="relative px-5 pt-7 pb-6">
          <div className="flex items-center gap-2.5">
            {/* Wave mark */}
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{
              background: 'linear-gradient(135deg, rgba(14,165,233,0.2), rgba(34,211,238,0.1))',
              border: '1px solid rgba(34,211,238,0.2)',
              boxShadow: '0 0 12px rgba(34,211,238,0.15)',
            }}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth={2}>
                <path d="M2 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0"/>
              </svg>
            </div>
            <div>
              <span className="text-base font-bold tracking-tight gradient-text" style={{ fontFamily: 'var(--font-outfit), sans-serif' }}>Tideflow</span>
              <div className="text-xs font-light" style={{ color: 'var(--text-muted)', letterSpacing: '0.08em' }}>workspace</div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-4 mb-4 h-px" style={{ background: 'linear-gradient(90deg, transparent, var(--border-dim), transparent)' }} />

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5">
          {NAV_ITEMS.map(item => {
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative group"
                style={active ? {
                  background: 'linear-gradient(135deg, rgba(14,165,233,0.15), rgba(34,211,238,0.06))',
                  border: '1px solid rgba(34,211,238,0.18)',
                  color: '#7dd3fc',
                  boxShadow: '0 2px 12px rgba(34,211,238,0.08)',
                } : {
                  color: 'var(--text-muted)',
                  border: '1px solid transparent',
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.color = 'rgba(125,211,252,0.8)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent' }}}
              >
                {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full" style={{ background: 'var(--glow-cyan)', boxShadow: '0 0 8px var(--glow-cyan)' }} />}
                <item.icon active={active} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 pb-5">
          <div className="mx-1 mb-2 h-px" style={{ background: 'linear-gradient(90deg, transparent, var(--border-subtle), transparent)' }} />

          <Link
            href="/settings"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 mb-0.5"
            style={{ color: 'var(--text-muted)', border: '1px solid transparent' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'rgba(125,211,252,0.8)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent' }}
          >
            <SettingsIcon />
            Settings
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 mb-3"
            style={{ color: 'var(--text-muted)', border: '1px solid transparent' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'rgba(248,113,113,0.8)'; e.currentTarget.style.background = 'rgba(239,68,68,0.05)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent' }}
          >
            <LogoutIcon />
            Sign Out
          </button>

          {/* User card */}
          <div className="px-3 py-3 rounded-2xl relative overflow-hidden" style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
            border: '1px solid rgba(34,211,238,0.12)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
          }}>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0" style={{
                  background: `linear-gradient(135deg, ${user.avatar_color}, ${user.avatar_color}aa)`,
                  boxShadow: `0 0 14px ${user.avatar_color}50`,
                }}>
                  {initials}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 6px rgba(52,211,153,0.8)' }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{user.name}</p>
                <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{user.role}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto" style={{ background: 'var(--ocean-950)' }}>
        {children}
      </main>
    </div>
  )
}