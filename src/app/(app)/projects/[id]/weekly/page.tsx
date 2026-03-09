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

  function prevWeek() {
    if (week === 1) { setWeek(52); setYear(y => y - 1) }
    else setWeek(w => w - 1)
  }
  function nextWeek() {
    if (week === 52) { setWeek(1); setYear(y => y + 1) }
    else setWeek(w => w + 1)
  }

  return (
    <div>
      <div className="px-8 pt-6 pb-0 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-widest" style={{ color: 'rgba(56,189,248,0.5)' }}>Weekly Tasks</h3>
          <p className="text-xs mt-1" style={{ color: 'rgba(56,189,248,0.3)' }}>Week {week}, {year}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevWeek} className="p-1.5 rounded-lg transition-all" style={{ color: 'rgba(56,189,248,0.5)', border: '1px solid rgba(56,189,248,0.15)' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M15 19l-7-7 7-7"/></svg>
          </button>
          <button
            onClick={() => { setWeek(getWeekNumber(now)); setYear(now.getFullYear()) }}
            className="text-xs px-3 py-1.5 rounded-lg transition-all"
            style={{ color: 'rgba(56,189,248,0.5)', border: '1px solid rgba(56,189,248,0.15)' }}
          >
            This Week
          </button>
          <button onClick={nextWeek} className="p-1.5 rounded-lg transition-all" style={{ color: 'rgba(56,189,248,0.5)', border: '1px solid rgba(56,189,248,0.15)' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>
      <TaskBoard projectId={id} type="weekly" weekNumber={week} year={year} />
    </div>
  )
}