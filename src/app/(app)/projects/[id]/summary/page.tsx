'use client'

import { use, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

function getWeekNumber(d: Date) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

type Task = {
  id: string
  title: string
  status: string
  type: string
  assignee?: { name: string } | { name: string }[] | null
}

export default function SummaryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const now = new Date()
  const [week, setWeek] = useState(getWeekNumber(now))
  const [year, setYear] = useState(now.getFullYear())
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [projectName, setProjectName] = useState('')

  useEffect(() => {
    supabase.from('projects').select('name').eq('id', id).single()
      .then(({ data }) => setProjectName(data?.name ?? ''))
  }, [id])

  useEffect(() => {
    setLoading(true)
    supabase
      .from('tasks')
      .select('id, title, status, type, assignee:assigned_to(name)')
      .eq('project_id', id)
      .eq('week_number', week)
      .eq('year', year)
      .then(({ data }) => {
        setTasks((data ?? []) as Task[])
        setLoading(false)
      })
  }, [id, week, year])

  function prevWeek() {
    if (week === 1) { setWeek(52); setYear(y => y - 1) }
    else setWeek(w => w - 1)
  }
  function nextWeek() {
    if (week === 52) { setWeek(1); setYear(y => y + 1) }
    else setWeek(w => w + 1)
  }

  const done = tasks.filter(t => t.status === 'done')
  const inProgress = tasks.filter(t => t.status === 'in_progress')
  const todo = tasks.filter(t => t.status === 'todo')

  function getAssigneeName(task: Task): string {
    if (!task.assignee) return ''
    if (Array.isArray(task.assignee)) return task.assignee[0]?.name ?? ''
    return task.assignee.name ?? ''
  }

  function buildCopyText() {
    const lines: string[] = []
    lines.push(`${projectName} — Week ${week}, ${year}`)
    lines.push('')

    if (done.length > 0) {
      lines.push('Completed')
      done.forEach(t => {
        const name = getAssigneeName(t)
        lines.push(`  - ${t.title}${name ? ` (${name})` : ''}`)
      })
      lines.push('')
    }

    if (inProgress.length > 0) {
      lines.push('In Progress')
      inProgress.forEach(t => {
        const name = getAssigneeName(t)
        lines.push(`  - ${t.title}${name ? ` (${name})` : ''}`)
      })
      lines.push('')
    }

    if (todo.length > 0) {
      lines.push('Not Started')
      todo.forEach(t => {
        const name = getAssigneeName(t)
        lines.push(`  - ${t.title}${name ? ` (${name})` : ''}`)
      })
    }

    return lines.join('\n')
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(buildCopyText())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const sectionStyle = {
    done:        { label: 'Completed',    color: '#34d399', bg: 'rgba(16,185,129,0.06)',  border: 'rgba(16,185,129,0.15)' },
    in_progress: { label: 'In Progress',  color: '#fbbf24', bg: 'rgba(251,191,36,0.06)',  border: 'rgba(251,191,36,0.15)' },
    todo:        { label: 'Not Started',  color: '#38bdf8', bg: 'rgba(56,189,248,0.06)',  border: 'rgba(56,189,248,0.15)' },
  }

  return (
    <div className="p-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-widest" style={{ color: 'rgba(56,189,248,0.5)' }}>Weekly Summary</h3>
          <p className="text-xs mt-1" style={{ color: 'rgba(56,189,248,0.3)' }}>Week {week}, {year}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevWeek} className="p-1.5 rounded-lg transition-all" style={{ color: 'rgba(56,189,248,0.5)', border: '1px solid rgba(56,189,248,0.15)' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M15 19l-7-7 7-7"/></svg>
          </button>
          <button
            onClick={() => { setWeek(getWeekNumber(now)); setYear(now.getFullYear()) }}
            className="text-xs px-3 py-1.5 rounded-lg"
            style={{ color: 'rgba(56,189,248,0.5)', border: '1px solid rgba(56,189,248,0.15)' }}
          >
            This Week
          </button>
          <button onClick={nextWeek} className="p-1.5 rounded-lg transition-all" style={{ color: 'rgba(56,189,248,0.5)', border: '1px solid rgba(56,189,248,0.15)' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 5l7 7-7 7"/></svg>
          </button>
          <button
            onClick={handleCopy}
            className="ml-2 px-4 py-1.5 rounded-xl text-xs font-semibold text-white transition-all"
            style={{ background: copied ? 'rgba(16,185,129,0.4)' : 'linear-gradient(135deg, #0891b2, #0ea5e9)', boxShadow: '0 4px 16px rgba(6,182,212,0.25)' }}
          >
            {copied ? 'Copied!' : 'Copy Summary'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(56,189,248,0.2)', borderTopColor: '#38bdf8' }} />
        </div>
      ) : tasks.length === 0 ? (
        <div className="rounded-2xl px-6 py-16 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(56,189,248,0.1)' }}>
          <p className="text-sky-600 text-sm">No tasks found for this week.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'Total',       value: tasks.length,      color: '#7dd3fc' },
              { label: 'Completed',   value: done.length,       color: '#34d399' },
              { label: 'In Progress', value: inProgress.length, color: '#fbbf24' },
            ].map(s => (
              <div key={s.label} className="rounded-2xl px-4 py-4 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(56,189,248,0.08)' }}>
                <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-xs mt-1 uppercase tracking-widest" style={{ color: 'rgba(56,189,248,0.4)' }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Sections */}
          {(['done', 'in_progress', 'todo'] as const).map(status => {
            const group = tasks.filter(t => t.status === status)
            if (group.length === 0) return null
            const style = sectionStyle[status]
            return (
              <div key={status} className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${style.border}` }}>
                <div className="px-5 py-3 flex items-center gap-2" style={{ background: style.bg, borderBottom: `1px solid ${style.border}` }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: style.color }} />
                  <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: style.color }}>{style.label}</span>
                  <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background: style.bg, color: style.color, border: `1px solid ${style.border}` }}>{group.length}</span>
                </div>
                <div className="divide-y" style={{ borderColor: 'rgba(56,189,248,0.05)' }}>
                  {group.map(t => {
                    const name = getAssigneeName(t)
                    return (
                      <div key={t.id} className="px-5 py-3 flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.01)' }}>
                        <span className="text-sm" style={{ color: status === 'done' ? 'rgba(186,230,253,0.45)' : 'rgba(186,230,253,0.8)', textDecoration: status === 'done' ? 'line-through' : 'none' }}>
                          {t.title}
                        </span>
                        {name && (
                          <span className="text-xs ml-4 shrink-0" style={{ color: 'rgba(56,189,248,0.4)' }}>{name}</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* Copyable preview */}
          <div className="mt-6 rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(56,189,248,0.1)' }}>
            <div className="px-5 py-3 flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(56,189,248,0.08)' }}>
              <span className="text-xs uppercase tracking-widest font-semibold" style={{ color: 'rgba(56,189,248,0.4)' }}>Plain text preview</span>
            </div>
            <pre className="px-5 py-4 text-xs whitespace-pre-wrap" style={{ color: 'rgba(148,210,245,0.5)', fontFamily: 'monospace' }}>
              {buildCopyText()}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}