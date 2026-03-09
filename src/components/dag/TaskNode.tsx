import { memo } from 'react'
import { Handle, Position } from 'reactflow'

const STATUS_STYLES = {
  todo:        { border: 'rgba(56,189,248,0.3)',  bg: 'rgba(56,189,248,0.06)',  dot: '#38bdf8' },
  in_progress: { border: 'rgba(251,191,36,0.4)',  bg: 'rgba(251,191,36,0.07)',  dot: '#fbbf24' },
  done:        { border: 'rgba(16,185,129,0.4)',  bg: 'rgba(16,185,129,0.07)',  dot: '#34d399' },
}

type Props = {
  data: {
    label: string
    status: 'todo' | 'in_progress' | 'done'
    assignee?: { name: string; avatar_color: string } | null
    onDelete: (id: string) => void
    onStatusCycle: (id: string) => void
  }
  id: string
  selected: boolean
}

function TaskNode({ data, id, selected }: Props) {
  const s = STATUS_STYLES[data.status] ?? STATUS_STYLES.todo
  const initials = data.assignee?.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div
      style={{
        background: s.bg,
        border: `1.5px solid ${selected ? '#38bdf8' : s.border}`,
        borderRadius: '14px',
        padding: '12px 14px',
        minWidth: '180px',
        maxWidth: '220px',
        boxShadow: selected ? '0 0 0 3px rgba(56,189,248,0.2)' : '0 4px 20px rgba(0,0,0,0.3)',
        cursor: 'grab',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: '#38bdf8', border: 'none', width: 8, height: 8 }} />

      <div className="flex items-start gap-2">
        {/* Status dot — click to cycle */}
        <button
          onClick={() => data.onStatusCycle(id)}
          className="mt-0.5 w-3 h-3 rounded-full shrink-0 transition-all"
          style={{ background: s.dot, boxShadow: `0 0 6px ${s.dot}80` }}
          title="Click to cycle status"
        />

        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold leading-tight" style={{ color: 'rgba(186,230,253,0.9)', wordBreak: 'break-word' }}>
            {data.label}
          </p>
          <p className="text-xs mt-1 capitalize" style={{ color: s.dot, opacity: 0.8 }}>
            {data.status.replace('_', ' ')}
          </p>
        </div>

        <button
          onClick={() => data.onDelete(id)}
          className="shrink-0 mt-0.5 transition-opacity opacity-30 hover:opacity-100"
          style={{ color: '#f87171' }}
          title="Delete task"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      {data.assignee && (
        <div className="flex items-center gap-1.5 mt-2.5">
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-white shrink-0"
            style={{ background: data.assignee.avatar_color, fontSize: '9px', fontWeight: 700 }}
          >
            {initials}
          </div>
          <span className="text-xs truncate" style={{ color: 'rgba(148,210,245,0.5)' }}>{data.assignee.name}</span>
        </div>
      )}

      <Handle type="source" position={Position.Bottom} style={{ background: '#38bdf8', border: 'none', width: 8, height: 8 }} />
    </div>
  )
}

export default memo(TaskNode)