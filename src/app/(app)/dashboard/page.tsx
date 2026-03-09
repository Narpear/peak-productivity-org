'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/auth'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type Project = { id: string; name: string; description: string | null; color: string }
type Task = {
  id: string; title: string; status: string; type: string
  project_id: string | null
  projects?: { name: string }[] | { name: string } | null
}
type TeamMember = { id: string; name: string; role: string; avatar_color: string }

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [projects, setProjects] = useState<Project[]>([])
  const [myTasks, setMyTasks] = useState<Task[]>([])
  const [team, setTeam] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    async function load() {
      const { data: memberRows } = await supabase
        .from('project_members')
        .select('project_id, projects(id, name, description, color)')
        .eq('user_id', user!.id)
      setProjects((memberRows ?? []).map((r: any) => r.projects).filter(Boolean))

      const { data: tasks } = await supabase
        .from('tasks')
        .select('id, title, status, type, project_id, projects(name)')
        .eq('assigned_to', user!.id)
        .in('type', ['daily', 'weekly'])
        .neq('status', 'done')
        .order('created_at', { ascending: false })
        .limit(8)
      setMyTasks(tasks ?? [])

      const { data: members } = await supabase
        .from('users').select('id, name, role, avatar_color').neq('id', user!.id)
      setTeam(members ?? [])
      setLoading(false)
    }
    load()
  }, [user])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div style={{ width: 20, height: 20, border: '2px solid rgba(56,189,248,0.15)', borderTopColor: '#22d3ee', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  return (
    <div style={{ padding: '40px 40px 40px 40px', maxWidth: 1100, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <p style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>{greeting}</p>
        <h1 style={{ fontSize: 42, fontWeight: 700, fontFamily: 'var(--font-fraunces), Georgia, serif', fontStyle: 'italic', background: 'linear-gradient(135deg, #e0f2fe 0%, #7dd3fc 50%, #22d3ee 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1.1 }}>
          {user?.name.split(' ')[0]}.
        </h1>
        <p style={{ fontSize: 13, marginTop: 6, color: 'var(--text-secondary)' }}>{user?.role}</p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 40 }}>
        {[
          { label: 'Active Projects', value: projects.length, color: '#22d3ee',  border: 'rgba(34,211,238,0.2)' },
          { label: 'Open Tasks',      value: myTasks.length,  color: '#a78bfa',  border: 'rgba(167,139,250,0.2)' },
          { label: 'Teammates',       value: team.length,     color: '#2dd4bf',  border: 'rgba(45,212,191,0.2)' },
        ].map(stat => (
          <div key={stat.label} style={{ background: 'var(--surface-1)', border: `1px solid ${stat.border}`, borderRadius: 16, padding: '20px 24px', position: 'relative', overflow: 'hidden', boxShadow: `0 0 24px ${stat.border}` }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${stat.color}60, transparent)` }} />
            <p style={{ fontSize: 32, fontWeight: 700, color: stat.color, lineHeight: 1 }}>{stat.value}</p>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-muted)', marginTop: 6 }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Main content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32 }}>

        {/* Projects */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-muted)' }}>Your Projects</p>
            <Link href="/projects" style={{ fontSize: 12, color: 'rgba(34,211,238,0.5)', textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#22d3ee')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(34,211,238,0.5)')}
            >
              View all
            </Link>
          </div>

          {projects.length === 0 ? (
            <div style={{ border: '1px dashed rgba(56,189,248,0.1)', borderRadius: 16, padding: '48px 24px', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No projects yet.</p>
              <Link href="/projects" style={{ color: '#22d3ee', fontSize: 13, marginTop: 4, display: 'inline-block' }}>Create one</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {projects.map(p => (
                <Link key={p.id} href={`/projects/${p.id}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 16, transition: 'all 0.2s ease', cursor: 'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.borderColor = 'var(--border-dim)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-1)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  <div style={{ width: 4, height: 40, borderRadius: 99, background: p.color, boxShadow: `0 0 10px ${p.color}80`, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{p.name}</p>
                    {p.description && <p style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.description}</p>}
                  </div>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="rgba(34,211,238,0.4)" strokeWidth={2} style={{ flexShrink: 0 }}>
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

          {/* Open tasks */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-muted)', marginBottom: 16 }}>Open Tasks</p>
            {myTasks.length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>All clear — no open tasks.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {myTasks.map(t => {
                  const projName = Array.isArray(t.projects) ? t.projects[0]?.name : (t.projects as any)?.name
                  return (
                    <div key={t.id} style={{ padding: '10px 14px', background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 12 }}>
                      <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {projName && <span style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{projName}</span>}
                        <span style={{ fontSize: 11, padding: '1px 8px', borderRadius: 99, flexShrink: 0, ...(t.type === 'daily' ? { background: 'rgba(14,165,233,0.12)', color: '#38bdf8' } : { background: 'rgba(139,92,246,0.12)', color: '#a78bfa' }) }}>
                          {t.type}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Crew */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-muted)', marginBottom: 16 }}>Crew</p>
            {team.length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No teammates yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {team.map(m => {
                  const initials = m.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
                  return (
                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 12 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white', flexShrink: 0, background: `linear-gradient(135deg, ${m.avatar_color}, ${m.avatar_color}99)`, boxShadow: `0 0 10px ${m.avatar_color}40` }}>
                        {initials}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</p>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.role}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}