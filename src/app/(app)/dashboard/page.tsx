'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/auth'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type Project = {
  id: string
  name: string
  description: string | null
  color: string
}

type Task = {
  id: string
  title: string
  status: string
  type: string
  project_id: string | null
  projects?: { name: string }[] | { name: string } | null
}

type TeamMember = {
  id: string
  name: string
  role: string
  avatar_color: string
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [projects, setProjects] = useState<Project[]>([])
  const [myTasks, setMyTasks] = useState<Task[]>([])
  const [team, setTeam] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    async function load() {
      // My projects (via project_members)
      const { data: memberRows } = await supabase
        .from('project_members')
        .select('project_id, projects(id, name, description, color)')
        .eq('user_id', user!.id)

      const projs = (memberRows ?? []).map((r: any) => r.projects).filter(Boolean)
      setProjects(projs)

      // My open tasks (daily + weekly, not personal)
      const { data: tasks } = await supabase
        .from('tasks')
        .select('id, title, status, type, project_id, projects(name)')
        .eq('assigned_to', user!.id)
        .in('type', ['daily', 'weekly'])
        .neq('status', 'done')
        .order('created_at', { ascending: false })
        .limit(8)

      setMyTasks(tasks ?? [])

      // All team members
      const { data: members } = await supabase
        .from('users')
        .select('id, name, role, avatar_color')
        .neq('id', user!.id)

      setTeam(members ?? [])
      setLoading(false)
    }
    load()
  }, [user])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(56,189,248,0.2)', borderTopColor: '#38bdf8' }} />
    </div>
  )

  return (
    <div className="p-8 max-w-6xl mx-auto">

      {/* Header */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-white">{greeting}, {user?.name.split(' ')[0]}</h2>
        <p className="text-sm mt-1" style={{ color: 'rgba(56,189,248,0.5)' }}>{user?.role}</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {[
          { label: 'Projects', value: projects.length },
          { label: 'Open Tasks', value: myTasks.length },
          { label: 'Teammates', value: team.length },
        ].map(stat => (
          <div key={stat.label} className="rounded-2xl px-6 py-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(56,189,248,0.08)' }}>
            <p className="text-3xl font-bold text-white">{stat.value}</p>
            <p className="text-xs mt-1 uppercase tracking-widest" style={{ color: 'rgba(56,189,248,0.45)' }}>{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">

        {/* Projects */}
        <div className="col-span-2 space-y-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold uppercase tracking-widest" style={{ color: 'rgba(56,189,248,0.6)' }}>Your Projects</h3>
            <Link href="/projects" className="text-xs text-sky-500 hover:text-sky-400 transition-colors">View all</Link>
          </div>

          {projects.length === 0 ? (
            <div className="rounded-2xl px-6 py-10 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(56,189,248,0.1)' }}>
              <p className="text-sky-600 text-sm">No projects yet.</p>
              <Link href="/projects" className="text-sky-400 text-sm hover:text-sky-300 mt-1 inline-block transition-colors">Create one</Link>
            </div>
          ) : (
            projects.map(p => (
              <Link key={p.id} href={`/projects/${p.id}`} className="block rounded-2xl px-5 py-4 transition-all duration-150 hover:scale-[1.01]" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(56,189,248,0.08)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: p.color }} />
                  <span className="text-sm font-semibold text-sky-100">{p.name}</span>
                </div>
                {p.description && <p className="text-xs mt-1.5 ml-5.5 line-clamp-1" style={{ color: 'rgba(56,189,248,0.4)', marginLeft: '22px' }}>{p.description}</p>}
              </Link>
            ))
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">

          {/* Open Tasks */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: 'rgba(56,189,248,0.6)' }}>Open Tasks</h3>
            <div className="space-y-2">
              {myTasks.length === 0 ? (
                <p className="text-sky-700 text-xs">No open tasks — all clear!</p>
              ) : myTasks.map(t => (
                <div key={t.id} className="rounded-xl px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(56,189,248,0.07)' }}>
                  <p className="text-xs text-sky-200 font-medium line-clamp-1">{t.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs" style={{ color: 'rgba(56,189,248,0.4)' }}>
                        {Array.isArray(t.projects) ? t.projects[0]?.name : t.projects?.name ?? 'Personal'}
                    </span>
                    <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: t.type === 'daily' ? 'rgba(14,165,233,0.15)' : 'rgba(139,92,246,0.15)', color: t.type === 'daily' ? '#38bdf8' : '#a78bfa' }}>{t.type}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Team */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: 'rgba(56,189,248,0.6)' }}>Team</h3>
            <div className="space-y-2">
              {team.map(m => {
                const initials = m.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
                return (
                  <div key={m.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(56,189,248,0.07)' }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: m.avatar_color }}>
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-sky-200 truncate">{m.name}</p>
                      <p className="text-xs truncate" style={{ color: 'rgba(56,189,248,0.4)' }}>{m.role}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}