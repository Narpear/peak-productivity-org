import { memo } from 'react'
import { Handle, Position } from 'reactflow'

const STATUS_STYLES = {
  todo:        { border: 'rgba(56,189,248,0.3)',  bg: 'rgba(7,15,26,0.95)',   dot: '#38bdf8' },
  in_progress: { border: 'rgba(251,191,36,0.4)',  bg: 'rgba(7,15,26,0.95)',   dot: '#fbbf24' },
  done:        { border: 'rgba(16,185,129,0.4)',  bg: 'rgba(7,15,26,0.95)',   dot: '#34d399' },
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
    <div style={{
      background: s.bg,
      border: `1.5px solid ${selected ? '#22d3ee' : s.border}`,
      borderRadius: 14,
      padding: '12px 14px',
      minWidth: 180,
      maxWidth: 220,
      boxShadow: selected ? '0 0 0 3px rgba(34,211,238,0.15), 0 8px 32px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.4)',
      cursor: 'grab',
      fontFamily: 'var(--font-outfit), sans-serif',
    }}>
      <Handle type="target" position={Position.Top} style={{ background: '#22d3ee', border: 'none', width: 8, height: 8, top: -4 }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <button
          onClick={() => data.onStatusCycle(id)}
          title="Click to cycle status"
          style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, marginTop: 3, background: s.dot, boxShadow: `0 0 8px ${s.dot}80`, border: 'none', cursor: 'pointer', transition: 'all 0.15s' }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(186,230,253,0.9)', wordBreak: 'break-word', lineHeight: 1.4 }}>
            {data.label}
          </p>
          <p style={{ fontSize: 11, marginTop: 3, color: s.dot, opacity: 0.8, textTransform: 'capitalize' }}>
            {data.status.replace('_', ' ')}
          </p>
        </div>
        <button
          onClick={() => data.onDelete(id)}
          title="Delete task"
          style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', opacity: 0.25, transition: 'opacity 0.15s', padding: 0, marginTop: 1 }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '0.25')}
        >
          <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="#f87171" strokeWidth={2.5}>
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      {data.assignee && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, paddingTop: 8, borderTop: `1px solid ${s.border}` }}>
          <div style={{ width: 18, height: 18, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: 'white', background: data.assignee.avatar_color, flexShrink: 0 }}>
            {initials}
          </div>
          <span style={{ fontSize: 11, color: 'rgba(148,210,245,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{data.assignee.name}</span>
        </div>
      )}

      <Handle type="source" position={Position.Bottom} style={{ background: '#22d3ee', border: 'none', width: 8, height: 8, bottom: -4 }} />
    </div>
  )
}

export default memo(TaskNode)