'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { label: 'Dashboard',  href: '/dashboard',  icon: 'grid' },
  { label: 'Projects',   href: '/projects',   icon: 'folder' },
  { label: 'My Tasks',   href: '/personal',   icon: 'check-square' },
]

function Icon({ name }: { name: string }) {
  const cls = "w-4 h-4"
  if (name === 'grid') return (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  )
  if (name === 'folder') return (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/>
    </svg>
  )
  if (name === 'check-square') return (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
    </svg>
  )
  if (name === 'log-out') return (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  )
  if (name === 'settings') return (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
    </svg>
  )
  return null
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
    <div className="flex h-screen overflow-hidden" style={{ background: '#070f1a' }}>

      {/* Sidebar */}
      <aside className="w-56 flex flex-col shrink-0 relative" style={{ background: 'linear-gradient(180deg, #0a1628 0%, #071020 100%)', borderRight: '1px solid rgba(56,189,248,0.08)' }}>

        {/* Logo */}
        <div className="px-5 pt-6 pb-5" style={{ borderBottom: '1px solid rgba(56,189,248,0.06)' }}>
          <h1 className="text-lg font-bold tracking-tight" style={{ background: 'linear-gradient(90deg, #e0f2fe, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Tideflow
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(56,189,248,0.4)' }}>workspace</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 pt-4 space-y-0.5">
          {NAV_ITEMS.map(item => {
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                  active
                    ? 'text-white'
                    : 'text-sky-400/50 hover:text-sky-300/80 hover:bg-white/5'
                )}
                style={active ? {
                  background: 'linear-gradient(135deg, rgba(14,165,233,0.18), rgba(6,182,212,0.08))',
                  border: '1px solid rgba(56,189,248,0.18)',
                  color: '#7dd3fc',
                } : {}}
              >
                <Icon name={item.icon} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Bottom: user + logout */}
        <div className="px-3 pb-5 space-y-0.5" style={{ borderTop: '1px solid rgba(56,189,248,0.06)', paddingTop: '12px' }}>
          <Link
            href="/settings"
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
              pathname === '/settings' ? 'text-sky-300' : 'text-sky-400/50 hover:text-sky-300/80 hover:bg-white/5'
            )}
          >
            <Icon name="settings" />
            Settings
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-sky-400/50 hover:text-red-400/80 hover:bg-red-500/5 transition-all duration-150"
          >
            <Icon name="log-out" />
            Sign Out
          </button>

          {/* User card */}
          <div className="mt-3 px-3 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(56,189,248,0.08)' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: user.avatar_color }}>
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-sky-200 truncate">{user.name}</p>
                <p className="text-xs truncate" style={{ color: 'rgba(56,189,248,0.45)' }}>{user.role}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}