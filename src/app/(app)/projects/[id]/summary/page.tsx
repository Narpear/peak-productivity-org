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

type Task = { id: string; title: string; status: string; type: string; assignee?: { name: string } | { name: string }[] | null }

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
    supabase.from('projects').select('name').eq('id', id).single().then(({ data }) => setProjectName(data?.name ?? ''))
  }, [id])

  useEffect(() => {
    setLoading(true)
    supabase.from('tasks').select('id, title, status, type, assignee:assigned_to(name)').eq('project_id', id).eq('week_number', week).eq('year', year)
      .then(({ data }) => { setTasks((data ?? []) as Task[]); setLoading(false) })
  }, [id, week, year])

  function prevWeek() { if (week === 1) { setWeek(52); setYear(y => y - 1) } else setWeek(w => w - 1) }
  function nextWeek() { if (week === 52) { setWeek(1); setYear(y => y + 1) } else setWeek(w => w + 1) }

  const done = tasks.filter(t => t.status === 'done')
  const inProgress = tasks.filter(t => t.status === 'in_progress')
  const todo = tasks.filter(t => t.status === 'todo')

  function getName(task: Task) {
    if (!task.assignee) return ''
    if (Array.isArray(task.assignee)) return task.assignee[0]?.name ?? ''
    return task.assignee.name ?? ''
  }

  function buildText() {
    const lines: string[] = [`${projectName} — Week ${week}, ${year}`, '']
    if (done.length) { lines.push('Completed'); done.forEach(t => lines.push(`  - ${t.title}${getName(t) ? ` (${getName(t)})` : ''}`)); lines.push('') }
    if (inProgress.length) { lines.push('In Progress'); inProgress.forEach(t => lines.push(`  - ${t.title}${getName(t) ? ` (${getName(t)})` : ''}`)); lines.push('') }
    if (todo.length) { lines.push('Not Started'); todo.forEach(t => lines.push(`  - ${t.title}${getName(t) ? ` (${getName(t)})` : ''}`)) }
    return lines.join('\n')
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(buildText())
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const sections = [
    { key: 'done',        label: 'Completed',   color: '#34d399', bg: 'rgba(16,185,129,0.06)',  border: 'rgba(16,185,129,0.15)', tasks: done },
    { key: 'in_progress', label: 'In Progress', color: '#fbbf24', bg: 'rgba(251,191,36,0.06)',  border: 'rgba(251,191,36,0.15)', tasks: inProgress },
    { key: 'todo',        label: 'Not Started', color: '#38bdf8', bg: 'rgba(56,189,248,0.06)',  border: 'rgba(56,189,248,0.15)', tasks: todo },
  ]

  const btnStyle: React.CSSProperties = { padding: '6px 10px', background: 'transparent', border: '1px solid rgba(56,189,248,0.15)', borderRadius: 8, color: 'rgba(56,189,248,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }

  return (
    <div style={{ padding: 40, maxWidth: 740 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-muted)', marginBottom: 4 }}>Weekly Summary</p>
          <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>Week {week}, {year}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={prevWeek} style={btnStyle}><svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M15 19l-7-7 7-7"/></svg></button>
          <button onClick={() => { setWeek(getWeekNumber(now)); setYear(now.getFullYear()) }} style={{ ...btnStyle, padding: '6px 14px', fontSize: 12, fontFamily: 'var(--font-outfit), sans-serif' }}>This Week</button>
          <button onClick={nextWeek} style={btnStyle}><svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 5l7 7-7 7"/></svg></button>
          <button onClick={handleCopy} style={{ padding: '8px 18px', background: copied ? 'rgba(16,185,129,0.3)' : 'linear-gradient(135deg, #0891b2, #0ea5e9)', border: 'none', borderRadius: 10, color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-outfit), sans-serif', marginLeft: 8, transition: 'all 0.2s' }}>
            {copied ? 'Copied!' : 'Copy Summary'}
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}><div style={{ width: 18, height: 18, border: '2px solid rgba(56,189,248,0.15)', borderTopColor: '#22d3ee', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /></div>
      ) : tasks.length === 0 ? (
        <div style={{ border: '1px dashed rgba(56,189,248,0.1)', borderRadius: 16, padding: '60px 24px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No tasks for this week.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 8 }}>
            {[
              { label: 'Total',       value: tasks.length,      color: '#7dd3fc' },
              { label: 'Completed',   value: done.length,       color: '#34d399' },
              { label: 'In Progress', value: inProgress.length, color: '#fbbf24' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: '16px 20px', textAlign: 'center' }}>
                <p style={{ fontSize: 26, fontWeight: 700, color: s.color }}>{s.value}</p>
                <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</p>
              </div>
            ))}
          </div>

          {sections.map(s => s.tasks.length === 0 ? null : (
            <div key={s.key} style={{ border: `1px solid ${s.border}`, borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: s.bg, borderBottom: `1px solid ${s.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: s.color }} />
                  <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: s.color }}>{s.label}</span>
                </div>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>{s.tasks.length}</span>
              </div>
              {s.tasks.map((t, i) => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.01)', borderTop: i > 0 ? '1px solid rgba(56,189,248,0.05)' : 'none' }}>
                  <span style={{ fontSize: 13, color: s.key === 'done' ? 'rgba(186,230,253,0.4)' : 'var(--text-primary)', textDecoration: s.key === 'done' ? 'line-through' : 'none' }}>{t.title}</span>
                  {getName(t) && <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0, marginLeft: 12 }}>{getName(t)}</span>}
                </div>
              ))}
            </div>
          ))}

          {/* Plain text preview */}
          <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '10px 16px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)' }}>Plain text preview</span>
            </div>
            <pre style={{ padding: '16px', fontSize: 12, color: 'rgba(148,210,245,0.45)', fontFamily: 'monospace', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{buildText()}</pre>
          </div>
        </div>
      )}
    </div>
  )
}