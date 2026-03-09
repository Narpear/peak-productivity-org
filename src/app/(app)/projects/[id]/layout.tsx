'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { use } from 'react'

const TABS = [
  { label: 'Daily',   path: 'daily' },
  { label: 'Weekly',  path: 'weekly' },
  { label: 'DAG',     path: 'dag' },
  { label: 'Summary', path: 'summary' },
]

type Member = { id: string; name: string; role: string; avatar_color: string }

export default function ProjectLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const pathname = usePathname()
  const [project, setProject] = useState<{ name: string; color: string } | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [allUsers, setAllUsers] = useState<Member[]>([])
  const [showMembers, setShowMembers] = useState(false)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    supabase.from('projects').select('name, color').eq('id', id).single().then(({ data }) => setProject(data))
    loadMembers()
  }, [id])

  async function loadMembers() {
    const { data } = await supabase.from('project_members').select('user_id, users(id, name, role, avatar_color)').eq('project_id', id)
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Project header */}
      <div style={{ padding: '32px 40px 0', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {project && <div style={{ width: 12, height: 12, borderRadius: '50%', background: project.color, boxShadow: `0 0 12px ${project.color}`, flexShrink: 0 }} />}
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{project?.name ?? '...'}</h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex' }}>
              {members.slice(0, 5).map((m, i) => {
                const initials = m.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                return (
                  <div key={m.id} title={m.name} style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'white', background: m.avatar_color, border: '2px solid #030b17', marginLeft: i > 0 ? -8 : 0, zIndex: members.length - i }}>
                    {initials}
                  </div>
                )
              })}
            </div>
            <button onClick={openMembers} style={{ padding: '6px 14px', background: 'transparent', border: '1px solid rgba(34,211,238,0.2)', borderRadius: 10, color: 'rgba(34,211,238,0.6)', fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'var(--font-outfit), sans-serif' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#22d3ee'; e.currentTarget.style.borderColor = 'rgba(34,211,238,0.5)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(34,211,238,0.6)'; e.currentTarget.style.borderColor = 'rgba(34,211,238,0.2)' }}
            >
              Manage Members
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4 }}>
          {TABS.map(tab => {
            const href = `/projects/${id}/${tab.path}`
            const active = pathname === href
            return (
              <Link key={tab.path} href={href} style={{ textDecoration: 'none', padding: '8px 16px', fontSize: 13, fontWeight: 500, color: active ? '#7dd3fc' : 'var(--text-muted)', borderBottom: active ? '2px solid #22d3ee' : '2px solid transparent', transition: 'all 0.15s', position: 'relative' }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'rgba(125,211,252,0.7)' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'var(--text-muted)' }}
              >
                {tab.label}
              </Link>
            )
          })}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>{children}</div>

      {/* Members modal */}
      {showMembers && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div style={{ width: '100%', maxWidth: 440, margin: '0 16px', borderRadius: 24, overflow: 'hidden', background: 'linear-gradient(135deg, #0d1f35, #0a1628)', border: '1px solid rgba(34,211,238,0.2)', boxShadow: '0 40px 100px rgba(0,0,0,0.6)' }}>
            <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.6), transparent)' }} />
            <div style={{ padding: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Project Members</h3>
                <button onClick={() => setShowMembers(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>

              <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: 12 }}>Current Members</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                {members.map(m => {
                  const initials = m.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                  return (
                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 12 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white', background: m.avatar_color, boxShadow: `0 0 10px ${m.avatar_color}40`, flexShrink: 0 }}>{initials}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{m.name}</p>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.role}</p>
                      </div>
                      <button onClick={() => removeMember(m.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'rgba(239,68,68,0.4)', transition: 'color 0.15s', fontFamily: 'var(--font-outfit), sans-serif' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(239,68,68,0.4)')}
                      >Remove</button>
                    </div>
                  )
                })}
              </div>

              {nonMembers.length > 0 && (
                <>
                  <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: 12 }}>Add to Project</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {nonMembers.map(u => {
                      const initials = u.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                      return (
                        <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 12 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white', background: u.avatar_color, flexShrink: 0 }}>{initials}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{u.name}</p>
                            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.role}</p>
                          </div>
                          <button onClick={() => addMember(u.id)} disabled={adding} style={{ padding: '6px 14px', background: 'linear-gradient(135deg, #0891b2, #0ea5e9)', border: 'none', borderRadius: 8, color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-outfit), sans-serif' }}>Add</button>
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