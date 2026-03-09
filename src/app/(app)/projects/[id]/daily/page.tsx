'use client'

import { use } from 'react'
import TaskBoard from '@/components/tasks/TaskBoard'

export default function DailyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return (
    <div>
      <div style={{ padding: '28px 40px 0' }}>
        <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-muted)', marginBottom: 4 }}>Daily Tasks</p>
        <p style={{ fontSize: 13, color: 'rgba(56,189,248,0.3)' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>
      <TaskBoard projectId={id} type="daily" />
    </div>
  )
}