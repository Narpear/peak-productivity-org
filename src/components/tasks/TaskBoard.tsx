'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'

type Subtask = {
  id: string
  title: string
  completed: boolean
  position: number
}

type Task = {
  id: string
  title: string
  description: string | null
  status: 'todo' | 'in_progress' | 'done'
  type: 'daily' | 'weekly'
  assigned_to: string | null
  assigned_by: string | null
  due_date: string | null
  position: number
  subtasks?: Subtask[]
  assignee?: { name: string; avatar_color: string } | null
}

type Member = {
  id: string
  name: string
  avatar_color: string
  role: string
}

const STATUS_COLS: { key: Task['status']; label: string }[] = [
  { key: 'todo',        label: 'To Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'done',        label: 'Done' },
]

const STATUS_STYLES: Record<Task['status'], { bg: string; border: string; color: string }> = {
  todo:        { bg: 'rgba(56,189,248,0.06)',   border: 'rgba(56,189,248,0.15)',  color: '#7dd3fc' },
  in_progress: { bg: 'rgba(251,191,36,0.06)',   border: 'rgba(251,191,36,0.2)',   color: '#fbbf24' },
  done:        { bg: 'rgba(16,185,129,0.06)',   border: 'rgba(16,185,129,0.2)',   color: '#34d399' },
}

function Avatar({ name, color, size = 6 }: { name: string; color: string; size?: number }) {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  return (
    <div
      className={`w-${size} h-${size} rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0`}
      style={{ background: color, fontSize: size <= 6 ? '10px' : '12px' }}
    >
      {initials}
    </div>
  )
}

function SubtaskList({ taskId }: { taskId: string }) {
  const [subtasks, setSubtasks] = useState<Subtask[]>([])
  const [adding, setAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')

  useEffect(() => {
    supabase.from('subtasks').select('*').eq('task_id', taskId).order('position')
      .then(({ data }) => setSubtasks(data ?? []))
  }, [taskId])

  async function toggle(s: Subtask) {
    await supabase.from('subtasks').update({ completed: !s.completed }).eq('id', s.id)
    setSubtasks(prev => prev.map(x => x.id === s.id ? { ...x, completed: !x.completed } : x))
  }

  async function addSubtask() {
    if (!newTitle.trim()) return
    const { data } = await supabase.from('subtasks')
      .insert({ task_id: taskId, title: newTitle.trim(), position: subtasks.length })
      .select().single()
    if (data) setSubtasks(prev => [...prev, data])
    setNewTitle('')
    setAdding(false)
  }

  async function deleteSubtask(id: string) {
    await supabase.from('subtasks').delete().eq('id', id)
    setSubtasks(prev => prev.filter(s => s.id !== id))
  }

  return (
    <div className="mt-3 space-y-1.5">
      {subtasks.map(s => (
        <div key={s.id} className="flex items-center gap-2 group">
          <button onClick={() => toggle(s)} className="w-4 h-4 rounded flex items-center justify-center shrink-0 transition-all" style={{ background: s.completed ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.05)', border: s.completed ? '1px solid rgba(16,185,129,0.5)' : '1px solid rgba(56,189,248,0.2)' }}>
            {s.completed && <svg className="w-2.5 h-2.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M5 13l4 4L19 7"/></svg>}
          </button>
          <span className="text-xs flex-1" style={{ color: s.completed ? 'rgba(56,189,248,0.3)' : 'rgba(186,230,253,0.7)', textDecoration: s.completed ? 'line-through' : 'none' }}>{s.title}</span>
          <button onClick={() => deleteSubtask(s.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
            <svg className="w-3 h-3" style={{ color: 'rgba(239,68,68,0.5)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
      ))}
      {adding ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 shrink-0" />
          <input
            autoFocus
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addSubtask(); if (e.key === 'Escape') setAdding(false) }}
            onBlur={addSubtask}
            placeholder="Subtask title..."
            className="flex-1 text-xs bg-transparent outline-none border-b text-sky-200 placeholder-sky-700"
            style={{ borderColor: 'rgba(56,189,248,0.3)' }}
          />
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="text-xs ml-6 transition-colors" style={{ color: 'rgba(56,189,248,0.35)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(56,189,248,0.7)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(56,189,248,0.35)')}
        >
          + subtask
        </button>
      )}
    </div>
  )
}

function TaskCard({
  task,
  members,
  onStatusChange,
  onDelete,
  onUpdate,
}: {
  task: Task
  members: Member[]
  onStatusChange: (id: string, status: Task['status']) => void
  onDelete: (id: string) => void
  onUpdate: (id: string, fields: Partial<Task>) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [editDesc, setEditDesc] = useState(task.description ?? '')
  const { user } = useAuthStore()

  const style = STATUS_STYLES[task.status]

  async function saveEdit() {
    const updates = { title: editTitle.trim(), description: editDesc.trim() || null }
    await supabase.from('tasks').update(updates).eq('id', task.id)
    onUpdate(task.id, updates)
    setEditing(false)
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

  return (
    <div className="rounded-xl overflow-hidden transition-all duration-150" style={{ background: style.bg, border: `1px solid ${style.border}` }}>
      <div className="px-4 pt-3 pb-3">
        <div className="flex items-start gap-2">
          {/* Status toggle */}
          <button onClick={cycleStatus} className="mt-0.5 w-4 h-4 rounded shrink-0 transition-all flex items-center justify-center" style={{ background: style.bg, border: `1.5px solid ${style.color}` }}>
            {task.status === 'done' && <svg className="w-2.5 h-2.5" style={{ color: style.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M5 13l4 4L19 7"/></svg>}
            {task.status === 'in_progress' && <div className="w-1.5 h-1.5 rounded-full" style={{ background: style.color }} />}
          </button>

          {/* Title */}
          <div className="flex-1 min-w-0">
            {editing ? (
              <input
                autoFocus
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditing(false) }}
                className="w-full text-sm font-medium bg-transparent outline-none border-b text-white"
                style={{ borderColor: 'rgba(56,189,248,0.4)' }}
              />
            ) : (
              <p
                className="text-sm font-medium cursor-pointer"
                style={{ color: task.status === 'done' ? 'rgba(186,230,253,0.35)' : 'rgba(186,230,253,0.9)', textDecoration: task.status === 'done' ? 'line-through' : 'none' }}
                onClick={() => setExpanded(e => !e)}
              >
                {task.title}
              </p>
            )}
          </div>

          {/* Assignee avatar */}
          {task.assignee && <Avatar name={task.assignee.name} color={task.assignee.avatar_color} />}

          {/* Expand / actions */}
          <button onClick={() => setExpanded(e => !e)} className="shrink-0 transition-colors" style={{ color: 'rgba(56,189,248,0.3)' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path d={expanded ? 'M18 15l-6-6-6 6' : 'M6 9l6 6 6-6'} />
            </svg>
          </button>
        </div>

        {/* Expanded */}
        {expanded && (
          <div className="mt-3 space-y-3">
            {editing ? (
              <div className="space-y-2">
                <textarea
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  placeholder="Description..."
                  rows={2}
                  className="w-full text-xs bg-transparent outline-none border rounded-lg px-3 py-2 text-sky-200 placeholder-sky-700 resize-none"
                  style={{ borderColor: 'rgba(56,189,248,0.2)' }}
                />
                <div className="flex gap-2">
                  <button onClick={saveEdit} className="text-xs px-3 py-1 rounded-lg text-white" style={{ background: 'rgba(14,165,233,0.3)' }}>Save</button>
                  <button onClick={() => setEditing(false)} className="text-xs px-3 py-1 rounded-lg" style={{ color: 'rgba(56,189,248,0.5)' }}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
                {task.description && <p className="text-xs" style={{ color: 'rgba(148,210,245,0.5)' }}>{task.description}</p>}
              </>
            )}

            {/* Assign */}
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: 'rgba(56,189,248,0.4)' }}>Assign:</span>
              <select
                value={task.assigned_to ?? ''}
                onChange={e => reassign(e.target.value)}
                className="text-xs rounded-lg px-2 py-1 outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(56,189,248,0.15)', color: '#7dd3fc' }}
              >
                <option value="">Unassigned</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>

            <SubtaskList taskId={task.id} />

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button onClick={() => setEditing(true)} className="text-xs transition-colors" style={{ color: 'rgba(56,189,248,0.4)' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#38bdf8')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(56,189,248,0.4)')}
              >Edit</button>
              <button onClick={() => onDelete(task.id)} className="text-xs transition-colors" style={{ color: 'rgba(239,68,68,0.4)' }}
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

export default function TaskBoard({
  projectId,
  type,
  weekNumber,
  year,
}: {
  projectId: string
  type: 'daily' | 'weekly'
  weekNumber?: number
  year?: number
}) {
  const { user } = useAuthStore()
  const [tasks, setTasks] = useState<Task[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [newTitle, setNewTitle] = useState('')
  const [newAssignee, setNewAssignee] = useState('')
  const [adding, setAdding] = useState(false)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!projectId) return
    async function load() {
      // Load members
      const { data: memberRows } = await supabase
        .from('project_members')
        .select('user_id, users(id, name, avatar_color, role)')
        .eq('project_id', projectId)
      const mems = (memberRows ?? []).map((r: any) => r.users).filter(Boolean)
      setMembers(mems)

      // Load tasks
      let query = supabase
        .from('tasks')
        .select('*, assignee:assigned_to(name, avatar_color)')
        .eq('project_id', projectId)
        .eq('type', type)
        .order('position')

      if (type === 'weekly' && weekNumber && year) {
        query = query.eq('week_number', weekNumber).eq('year', year)
      }

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
    const wn = weekNumber ?? getWeekNumber(now)
    const yr = year ?? now.getFullYear()

    const { data } = await supabase.from('tasks').insert({
      title: newTitle.trim(),
      type,
      status: 'todo',
      project_id: projectId,
      assigned_to: newAssignee || null,
      assigned_by: user!.id,
      week_number: wn,
      year: yr,
      position: tasks.length,
    }).select('*, assignee:assigned_to(name, avatar_color)').single()

    if (data) setTasks(prev => [...prev, data as Task])
    setNewTitle('')
    setNewAssignee('')
    setAdding(false)
    setCreating(false)
  }

  function onStatusChange(id: string, status: Task['status']) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t))
  }

  async function onDelete(id: string) {
    await supabase.from('tasks').delete().eq('id', id)
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  function onUpdate(id: string, fields: Partial<Task>) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...fields } : t))
  }

  const cols = STATUS_COLS.map(col => ({
    ...col,
    tasks: tasks.filter(t => t.status === col.key),
  }))

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(56,189,248,0.2)', borderTopColor: '#38bdf8' }} />
    </div>
  )

  return (
    <div className="p-8">
      {/* Add task bar */}
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
            <select
              value={newAssignee}
              onChange={e => setNewAssignee(e.target.value)}
              className="text-xs rounded-lg px-2 py-1.5 outline-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(56,189,248,0.15)', color: '#7dd3fc' }}
            >
              <option value="">Assign to...</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
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

      {/* Kanban columns */}
      <div className="grid grid-cols-3 gap-4">
        {cols.map(col => {
          const s = STATUS_STYLES[col.key]
          return (
            <div key={col.key} className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(56,189,248,0.06)' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                  <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: s.color }}>{col.label}</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>{col.tasks.length}</span>
              </div>
              <div className="space-y-2">
                {col.tasks.map(t => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    members={members}
                    onStatusChange={onStatusChange}
                    onDelete={onDelete}
                    onUpdate={onUpdate}
                  />
                ))}
                {col.tasks.length === 0 && (
                  <p className="text-xs text-center py-6" style={{ color: 'rgba(56,189,248,0.2)' }}>Empty</p>
                )}
              </div>
            </div>
          )
        })}
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