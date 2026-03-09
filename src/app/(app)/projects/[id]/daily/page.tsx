'use client'

import { use } from 'react'
import TaskBoard from '@/components/tasks/TaskBoard'

export default function DailyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return (
    <div>
      <div className="px-8 pt-6 pb-0">
        <h3 className="text-sm font-semibold uppercase tracking-widest" style={{ color: 'rgba(56,189,248,0.5)' }}>Daily Tasks</h3>
        <p className="text-xs mt-1" style={{ color: 'rgba(56,189,248,0.3)' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>
      <TaskBoard projectId={id} type="daily" />
    </div>
  )
}