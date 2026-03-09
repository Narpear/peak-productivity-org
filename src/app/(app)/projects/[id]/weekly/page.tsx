'use client'

import { use, useState } from 'react'
import TaskBoard from '@/components/tasks/TaskBoard'

function getWeekNumber(d: Date) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

export default function WeeklyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const now = new Date()
  const [week, setWeek] = useState(getWeekNumber(now))
  const [year, setYear] = useState(now.getFullYear())

  function prevWeek() { if (week === 1) { setWeek(52); setYear(y => y - 1) } else setWeek(w => w - 1) }
  function nextWeek() { if (week === 52) { setWeek(1); setYear(y => y + 1) } else setWeek(w => w + 1) }

  const btnStyle: React.CSSProperties = { padding: '6px 10px', background: 'transparent', border: '1px solid rgba(56,189,248,0.15)', borderRadius: 8, color: 'rgba(56,189,248,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }

  return (
    <div>
      <div style={{ padding: '28px 40px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-muted)', marginBottom: 4 }}>Weekly Tasks</p>
          <p style={{ fontSize: 13, color: 'rgba(56,189,248,0.3)' }}>Week {week}, {year}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={prevWeek} style={btnStyle}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M15 19l-7-7 7-7"/></svg>
          </button>
          <button onClick={() => { setWeek(getWeekNumber(now)); setYear(now.getFullYear()) }} style={{ ...btnStyle, padding: '6px 14px', fontSize: 12, fontFamily: 'var(--font-outfit), sans-serif' }}>
            This Week
          </button>
          <button onClick={nextWeek} style={btnStyle}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>
      <TaskBoard projectId={id} type="weekly" weekNumber={week} year={year} />
    </div>
  )
}