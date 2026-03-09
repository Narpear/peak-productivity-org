'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/auth'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type Project = { id: string; name: string; description: string | null; color: string; archived: boolean }

const COLORS = ['#0ea5e9','#8b5cf6','#10b981','#ef4444','#f59e0b','#ec4899','#6366f1','#14b8a6','#f97316','#84cc16']

export default function ProjectsPage() {
  const { user } = useAuthStore()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => { if (user) fetchProjects() }, [user])

  async function fetchProjects() {
    const { data } = await supabase.from('project_members').select('project_id, projects(id, name, description, color, archived)').eq('user_id', user!.id)
    setProjects((data ?? []).map((r: any) => r.projects).filter(Boolean))
    setLoading(false)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    const { data: project } = await supabase.from('projects').insert({ name: name.trim(), description: description.trim() || null, color }).select().single()
    if (project) {
      await supabase.from('project_members').insert({ project_id: project.id, user_id: user!.id })
      setProjects(prev => [...prev, project])
    }
    setName(''); setDescription(''); setColor(COLORS[0]); setShowForm(false); setCreating(false)
  }

  async function handleDelete() {
    if (!deleteTarget || deleteConfirm !== deleteTarget.name) return
    setDeleting(true)
    await supabase.from('projects').delete().eq('id', deleteTarget.id)
    setProjects(prev => prev.filter(p => p.id !== deleteTarget.id))
    setDeleteTarget(null)
    setDeleteConfirm('')
    setDeleting(false)
  }

  const active = projects.filter(p => !p.archived)
  const archived = projects.filter(p => p.archived)

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 16px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(56,189,248,0.15)',
    borderRadius: 12, color: 'var(--text-primary)',
    fontSize: 13, outline: 'none',
    fontFamily: 'var(--font-outfit), sans-serif',
    boxSizing: 'border-box',
  }

  return (
    <div style={{ padding: 40, maxWidth: 900, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 40 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Projects</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{active.length} active</p>
        </div>
        <button onClick={() => setShowForm(true)} style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #0891b2, #0ea5e9)', border: 'none', borderRadius: 12, color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 20px rgba(6,182,212,0.3)', fontFamily: 'var(--font-outfit), sans-serif' }}>
          New Project
        </button>
      </div>

      {/* Create modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div style={{ width: '100%', maxWidth: 440, margin: '0 16px', borderRadius: 24, overflow: 'hidden', background: 'linear-gradient(135deg, #0d1f35, #0a1628)', border: '1px solid rgba(34,211,238,0.2)', boxShadow: '0 40px 100px rgba(0,0,0,0.6)' }}>
            <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.6), transparent)' }} />
            <div style={{ padding: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>New Project</h3>
                <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
              <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: 8 }}>Name</label>
                  <input value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Product Redesign" style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = 'rgba(34,211,238,0.5)')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(56,189,248,0.15)')}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: 8 }}>Description</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional" rows={3} style={{ ...inputStyle, resize: 'none' }}
                    onFocus={e => (e.target.style.borderColor = 'rgba(34,211,238,0.5)')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(56,189,248,0.15)')}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: 10 }}>Color</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {COLORS.map(c => (
                      <button key={c} type="button" onClick={() => setColor(c)} style={{ width: 26, height: 26, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer', outline: color === c ? `3px solid ${c}` : 'none', outlineOffset: 2, opacity: color === c ? 1 : 0.45, transition: 'all 0.15s' }} />
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                  <button type="button" onClick={() => setShowForm(false)} style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(56,189,248,0.15)', borderRadius: 12, color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-outfit), sans-serif' }}>Cancel</button>
                  <button type="submit" disabled={creating} style={{ flex: 1, padding: '10px', background: 'linear-gradient(135deg, #0891b2, #0ea5e9)', border: 'none', borderRadius: 12, color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-outfit), sans-serif', opacity: creating ? 0.6 : 1 }}>{creating ? 'Creating...' : 'Create'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
          <div style={{ width: '100%', maxWidth: 420, margin: '0 16px', borderRadius: 24, overflow: 'hidden', background: 'linear-gradient(135deg, #0d1f35, #0a1628)', border: '1px solid rgba(239,68,68,0.25)', boxShadow: '0 40px 100px rgba(0,0,0,0.6)' }}>
            <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.6), transparent)' }} />
            <div style={{ padding: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Delete Project</h3>
                <button onClick={() => { setDeleteTarget(null); setDeleteConfirm('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>

              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.6 }}>
                This will permanently delete <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{deleteTarget.name}</span> and all its tasks, subtasks, and dependencies. This cannot be undone.
              </p>

              <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 12, marginBottom: 16 }}>
                <p style={{ fontSize: 12, color: 'rgba(248,113,113,0.7)' }}>
                  Type <span style={{ fontWeight: 700, color: '#f87171', fontFamily: 'monospace' }}>{deleteTarget.name}</span> to confirm
                </p>
              </div>

              <input
                autoFocus
                value={deleteConfirm}
                onChange={e => setDeleteConfirm(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleDelete() }}
                placeholder={deleteTarget.name}
                style={{ width: '100%', padding: '11px 16px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${deleteConfirm === deleteTarget.name ? 'rgba(239,68,68,0.5)' : 'rgba(56,189,248,0.15)'}`, borderRadius: 12, color: 'var(--text-primary)', fontSize: 13, outline: 'none', fontFamily: 'var(--font-outfit), sans-serif', boxSizing: 'border-box', marginBottom: 16, transition: 'border-color 0.15s' }}
              />

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => { setDeleteTarget(null); setDeleteConfirm('') }} style={{ flex: 1, padding: '11px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(56,189,248,0.15)', borderRadius: 12, color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-outfit), sans-serif' }}>
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteConfirm !== deleteTarget.name || deleting}
                  style={{ flex: 1, padding: '11px', background: deleteConfirm === deleteTarget.name ? 'linear-gradient(135deg, #dc2626, #ef4444)' : 'rgba(239,68,68,0.15)', border: 'none', borderRadius: 12, color: deleteConfirm === deleteTarget.name ? 'white' : 'rgba(239,68,68,0.4)', fontSize: 13, fontWeight: 600, cursor: deleteConfirm === deleteTarget.name ? 'pointer' : 'not-allowed', fontFamily: 'var(--font-outfit), sans-serif', transition: 'all 0.2s', boxShadow: deleteConfirm === deleteTarget.name ? '0 4px 20px rgba(239,68,68,0.3)' : 'none' }}
                >
                  {deleting ? 'Deleting...' : 'Delete Project'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
          <div style={{ width: 20, height: 20, border: '2px solid rgba(56,189,248,0.15)', borderTopColor: '#22d3ee', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : (
        <>
          {active.length === 0 ? (
            <div style={{ border: '1px dashed rgba(56,189,248,0.1)', borderRadius: 16, padding: '64px 24px', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 8 }}>No projects yet.</p>
              <button onClick={() => setShowForm(true)} style={{ color: '#22d3ee', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontFamily: 'var(--font-outfit), sans-serif' }}>Create your first one</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {active.map(p => (
                <div key={p.id} style={{ position: 'relative' }}
                  onMouseEnter={e => { const btn = e.currentTarget.querySelector('.delete-btn') as HTMLElement; if (btn) btn.style.opacity = '1' }}
                  onMouseLeave={e => { const btn = e.currentTarget.querySelector('.delete-btn') as HTMLElement; if (btn) btn.style.opacity = '0' }}
                >
                  <Link href={`/projects/${p.id}`} style={{ textDecoration: 'none', display: 'block', padding: 24, background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 20, transition: 'all 0.2s ease', cursor: 'pointer' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.borderColor = 'var(--border-dim)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.3)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-1)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color, boxShadow: `0 0 12px ${p.color}` }} />
                      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="rgba(34,211,238,0.3)" strokeWidth={2}><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </div>
                    <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>{p.name}</p>
                    {p.description && <p style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.description}</p>}
                  </Link>

                  {/* Delete button */}
                  <button
                    className="delete-btn"
                    onClick={() => { setDeleteTarget(p); setDeleteConfirm('') }}
                    style={{ position: 'absolute', bottom: 14, right: 14, width: 28, height: 28, borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.25)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)' }}
                    title="Delete project"
                  >
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#f87171" strokeWidth={2.5}>
                      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {archived.length > 0 && (
            <div style={{ marginTop: 40, opacity: 0.5 }}>
              <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-muted)', marginBottom: 16 }}>Archived</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {archived.map(p => (
                  <Link key={p.id} href={`/projects/${p.id}`} style={{ textDecoration: 'none', padding: 24, background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 20, display: 'block' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color, marginBottom: 12 }} />
                    <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</p>
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