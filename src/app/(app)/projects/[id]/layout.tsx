'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { use } from 'react'

const TABS = [
  { label: 'Daily',   path: 'daily' },
  { label: 'Weekly',  path: 'weekly' },
  { label: 'DAG',     path: 'dag' },
  { label: 'Summary', path: 'summary' },
]

type Member = { id: string; name: string; role: string; avatar_color: string }
type AllUser = { id: string; name: string; role: string; avatar_color: string }

export default function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const pathname = usePathname()
  const [project, setProject] = useState<{ name: string; color: string } | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [allUsers, setAllUsers] = useState<AllUser[]>([])
  const [showMembers, setShowMembers] = useState(false)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    supabase.from('projects').select('name, color').eq('id', id).single()
      .then(({ data }) => setProject(data))
    loadMembers()
  }, [id])

  async function loadMembers() {
    const { data } = await supabase
      .from('project_members')
      .select('user_id, users(id, name, role, avatar_color)')
      .eq('project_id', id)
    setMembers((data ?? []).map((r: any) => r.users).filter(Boolean))
  }

  async function openMembers() {
    const { data } = await supabase.from('users').select('id, name, role, avatar_color')
    setAllUsers(data ?? [])
    setShowMembers(true)
  }

  async function addMember(userId: string) {
    setAdding(true)
    await supabase.from('project_members').insert({ project_id: id, user_id: userId })
    await loadMembers()
    setAdding(false)
  }

  async function removeMember(userId: string) {
    await supabase.from('project_members').delete().eq('project_id', id).eq('user_id', userId)
    await loadMembers()
  }

  const memberIds = new Set(members.map(m => m.id))
  const nonMembers = allUsers.filter(u => !memberIds.has(u.id))

  return (
    <div className="flex flex-col h-full">
      {/* Project header */}
      <div className="px-8 pt-8 pb-0" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            {project && (
              <div className="w-3 h-3 rounded-full shrink-0" style={{
                background: project.color,
                boxShadow: `0 0 10px ${project.color}80`,
              }} />
            )}
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {project?.name ?? '...'}
            </h2>
          </div>

          {/* Members */}
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {members.slice(0, 5).map(m => {
                const initials = m.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                return (
                  <div
                    key={m.id}
                    className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold text-white ring-2"
                    style={{ background: m.avatar_color, ringColor: 'var(--ocean-950)' }}
                    title={m.name}
                  >
                    {initials}
                  </div>
                )
              })}
            </div>
            <button
              onClick={openMembers}
              className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
              style={{ color: 'rgba(34,211,238,0.6)', border: '1px solid rgba(34,211,238,0.2)' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--glow-cyan)'; e.currentTarget.style.borderColor = 'rgba(34,211,238,0.5)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(34,211,238,0.6)'; e.currentTarget.style.borderColor = 'rgba(34,211,238,0.2)' }}
            >
              Manage Members
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-1">
          {TABS.map(tab => {
            const href = `/projects/${id}/${tab.path}`
            const active = pathname === href
            return (
              <Link
                key={tab.path}
                href={href}
                className="px-4 py-2.5 text-sm font-medium transition-all duration-150 relative"
                style={{
                  color: active ? '#7dd3fc' : 'var(--text-muted)',
                  borderBottom: active ? '2px solid var(--glow-cyan)' : '2px solid transparent',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'rgba(125,211,252,0.7)' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'var(--text-muted)' }}
              >
                {tab.label}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>

      {/* Members modal */}
      {showMembers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-md mx-4 rounded-3xl overflow-hidden" style={{
            background: 'linear-gradient(135deg, #0d1f35, #0a1628)',
            border: '1px solid rgba(34,211,238,0.2)',
            boxShadow: '0 40px 100px rgba(0,0,0,0.6)',
          }}>
            <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.6), transparent)' }} />
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Project Members</h3>
                <button onClick={() => setShowMembers(false)} style={{ color: 'var(--text-muted)' }}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              <p className="text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>Current Members</p>
              <div className="space-y-2 mb-6">
                {members.map(m => {
                  const initials = m.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                  return (
                    <div key={m.id} className="flex items-center gap-3 px-4 py-2.5 rounded-xl card">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0" style={{
                        background: m.avatar_color,
                        boxShadow: `0 0 10px ${m.avatar_color}40`,
                      }}>
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{m.name}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{m.role}</p>
                      </div>
                      <button
                        onClick={() => removeMember(m.id)}
                        className="text-xs transition-colors"
                        style={{ color: 'rgba(239,68,68,0.4)' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(239,68,68,0.4)')}
                      >
                        Remove
                      </button>
                    </div>
                  )
                })}
              </div>

              {nonMembers.length > 0 && (
                <>
                  <p className="text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>Add to Project</p>
                  <div className="space-y-2">
                    {nonMembers.map(u => {
                      const initials = u.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                      return (
                        <div key={u.id} className="flex items-center gap-3 px-4 py-2.5 rounded-xl card">
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: u.avatar_color }}>
                            {initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{u.name}</p>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{u.role}</p>
                          </div>
                          <button
                            onClick={() => addMember(u.id)}
                            disabled={adding}
                            className="text-xs px-3 py-1.5 rounded-lg text-white font-medium btn-primary"
                          >
                            Add
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}