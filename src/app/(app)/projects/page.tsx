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
  archived: boolean
}

const COLORS = [
  '#0ea5e9', '#8b5cf6', '#10b981', '#ef4444',
  '#f59e0b', '#ec4899', '#6366f1', '#14b8a6',
  '#f97316', '#84cc16',
]

export default function ProjectsPage() {
  const { user } = useAuthStore()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(COLORS[0])

  useEffect(() => {
    if (user) fetchProjects()
  }, [user])

  async function fetchProjects() {
    const { data } = await supabase
      .from('project_members')
      .select('project_id, projects(id, name, description, color, archived)')
      .eq('user_id', user!.id)

    const projs = (data ?? []).map((r: any) => r.projects).filter(Boolean)
    setProjects(projs)
    setLoading(false)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)

    const { data: project, error } = await supabase
      .from('projects')
      .insert({ name: name.trim(), description: description.trim() || null, color })
      .select()
      .single()

    if (error || !project) { setCreating(false); return }

    await supabase.from('project_members').insert({ project_id: project.id, user_id: user!.id })

    setProjects(prev => [...prev, project])
    setName('')
    setDescription('')
    setColor(COLORS[0])
    setShowForm(false)
    setCreating(false)
  }

  const inputStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(56,189,248,0.15)',
    boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.2)',
  }

  const active = projects.filter(p => !p.archived)
  const archived = projects.filter(p => p.archived)

  return (
    <div className="p-8 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h2 className="text-2xl font-bold text-white">Projects</h2>
          <p className="text-sm mt-1" style={{ color: 'rgba(56,189,248,0.4)' }}>{active.length} active</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all duration-200"
          style={{ background: 'linear-gradient(135deg, #0891b2, #0ea5e9)', boxShadow: '0 4px 20px rgba(6,182,212,0.3)' }}
        >
          New Project
        </button>
      </div>

      {/* Create form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-md mx-4 rounded-3xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #0d1f35, #0a1628)', border: '1px solid rgba(56,189,248,0.2)', boxShadow: '0 40px 100px rgba(0,0,0,0.6)' }}>
            <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(56,189,248,0.6), transparent)' }} />
            <div className="p-8">
              <h3 className="text-lg font-bold text-white mb-6">New Project</h3>
              <form onSubmit={handleCreate} className="space-y-5">
                <div>
                  <label className="block text-sky-300/80 text-xs font-semibold mb-2 tracking-wider uppercase">Project Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    placeholder="e.g. Product Redesign"
                    className="w-full rounded-xl px-4 py-3 text-white text-sm placeholder-sky-700 outline-none transition-all duration-200"
                    style={inputStyle}
                    onFocus={e => { e.target.style.border = '1px solid rgba(56,189,248,0.5)' }}
                    onBlur={e => { e.target.style.border = '1px solid rgba(56,189,248,0.15)' }}
                  />
                </div>
                <div>
                  <label className="block text-sky-300/80 text-xs font-semibold mb-2 tracking-wider uppercase">Description</label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="What's this project about? (optional)"
                    rows={3}
                    className="w-full rounded-xl px-4 py-3 text-white text-sm placeholder-sky-700 outline-none transition-all duration-200 resize-none"
                    style={inputStyle}
                    onFocus={e => { e.target.style.border = '1px solid rgba(56,189,248,0.5)' }}
                    onBlur={e => { e.target.style.border = '1px solid rgba(56,189,248,0.15)' }}
                  />
                </div>
                <div>
                  <label className="block text-sky-300/80 text-xs font-semibold mb-3 tracking-wider uppercase">Color</label>
                  <div className="flex gap-2 flex-wrap">
                    {COLORS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className="w-7 h-7 rounded-full transition-all duration-150"
                        style={{
                          background: c,
                          outline: color === c ? `3px solid ${c}` : 'none',
                          outlineOffset: '2px',
                          opacity: color === c ? 1 : 0.5,
                        }}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(56,189,248,0.15)', color: 'rgba(148,210,245,0.7)' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200"
                    style={{ background: 'linear-gradient(135deg, #0891b2, #0ea5e9)', boxShadow: '0 4px 20px rgba(6,182,212,0.3)' }}
                  >
                    {creating ? 'Creating...' : 'Create Project'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(56,189,248,0.2)', borderTopColor: '#38bdf8' }} />
        </div>
      ) : (
        <>
          {/* Active projects grid */}
          {active.length === 0 ? (
            <div className="rounded-2xl px-6 py-16 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(56,189,248,0.1)' }}>
              <p className="text-sky-600 text-sm">No projects yet.</p>
              <button onClick={() => setShowForm(true)} className="text-sky-400 text-sm hover:text-sky-300 mt-1 transition-colors">Create your first one</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {active.map(p => (
                <Link
                  key={p.id}
                  href={`/projects/${p.id}`}
                  className="group rounded-2xl p-6 transition-all duration-200 hover:scale-[1.02]"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(56,189,248,0.08)' }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-3 h-3 rounded-full mt-1" style={{ background: p.color, boxShadow: `0 0 12px ${p.color}80` }} />
                    <svg className="w-4 h-4 opacity-0 group-hover:opacity-40 transition-opacity" style={{ color: '#38bdf8' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </div>
                  <h3 className="text-base font-semibold text-sky-100 mb-1">{p.name}</h3>
                  {p.description && <p className="text-xs line-clamp-2" style={{ color: 'rgba(56,189,248,0.4)' }}>{p.description}</p>}
                </Link>
              ))}
            </div>
          )}

          {/* Archived */}
          {archived.length > 0 && (
            <div className="mt-10">
              <h3 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'rgba(56,189,248,0.3)' }}>Archived</h3>
              <div className="grid grid-cols-2 gap-4 opacity-50">
                {archived.map(p => (
                  <Link key={p.id} href={`/projects/${p.id}`} className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(56,189,248,0.05)' }}>
                    <div className="w-3 h-3 rounded-full mb-4" style={{ background: p.color }} />
                    <h3 className="text-base font-semibold text-sky-300">{p.name}</h3>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}