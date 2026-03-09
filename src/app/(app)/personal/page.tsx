'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'

type Subtask = { id: string; title: string; completed: boolean }
type Task = { id: string; title: string; description: string | null; status: 'todo' | 'in_progress' | 'done'; subtasks?: Subtask[] }

const STATUS = {
  todo:        { color: '#38bdf8', bg: 'rgba(56,189,248,0.06)',  border: 'rgba(56,189,248,0.15)' },
  in_progress: { color: '#fbbf24', bg: 'rgba(251,191,36,0.06)',  border: 'rgba(251,191,36,0.2)' },
  done:        { color: '#34d399', bg: 'rgba(16,185,129,0.06)',  border: 'rgba(16,185,129,0.2)' },
}

export default function PersonalPage() {
  const { user } = useAuthStore()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [newTitle, setNewTitle] = useState('')
  const [adding, setAdding] = useState(false)
  const [creating, setCreating] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [subtaskInputs, setSubtaskInputs] = useState<Record<string, string>>({})
  const [addingSubtask, setAddingSubtask] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    supabase.from('tasks').select('id, title, description, status, subtasks(id, title, completed)').eq('assigned_to', user.id).eq('type', 'personal').order('position')
      .then(({ data }) => { setTasks((data ?? []) as Task[]); setLoading(false) })
  }, [user])

  async function createTask() {
    if (!newTitle.trim() || !user) return
    setCreating(true)
    const { data } = await supabase.from('tasks').insert({ title: newTitle.trim(), type: 'personal', status: 'todo', assigned_to: user.id, assigned_by: user.id, position: tasks.length }).select('id, title, description, status').single()
    if (data) setTasks(prev => [...prev, { ...data, subtasks: [] }])
    setNewTitle(''); setAdding(false); setCreating(false)
  }

  async function cycleStatus(task: Task) {
    const order: Task['status'][] = ['todo', 'in_progress', 'done']
    const next = order[(order.indexOf(task.status) + 1) % order.length]
    await supabase.from('tasks').update({ status: next }).eq('id', task.id)
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: next } : t))
  }

  async function deleteTask(id: string) {
    await supabase.from('tasks').delete().eq('id', id)
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  async function toggleSubtask(taskId: string, subtask: Subtask) {
    await supabase.from('subtasks').update({ completed: !subtask.completed }).eq('id', subtask.id)
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, subtasks: t.subtasks?.map(s => s.id === subtask.id ? { ...s, completed: !s.completed } : s) } : t))
  }

  async function addSubtask(taskId: string) {
    const title = subtaskInputs[taskId]?.trim()
    if (!title) return
    const { data } = await supabase.from('subtasks').insert({ task_id: taskId, title }).select().single()
    if (data) setTasks(prev => prev.map(t => t.id === taskId ? { ...t, subtasks: [...(t.subtasks ?? []), data] } : t))
    setSubtaskInputs(prev => ({ ...prev, [taskId]: '' })); setAddingSubtask(null)
  }

  async function deleteSubtask(taskId: string, subtaskId: string) {
    await supabase.from('subtasks').delete().eq('id', subtaskId)
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, subtasks: t.subtasks?.filter(s => s.id !== subtaskId) } : t))
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div style={{ width: 18, height: 18, border: '2px solid rgba(56,189,248,0.15)', borderTopColor: '#22d3ee', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /></div>

  return (
    <div style={{ padding: 40, maxWidth: 640 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>My Tasks</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Personal — only visible to you</p>
      </div>

      {/* Add */}
      <div style={{ marginBottom: 24 }}>
        {adding ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 14 }}>
            <input autoFocus value={newTitle} onChange={e => setNewTitle(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') createTask(); if (e.key === 'Escape') setAdding(false) }} placeholder="Task title..." style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: 'var(--text-primary)', fontFamily: 'var(--font-outfit), sans-serif' }} />
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

      {tasks.length === 0 ? (
        <div style={{ border: '1px dashed rgba(56,189,248,0.1)', borderRadius: 16, padding: '60px 24px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No personal tasks yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {tasks.map(task => {
            const s = STATUS[task.status]
            const isExpanded = expanded === task.id
            const doneCount = task.subtasks?.filter(s => s.completed).length ?? 0
            const total = task.subtasks?.length ?? 0
            return (
              <div key={task.id} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 16, overflow: 'hidden', transition: 'all 0.15s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px' }}>
                  <button onClick={() => cycleStatus(task)} style={{ width: 15, height: 15, borderRadius: 4, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: s.bg, border: `1.5px solid ${s.color}`, transition: 'all 0.15s' }}>
                    {task.status === 'done' && <svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke={s.color} strokeWidth={3.5}><path d="M5 13l4 4L19 7"/></svg>}
                    {task.status === 'in_progress' && <div style={{ width: 5, height: 5, borderRadius: '50%', background: s.color }} />}
                  </button>
                  <span onClick={() => setExpanded(isExpanded ? null : task.id)} style={{ flex: 1, fontSize: 13, fontWeight: 500, cursor: 'pointer', color: task.status === 'done' ? 'rgba(186,230,253,0.35)' : 'rgba(186,230,253,0.9)', textDecoration: task.status === 'done' ? 'line-through' : 'none' }}>{task.title}</span>
                  {total > 0 && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{doneCount}/{total}</span>}
                  <button onClick={() => setExpanded(isExpanded ? null : task.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(56,189,248,0.3)', padding: 0 }}>
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d={isExpanded ? 'M18 15l-6-6-6 6' : 'M6 9l6 6 6-6'}/></svg>
                  </button>
                  <button onClick={() => deleteTask(task.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.3, transition: 'opacity 0.15s', padding: 0 }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '0.3')}
                  >
                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#f87171" strokeWidth={2.5}><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                </div>

                {isExpanded && (
                  <div style={{ padding: '12px 14px 14px', borderTop: `1px solid ${s.border}` }}>
                    {(task.subtasks ?? []).map(sub => (
                      <div key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <button onClick={() => toggleSubtask(task.id, sub)} style={{ width: 14, height: 14, borderRadius: 4, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: sub.completed ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.05)', border: sub.completed ? '1px solid rgba(16,185,129,0.5)' : '1px solid rgba(56,189,248,0.2)', transition: 'all 0.15s' }}>
                          {sub.completed && <svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="#34d399" strokeWidth={3.5}><path d="M5 13l4 4L19 7"/></svg>}
                        </button>
                        <span style={{ flex: 1, fontSize: 12, color: sub.completed ? 'rgba(56,189,248,0.3)' : 'rgba(186,230,253,0.7)', textDecoration: sub.completed ? 'line-through' : 'none' }}>{sub.title}</span>
                        <button onClick={() => deleteSubtask(task.id, sub.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.3, transition: 'opacity 0.15s' }}
                          onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                          onMouseLeave={e => (e.currentTarget.style.opacity = '0.3')}
                        >
                          <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="#f87171" strokeWidth={2.5}><path d="M18 6L6 18M6 6l12 12"/></svg>
                        </button>
                      </div>
                    ))}
                    {addingSubtask === task.id ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        <div style={{ width: 14, flexShrink: 0 }} />
                        <input autoFocus value={subtaskInputs[task.id] ?? ''} onChange={e => setSubtaskInputs(prev => ({ ...prev, [task.id]: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') addSubtask(task.id); if (e.key === 'Escape') setAddingSubtask(null) }} onBlur={() => addSubtask(task.id)} placeholder="Subtask title..." style={{ flex: 1, background: 'transparent', border: 'none', borderBottom: '1px solid rgba(56,189,248,0.3)', outline: 'none', fontSize: 12, color: 'var(--text-primary)', fontFamily: 'var(--font-outfit), sans-serif' }} />
                      </div>
                    ) : (
                      <button onClick={() => setAddingSubtask(task.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'rgba(56,189,248,0.35)', marginTop: 4, paddingLeft: 22, transition: 'color 0.15s', fontFamily: 'var(--font-outfit), sans-serif' }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'rgba(56,189,248,0.7)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(56,189,248,0.35)')}
                      >+ subtask</button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}