'use client'

import { useEffect, useState, useCallback } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
  MarkerType,
  Panel,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'
import TaskNode from './TaskNode'

const nodeTypes = { task: TaskNode }

type RawTask = {
  id: string; title: string; status: 'todo' | 'in_progress' | 'done'
  assigned_to: string | null
  assignee?: { name: string; avatar_color: string } | null
}
type Member = { id: string; name: string; avatar_color: string }

function getWeekNumber(d: Date) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

export default function DagView({ projectId }: { projectId: string }) {
  const { user } = useAuthStore()
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [tasks, setTasks] = useState<RawTask[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddTask, setShowAddTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskAssignee, setNewTaskAssignee] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => { loadAll() }, [projectId])

  async function loadAll() {
    const { data: memberRows } = await supabase.from('project_members').select('user_id, users(id, name, avatar_color)').eq('project_id', projectId)
    const mems = (memberRows ?? []).map((r: any) => r.users).filter(Boolean)
    setMembers(mems)

    const { data: taskRows } = await supabase.from('tasks').select('id, title, status, assigned_to, assignee:assigned_to(name, avatar_color)').eq('project_id', projectId).order('created_at')
    const rawTasks = (taskRows ?? []) as unknown as RawTask[]
    setTasks(rawTasks)

    const { data: positions } = await supabase.from('dag_node_positions').select('*').eq('project_id', projectId)
    const posMap: Record<string, { x: number; y: number }> = {}
    ;(positions ?? []).forEach((p: any) => { posMap[p.task_id] = { x: p.x, y: p.y } })

    const { data: deps } = await supabase.from('task_dependencies').select('*').eq('project_id', projectId)

    const builtNodes: Node[] = rawTasks.map((t, i) => ({
      id: t.id,
      type: 'task',
      position: posMap[t.id] ?? { x: (i % 4) * 260 + 40, y: Math.floor(i / 4) * 180 + 40 },
      data: {
        label: t.title,
        status: t.status,
        assignee: Array.isArray(t.assignee) ? t.assignee[0] : t.assignee,
        onDelete: (id: string) => deleteTask(id),
        onStatusCycle: (id: string) => cycleStatus(id),
      },
    }))

    const builtEdges: Edge[] = (deps ?? []).map((d: any) => ({
      id: d.id,
      source: d.depends_on_id,
      target: d.task_id,
      markerEnd: { type: MarkerType.ArrowClosed, color: '#22d3ee' },
      style: { stroke: '#22d3ee', strokeWidth: 1.5, opacity: 0.5 },
    }))

    setNodes(builtNodes)
    setEdges(builtEdges)
    setLoading(false)
  }

  const onNodeDragStop = useCallback(async (_: any, node: Node) => {
    const { x, y } = node.position
    const { data: existing } = await supabase.from('dag_node_positions').select('id').eq('task_id', node.id).single()
    if (existing) {
      await supabase.from('dag_node_positions').update({ x, y }).eq('task_id', node.id)
    } else {
      await supabase.from('dag_node_positions').insert({ task_id: node.id, project_id: projectId, x, y })
    }
  }, [projectId])

  const onConnect = useCallback(async (connection: Connection) => {
    if (!connection.source || !connection.target || connection.source === connection.target) return
    const reverseExists = edges.some(e => e.source === connection.target && e.target === connection.source)
    if (reverseExists) return
    const { data, error } = await supabase.from('task_dependencies').insert({ task_id: connection.target, depends_on_id: connection.source, project_id: projectId }).select().single()
    if (error || !data) return
    const newEdge: Edge = {
      id: data.id, source: connection.source, target: connection.target,
      markerEnd: { type: MarkerType.ArrowClosed, color: '#22d3ee' },
      style: { stroke: '#22d3ee', strokeWidth: 1.5, opacity: 0.5 },
    }
    setEdges(eds => addEdge(newEdge, eds))
  }, [edges, projectId, setEdges])

  const onEdgeClick = useCallback(async (_: any, edge: Edge) => {
    if (!window.confirm('Remove this dependency?')) return
    await supabase.from('task_dependencies').delete().eq('id', edge.id)
    setEdges(eds => eds.filter(e => e.id !== edge.id))
  }, [setEdges])

  async function cycleStatus(taskId: string) {
    const order: RawTask['status'][] = ['todo', 'in_progress', 'done']
    const task = tasks.find(t => t.id === taskId)
    if (!task) return
    const next = order[(order.indexOf(task.status) + 1) % order.length]
    await supabase.from('tasks').update({ status: next }).eq('id', taskId)
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: next } : t))
    setNodes(nds => nds.map(n => n.id === taskId ? { ...n, data: { ...n.data, status: next } } : n))
  }

  async function deleteTask(taskId: string) {
    if (!window.confirm('Delete this task?')) return
    await supabase.from('tasks').delete().eq('id', taskId)
    setTasks(prev => prev.filter(t => t.id !== taskId))
    setNodes(nds => nds.filter(n => n.id !== taskId))
    setEdges(eds => eds.filter(e => e.source !== taskId && e.target !== taskId))
  }

  async function createTask() {
    if (!newTaskTitle.trim()) return
    setCreating(true)
    const now = new Date()
    const { data } = await supabase.from('tasks').insert({
      title: newTaskTitle.trim(), type: 'daily', status: 'todo', project_id: projectId,
      assigned_to: newTaskAssignee || null, assigned_by: user!.id,
      week_number: getWeekNumber(now), year: now.getFullYear(), position: tasks.length,
    }).select('id, title, status, assigned_to, assignee:assigned_to(name, avatar_color)').single()

    if (data) {
      const newNode: Node = {
        id: data.id, type: 'task',
        position: { x: Math.random() * 400 + 40, y: Math.random() * 300 + 40 },
        data: {
          label: data.title, status: data.status,
          assignee: Array.isArray(data.assignee) ? data.assignee[0] : data.assignee,
          onDelete: (id: string) => deleteTask(id),
          onStatusCycle: (id: string) => cycleStatus(id),
        },
      }
      setNodes(nds => [...nds, newNode])
      setTasks(prev => [...prev, data as unknown as RawTask])
    }
    setNewTaskTitle(''); setNewTaskAssignee(''); setShowAddTask(false); setCreating(false)
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 130px)' }}>
      <div style={{ width: 18, height: 18, border: '2px solid rgba(56,189,248,0.15)', borderTopColor: '#22d3ee', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  return (
    <div style={{ width: '100%', height: 'calc(100vh - 130px)', background: '#070f1a' }}>
      <ReactFlow
        nodes={nodes} edges={edges}
        onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
        onConnect={onConnect} onNodeDragStop={onNodeDragStop} onEdgeClick={onEdgeClick}
        nodeTypes={nodeTypes} fitView deleteKeyCode={null}
        style={{ background: '#070f1a' }}
      >
        <Background color="rgba(34,211,238,0.04)" gap={28} size={1} />
        <Controls style={{ background: 'rgba(5,15,31,0.95)', border: '1px solid rgba(34,211,238,0.15)', borderRadius: 12 }} />
        <MiniMap style={{ background: 'rgba(5,15,31,0.95)', border: '1px solid rgba(34,211,238,0.1)', borderRadius: 12 }} nodeColor={() => 'rgba(34,211,238,0.35)'} maskColor="rgba(7,15,26,0.85)" />

        <Panel position="top-left">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 16, background: 'rgba(5,15,31,0.97)', border: '1px solid rgba(34,211,238,0.15)', borderRadius: 16, backdropFilter: 'blur(10px)', minWidth: 200 }}>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(34,211,238,0.5)' }}>Dependency Graph</p>
            <p style={{ fontSize: 11, color: 'rgba(56,189,248,0.3)', lineHeight: 1.5 }}>Drag between nodes to add edges.<br/>Click an edge to remove it.</p>

            {showAddTask ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                <input autoFocus value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') createTask(); if (e.key === 'Escape') setShowAddTask(false) }} placeholder="Task title..." style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 10, outline: 'none', fontSize: 12, color: 'var(--text-primary)', fontFamily: 'var(--font-outfit), sans-serif' }} />
                <select value={newTaskAssignee} onChange={e => setNewTaskAssignee(e.target.value)} style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 10, outline: 'none', fontSize: 12, color: '#7dd3fc', fontFamily: 'var(--font-outfit), sans-serif' }}>
                  <option value="">Assign to...</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={createTask} disabled={creating} style={{ flex: 1, padding: '7px', background: 'linear-gradient(135deg, #0891b2, #0ea5e9)', border: 'none', borderRadius: 8, color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-outfit), sans-serif' }}>{creating ? '...' : 'Add'}</button>
                  <button onClick={() => setShowAddTask(false)} style={{ padding: '7px 10px', background: 'transparent', border: '1px solid rgba(56,189,248,0.15)', borderRadius: 8, color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-outfit), sans-serif' }}>Cancel</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowAddTask(true)} style={{ padding: '8px', background: 'linear-gradient(135deg, #0891b2, #0ea5e9)', border: 'none', borderRadius: 10, color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-outfit), sans-serif', marginTop: 4 }}>
                + Add Task Node
              </button>
            )}
          </div>
        </Panel>
      </ReactFlow>
    </div>
  )
}