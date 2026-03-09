'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'

type Subtask = { id: string; title: string; completed: boolean; position: number }
type Task = {
  id: string; title: string; description: string | null
  status: 'todo' | 'in_progress' | 'done'
  type: 'daily' | 'weekly'; assigned_to: string | null; assigned_by: string | null
  due_date: string | null; position: number
  subtasks?: Subtask[]
  assignee?: { name: string; avatar_color: string } | null
}
type Member = { id: string; name: string; avatar_color: string; role: string }

const COLS: { key: Task['status']; label: string; color: string; bg: string; border: string }[] = [
  { key: 'todo',        label: 'To Do',       color: '#38bdf8', bg: 'rgba(56,189,248,0.06)',  border: 'rgba(56,189,248,0.15)' },
  { key: 'in_progress', label: 'In Progress', color: '#fbbf24', bg: 'rgba(251,191,36,0.06)',  border: 'rgba(251,191,36,0.2)' },
  { key: 'done',        label: 'Done',        color: '#34d399', bg: 'rgba(16,185,129,0.06)',  border: 'rgba(16,185,129,0.2)' },
]

function SubtaskList({ taskId }: { taskId: string }) {
  const [subtasks, setSubtasks] = useState<Subtask[]>([])
  const [adding, setAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')

  useEffect(() => {
    supabase.from('subtasks').select('*').eq('task_id', taskId).order('position').then(({ data }) => setSubtasks(data ?? []))
  }, [taskId])

  async function toggle(s: Subtask) {
    await supabase.from('subtasks').update({ completed: !s.completed }).eq('id', s.id)
    setSubtasks(prev => prev.map(x => x.id === s.id ? { ...x, completed: !x.completed } : x))
  }
  async function add() {
    if (!newTitle.trim()) return
    const { data } = await supabase.from('subtasks').insert({ task_id: taskId, title: newTitle.trim(), position: subtasks.length }).select().single()
    if (data) setSubtasks(prev => [...prev, data])
    setNewTitle(''); setAdding(false)
  }
  async function del(id: string) {
    await supabase.from('subtasks').delete().eq('id', id)
    setSubtasks(prev => prev.filter(s => s.id !== id))
  }

  return (
    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
      {subtasks.map(s => (
        <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => toggle(s)} style={{ width: 14, height: 14, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer', background: s.completed ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.05)', border: s.completed ? '1px solid rgba(16,185,129,0.5)' : '1px solid rgba(56,189,248,0.2)', transition: 'all 0.15s' }}>
            {s.completed && <svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="#34d399" strokeWidth={3.5}><path d="M5 13l4 4L19 7"/></svg>}
          </button>
          <span style={{ flex: 1, fontSize: 11, color: s.completed ? 'rgba(56,189,248,0.3)' : 'rgba(186,230,253,0.7)', textDecoration: s.completed ? 'line-through' : 'none' }}>{s.title}</span>
          <button onClick={() => del(s.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, opacity: 0.4, transition: 'opacity 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '0.4')}
          >
            <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="#f87171" strokeWidth={2.5}><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
      ))}
      {adding ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 14, flexShrink: 0 }} />
          <input autoFocus value={newTitle} onChange={e => setNewTitle(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') add(); if (e.key === 'Escape') setAdding(false) }} onBlur={add} placeholder="Subtask..." style={{ flex: 1, background: 'transparent', border: 'none', borderBottom: '1px solid rgba(56,189,248,0.3)', outline: 'none', fontSize: 11, color: 'var(--text-primary)', fontFamily: 'var(--font-outfit), sans-serif' }} />
        </div>
      ) : (
        <button onClick={() => setAdding(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'rgba(56,189,248,0.35)', textAlign: 'left', paddingLeft: 22, transition: 'color 0.15s', fontFamily: 'var(--font-outfit), sans-serif' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(56,189,248,0.7)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(56,189,248,0.35)')}
        >+ subtask</button>
      )}
    </div>
  )
}

function TaskCard({ task, members, onStatusChange, onDelete, onUpdate }: {
  task: Task; members: Member[]
  onStatusChange: (id: string, s: Task['status']) => void
  onDelete: (id: string) => void
  onUpdate: (id: string, f: Partial<Task>) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [editDesc, setEditDesc] = useState(task.description ?? '')
  const col = COLS.find(c => c.key === task.status)!

  async function saveEdit() {
    const u = { title: editTitle.trim(), description: editDesc.trim() || null }
    await supabase.from('tasks').update(u).eq('id', task.id)
    onUpdate(task.id, u); setEditing(false)
  }

  async function reassign(userId: string) {
    const assignee = members.find(m => m.id === userId) ?? null
    await supabase.from('tasks').update({ assigned_to: userId || null }).eq('id', task.id)
    onUpdate(task.id, { assigned_to: userId || null, assignee: assignee ? { name: assignee.name, avatar_color: assignee.avatar_color } : null })
  }

  async function cycleStatus() {
    const order: Task['status'][] = ['todo', 'in_progress', 'done']
    const next = order[(order.indexOf(task.status) + 1) % order.length]
    await supabase.from('tasks').update({ status: next }).eq('id', task.id)
    onStatusChange(task.id, next)
  }

  const assigneeInitials = task.assignee?.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div style={{ background: col.bg, border: `1px solid ${col.border}`, borderRadius: 14, overflow: 'hidden', transition: 'all 0.15s' }}>
      <div style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <button onClick={cycleStatus} style={{ width: 15, height: 15, borderRadius: 4, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginTop: 2, background: col.bg, border: `1.5px solid ${col.color}`, transition: 'all 0.15s' }}>
            {task.status === 'done' && <svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke={col.color} strokeWidth={3.5}><path d="M5 13l4 4L19 7"/></svg>}
            {task.status === 'in_progress' && <div style={{ width: 5, height: 5, borderRadius: '50%', background: col.color }} />}
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            {editing ? (
              <input autoFocus value={editTitle} onChange={e => setEditTitle(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditing(false) }} style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(56,189,248,0.4)', outline: 'none', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', fontFamily: 'var(--font-outfit), sans-serif' }} />
            ) : (
              <p onClick={() => setExpanded(e => !e)} style={{ fontSize: 13, fontWeight: 500, cursor: 'pointer', color: task.status === 'done' ? 'rgba(186,230,253,0.35)' : 'rgba(186,230,253,0.9)', textDecoration: task.status === 'done' ? 'line-through' : 'none', wordBreak: 'break-word' }}>{task.title}</p>
            )}
          </div>
          {task.assignee && (
            <div style={{ width: 22, height: 22, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: 'white', background: task.assignee.avatar_color, flexShrink: 0 }}>{assigneeInitials}</div>
          )}
          <button onClick={() => setExpanded(e => !e)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(56,189,248,0.3)', flexShrink: 0, padding: 0 }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d={expanded ? 'M18 15l-6-6-6 6' : 'M6 9l6 6 6-6'}/></svg>
          </button>
        </div>

        {expanded && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${col.border}` }}>
            {editing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="Description..." rows={2} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 8, padding: '8px 10px', fontSize: 12, color: 'var(--text-secondary)', outline: 'none', resize: 'none', fontFamily: 'var(--font-outfit), sans-serif', boxSizing: 'border-box' }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={saveEdit} style={{ padding: '4px 12px', background: 'rgba(14,165,233,0.25)', border: 'none', borderRadius: 8, color: '#38bdf8', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-outfit), sans-serif' }}>Save</button>
                  <button onClick={() => setEditing(false)} style={{ padding: '4px 12px', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-outfit), sans-serif' }}>Cancel</button>
                </div>
              </div>
            ) : (
              task.description && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>{task.description}</p>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Assign:</span>
              <select value={task.assigned_to ?? ''} onChange={e => reassign(e.target.value)} style={{ fontSize: 11, padding: '3px 8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(56,189,248,0.15)', borderRadius: 8, color: '#7dd3fc', outline: 'none', fontFamily: 'var(--font-outfit), sans-serif' }}>
                <option value="">Unassigned</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>

            <SubtaskList taskId={task.id} />

            <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
              <button onClick={() => setEditing(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'rgba(56,189,248,0.4)', fontFamily: 'var(--font-outfit), sans-serif', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#38bdf8')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(56,189,248,0.4)')}
              >Edit</button>
              <button onClick={() => onDelete(task.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'rgba(239,68,68,0.4)', fontFamily: 'var(--font-outfit), sans-serif', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(239,68,68,0.4)')}
              >Delete</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function getWeekNumber(d: Date) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

export default function TaskBoard({ projectId, type, weekNumber, year }: { projectId: string; type: 'daily' | 'weekly'; weekNumber?: number; year?: number }) {
  const { user } = useAuthStore()
  const [tasks, setTasks] = useState<Task[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newAssignee, setNewAssignee] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!projectId) return
    async function load() {
      const { data: memberRows } = await supabase.from('project_members').select('user_id, users(id, name, avatar_color, role)').eq('project_id', projectId)
      setMembers((memberRows ?? []).map((r: any) => r.users).filter(Boolean))
      let query = supabase.from('tasks').select('*, assignee:assigned_to(name, avatar_color)').eq('project_id', projectId).eq('type', type).order('position')
      if (type === 'weekly' && weekNumber && year) query = query.eq('week_number', weekNumber).eq('year', year)
      const { data } = await query
      setTasks((data ?? []) as Task[])
      setLoading(false)
    }
    load()
  }, [projectId, type, weekNumber, year])

  async function createTask() {
    if (!newTitle.trim()) return
    setCreating(true)
    const now = new Date()
    const { data } = await supabase.from('tasks').insert({
      title: newTitle.trim(), type, status: 'todo', project_id: projectId,
      assigned_to: newAssignee || null, assigned_by: user!.id,
      week_number: weekNumber ?? getWeekNumber(now), year: year ?? now.getFullYear(), position: tasks.length,
    }).select('*, assignee:assigned_to(name, avatar_color)').single()
    if (data) setTasks(prev => [...prev, data as Task])
    setNewTitle(''); setNewAssignee(''); setAdding(false); setCreating(false)
  }

  function onStatusChange(id: string, status: Task['status']) { setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t)) }
  async function onDelete(id: string) { await supabase.from('tasks').delete().eq('id', id); setTasks(prev => prev.filter(t => t.id !== id)) }
  function onUpdate(id: string, fields: Partial<Task>) { setTasks(prev => prev.map(t => t.id === id ? { ...t, ...fields } : t)) }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}><div style={{ width: 18, height: 18, border: '2px solid rgba(56,189,248,0.15)', borderTopColor: '#22d3ee', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /></div>

  return (
    <div style={{ padding: 32 }}>
      {/* Add task bar */}
      <div style={{ marginBottom: 24 }}>
        {adding ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 14 }}>
            <input autoFocus value={newTitle} onChange={e => setNewTitle(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') createTask(); if (e.key === 'Escape') setAdding(false) }} placeholder="Task title..." style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: 'var(--text-primary)', fontFamily: 'var(--font-outfit), sans-serif' }} />
            <select value={newAssignee} onChange={e => setNewAssignee(e.target.value)} style={{ fontSize: 12, padding: '4px 10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(56,189,248,0.15)', borderRadius: 8, color: '#7dd3fc', outline: 'none', fontFamily: 'var(--font-outfit), sans-serif' }}>
              <option value="">Assign to...</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <button onClick={createTask} disabled={creating} style={{ padding: '6px 16px', background: 'linear-gradient(135deg, #0891b2, #0ea5e9)', border: 'none', borderRadius: 8, color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-outfit), sans-serif' }}>{creating ? '...' : 'Add'}</button>
            <button onClick={() => setAdding(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-outfit), sans-serif' }}>Cancel</button>
          </div>
        ) : (
          <button onClick={() => setAdding(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'transparent', border: '1px dashed rgba(56,189,248,0.2)', borderRadius: 12, color: 'rgba(56,189,248,0.5)', fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'var(--font-outfit), sans-serif' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#38bdf8'; e.currentTarget.style.borderColor = 'rgba(56,189,248,0.5)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(56,189,248,0.5)'; e.currentTarget.style.borderColor = 'rgba(56,189,248,0.2)' }}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M12 5v14M5 12h14"/></svg>
            Add Task
          </button>
        )}
      </div>

      {/* Kanban */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        {COLS.map(col => {
          const colTasks = tasks.filter(t => t.status === col.key)
          return (
            <div key={col.key} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 18, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: col.color, boxShadow: `0 0 8px ${col.color}` }} />
                  <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: col.color }}>{col.label}</span>
                </div>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: col.bg, color: col.color, border: `1px solid ${col.border}` }}>{colTasks.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {colTasks.map(t => <TaskCard key={t.id} task={t} members={members} onStatusChange={onStatusChange} onDelete={onDelete} onUpdate={onUpdate} />)}
                {colTasks.length === 0 && <p style={{ fontSize: 12, color: 'rgba(56,189,248,0.15)', textAlign: 'center', padding: '24px 0' }}>Empty</p>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}