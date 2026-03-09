'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'

type Subtask = {
  id: string
  title: string
  completed: boolean
}

type Task = {
  id: string
  title: string
  description: string | null
  status: 'todo' | 'in_progress' | 'done'
  subtasks?: Subtask[]
}

const STATUS_STYLES = {
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
    supabase
      .from('tasks')
      .select('id, title, description, status, subtasks(id, title, completed)')
      .eq('assigned_to', user.id)
      .eq('type', 'personal')
      .order('position')
      .then(({ data }) => {
        setTasks((data ?? []) as Task[])
        setLoading(false)
      })
  }, [user])

  async function createTask() {
    if (!newTitle.trim() || !user) return
    setCreating(true)
    const { data } = await supabase.from('tasks').insert({
      title: newTitle.trim(),
      type: 'personal',
      status: 'todo',
      assigned_to: user.id,
      assigned_by: user.id,
      position: tasks.length,
    }).select('id, title, description, status').single()

    if (data) setTasks(prev => [...prev, { ...data, subtasks: [] }])
    setNewTitle('')
    setAdding(false)
    setCreating(false)
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
    setTasks(prev => prev.map(t => t.id === taskId
      ? { ...t, subtasks: t.subtasks?.map(s => s.id === subtask.id ? { ...s, completed: !s.completed } : s) }
      : t
    ))
  }

  async function addSubtask(taskId: string) {
    const title = subtaskInputs[taskId]?.trim()
    if (!title) return
    const { data } = await supabase.from('subtasks').insert({ task_id: taskId, title }).select().single()
    if (data) {
      setTasks(prev => prev.map(t => t.id === taskId
        ? { ...t, subtasks: [...(t.subtasks ?? []), data] }
        : t
      ))
    }
    setSubtaskInputs(prev => ({ ...prev, [taskId]: '' }))
    setAddingSubtask(null)
  }

  async function deleteSubtask(taskId: string, subtaskId: string) {
    await supabase.from('subtasks').delete().eq('id', subtaskId)
    setTasks(prev => prev.map(t => t.id === taskId
      ? { ...t, subtasks: t.subtasks?.filter(s => s.id !== subtaskId) }
      : t
    ))
  }

  if (loading) return (
    <div className="flex items-center justify-center h-full py-20">
      <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(56,189,248,0.2)', borderTopColor: '#38bdf8' }} />
    </div>
  )

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white">My Tasks</h2>
        <p className="text-sm mt-1" style={{ color: 'rgba(56,189,248,0.4)' }}>Personal task list — only visible to you</p>
      </div>

      {/* Add task */}
      <div className="mb-6">
        {adding ? (
          <div className="flex gap-3 items-center rounded-2xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(56,189,248,0.2)' }}>
            <input
              autoFocus
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') createTask(); if (e.key === 'Escape') setAdding(false) }}
              placeholder="Task title..."
              className="flex-1 bg-transparent outline-none text-sm text-white placeholder-sky-700"
            />
            <button onClick={createTask} disabled={creating} className="text-xs px-4 py-1.5 rounded-lg text-white font-medium" style={{ background: 'linear-gradient(135deg, #0891b2, #0ea5e9)' }}>
              {creating ? '...' : 'Add'}
            </button>
            <button onClick={() => setAdding(false)} className="text-xs" style={{ color: 'rgba(56,189,248,0.4)' }}>Cancel</button>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-2 text-sm font-medium transition-all duration-150 px-4 py-2 rounded-xl"
            style={{ color: 'rgba(56,189,248,0.5)', border: '1px dashed rgba(56,189,248,0.2)' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#38bdf8'; e.currentTarget.style.borderColor = 'rgba(56,189,248,0.5)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(56,189,248,0.5)'; e.currentTarget.style.borderColor = 'rgba(56,189,248,0.2)' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 5v14M5 12h14"/></svg>
            Add Task
          </button>
        )}
      </div>

      {/* Task list */}
      {tasks.length === 0 ? (
        <div className="rounded-2xl px-6 py-16 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(56,189,248,0.1)' }}>
          <p className="text-sky-600 text-sm">No personal tasks yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map(task => {
            const s = STATUS_STYLES[task.status]
            const isExpanded = expanded === task.id
            const done = task.subtasks?.filter(s => s.completed).length ?? 0
            const total = task.subtasks?.length ?? 0

            return (
              <div key={task.id} className="rounded-2xl overflow-hidden transition-all" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                <div className="px-4 py-3 flex items-center gap-3">
                  {/* Status */}
                  <button onClick={() => cycleStatus(task)} className="w-4 h-4 rounded shrink-0 flex items-center justify-center transition-all" style={{ border: `1.5px solid ${s.color}`, background: s.bg }}>
                    {task.status === 'done' && <svg className="w-2.5 h-2.5" style={{ color: s.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M5 13l4 4L19 7"/></svg>}
                    {task.status === 'in_progress' && <div className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />}
                  </button>

                  {/* Title */}
                  <span
                    className="flex-1 text-sm font-medium cursor-pointer"
                    style={{ color: task.status === 'done' ? 'rgba(186,230,253,0.35)' : 'rgba(186,230,253,0.9)', textDecoration: task.status === 'done' ? 'line-through' : 'none' }}
                    onClick={() => setExpanded(isExpanded ? null : task.id)}
                  >
                    {task.title}
                  </span>

                  {/* Subtask progress */}
                  {total > 0 && (
                    <span className="text-xs" style={{ color: 'rgba(56,189,248,0.4)' }}>{done}/{total}</span>
                  )}

                  {/* Expand */}
                  <button onClick={() => setExpanded(isExpanded ? null : task.id)} style={{ color: 'rgba(56,189,248,0.3)' }}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path d={isExpanded ? 'M18 15l-6-6-6 6' : 'M6 9l6 6 6-6'} />
                    </svg>
                  </button>

                  {/* Delete */}
                  <button onClick={() => deleteTask(task.id)} className="transition-opacity opacity-30 hover:opacity-100" style={{ color: '#f87171' }}>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                </div>

                {/* Expanded subtasks */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-2" style={{ borderTop: `1px solid ${s.border}` }}>
                    <div className="pt-3 space-y-1.5">
                      {(task.subtasks ?? []).map(sub => (
                        <div key={sub.id} className="flex items-center gap-2 group">
                          <button
                            onClick={() => toggleSubtask(task.id, sub)}
                            className="w-4 h-4 rounded flex items-center justify-center shrink-0 transition-all"
                            style={{ background: sub.completed ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.05)', border: sub.completed ? '1px solid rgba(16,185,129,0.5)' : '1px solid rgba(56,189,248,0.2)' }}
                          >
                            {sub.completed && <svg className="w-2.5 h-2.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M5 13l4 4L19 7"/></svg>}
                          </button>
                          <span className="flex-1 text-xs" style={{ color: sub.completed ? 'rgba(56,189,248,0.3)' : 'rgba(186,230,253,0.7)', textDecoration: sub.completed ? 'line-through' : 'none' }}>
                            {sub.title}
                          </span>
                          <button onClick={() => deleteSubtask(task.id, sub.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg className="w-3 h-3" style={{ color: 'rgba(239,68,68,0.5)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M18 6L6 18M6 6l12 12"/></svg>
                          </button>
                        </div>
                      ))}
                    </div>

                    {addingSubtask === task.id ? (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-4 h-4 shrink-0" />
                        <input
                          autoFocus
                          value={subtaskInputs[task.id] ?? ''}
                          onChange={e => setSubtaskInputs(prev => ({ ...prev, [task.id]: e.target.value }))}
                          onKeyDown={e => { if (e.key === 'Enter') addSubtask(task.id); if (e.key === 'Escape') setAddingSubtask(null) }}
                          onBlur={() => addSubtask(task.id)}
                          placeholder="Subtask title..."
                          className="flex-1 text-xs bg-transparent outline-none border-b text-sky-200 placeholder-sky-700"
                          style={{ borderColor: 'rgba(56,189,248,0.3)' }}
                        />
                      </div>
                    ) : (
                      <button
                        onClick={() => setAddingSubtask(task.id)}
                        className="text-xs ml-6 mt-1 transition-colors"
                        style={{ color: 'rgba(56,189,248,0.35)' }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'rgba(56,189,248,0.7)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(56,189,248,0.35)')}
                      >
                        + subtask
                      </button>
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