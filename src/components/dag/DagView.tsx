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
  id: string
  title: string
  status: 'todo' | 'in_progress' | 'done'
  assigned_to: string | null
  assignee?: { name: string; avatar_color: string } | null
}

type Member = {
  id: string
  name: string
  avatar_color: string
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

  useEffect(() => {
    loadAll()
  }, [projectId])

  async function loadAll() {
    // Members
    const { data: memberRows } = await supabase
      .from('project_members')
      .select('user_id, users(id, name, avatar_color)')
      .eq('project_id', projectId)
    const mems = (memberRows ?? []).map((r: any) => r.users).filter(Boolean)
    setMembers(mems)

    // Tasks in this project (all types)
    const { data: taskRows } = await supabase
      .from('tasks')
      .select('id, title, status, assigned_to, assignee:assigned_to(name, avatar_color)')
      .eq('project_id', projectId)
      .order('created_at')
    const rawTasks = (taskRows ?? []) as RawTask[]
    setTasks(rawTasks)

    // Node positions
    const { data: positions } = await supabase
      .from('dag_node_positions')
      .select('*')
      .eq('project_id', projectId)
    const posMap: Record<string, { x: number; y: number }> = {}
    ;(positions ?? []).forEach((p: any) => { posMap[p.task_id] = { x: p.x, y: p.y } })

    // Dependencies (edges)
    const { data: deps } = await supabase
      .from('task_dependencies')
      .select('*')
      .eq('project_id', projectId)

    // Build nodes
    const builtNodes: Node[] = rawTasks.map((t, i) => ({
      id: t.id,
      type: 'task',
      position: posMap[t.id] ?? { x: (i % 4) * 240 + 40, y: Math.floor(i / 4) * 160 + 40 },
      data: {
        label: t.title,
        status: t.status,
        assignee: Array.isArray(t.assignee) ? t.assignee[0] : t.assignee,
        onDelete: (id: string) => deleteTask(id),
        onStatusCycle: (id: string) => cycleStatus(id),
      },
    }))

    // Build edges
    const builtEdges: Edge[] = (deps ?? []).map((d: any) => ({
      id: d.id,
      source: d.depends_on_id,
      target: d.task_id,
      markerEnd: { type: MarkerType.ArrowClosed, color: '#38bdf8' },
      style: { stroke: '#38bdf8', strokeWidth: 1.5, opacity: 0.6 },
      animated: false,
    }))

    setNodes(builtNodes)
    setEdges(builtEdges)
    setLoading(false)
  }

  // Persist node position on drag end
  const onNodeDragStop = useCallback(async (_: any, node: Node) => {
    const { x, y } = node.position
    const { data: existing } = await supabase
      .from('dag_node_positions')
      .select('id')
      .eq('task_id', node.id)
      .single()

    if (existing) {
      await supabase.from('dag_node_positions').update({ x, y }).eq('task_id', node.id)
    } else {
      await supabase.from('dag_node_positions').insert({ task_id: node.id, project_id: projectId, x, y })
    }
  }, [projectId])

  // Add dependency edge on connect
  const onConnect = useCallback(async (connection: Connection) => {
    if (!connection.source || !connection.target) return

    // Prevent self-loops
    if (connection.source === connection.target) return

    // Check for cycle (simple: don't allow if reverse already exists)
    const reverseExists = edges.some(e => e.source === connection.target && e.target === connection.source)
    if (reverseExists) return

    const { data, error } = await supabase.from('task_dependencies').insert({
      task_id: connection.target,
      depends_on_id: connection.source,
      project_id: projectId,
    }).select().single()

    if (error || !data) return

    const newEdge: Edge = {
      id: data.id,
      source: connection.source,
      target: connection.target,
      markerEnd: { type: MarkerType.ArrowClosed, color: '#38bdf8' },
      style: { stroke: '#38bdf8', strokeWidth: 1.5, opacity: 0.6 },
    }
    setEdges(eds => addEdge(newEdge, eds))
  }, [edges, projectId, setEdges])

  // Delete edge on click
  const onEdgeClick = useCallback(async (_: any, edge: Edge) => {
    const confirmed = window.confirm('Remove this dependency?')
    if (!confirmed) return
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
    const confirmed = window.confirm('Delete this task from the DAG?')
    if (!confirmed) return
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
      title: newTaskTitle.trim(),
      type: 'daily',
      status: 'todo',
      project_id: projectId,
      assigned_to: newTaskAssignee || null,
      assigned_by: user!.id,
      week_number: getWeekNumber(now),
      year: now.getFullYear(),
      position: tasks.length,
    }).select('id, title, status, assigned_to, assignee:assigned_to(name, avatar_color)').single()

    if (data) {
      const newNode: Node = {
        id: data.id,
        type: 'task',
        position: { x: Math.random() * 400 + 40, y: Math.random() * 300 + 40 },
        data: {
          label: data.title,
          status: data.status,
          assignee: Array.isArray(data.assignee) ? data.assignee[0] : data.assignee,
          onDelete: (id: string) => deleteTask(id),
          onStatusCycle: (id: string) => cycleStatus(id),
        },
      }
      setNodes(nds => [...nds, newNode])
      setTasks(prev => [...prev, data as RawTask])
    }

    setNewTaskTitle('')
    setNewTaskAssignee('')
    setShowAddTask(false)
    setCreating(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(56,189,248,0.2)', borderTopColor: '#38bdf8' }} />
    </div>
  )

  return (
    <div style={{ width: '100%', height: 'calc(100vh - 130px)', background: '#070f1a' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onEdgeClick={onEdgeClick}
        nodeTypes={nodeTypes}
        fitView
        deleteKeyCode={null}
        style={{ background: '#070f1a' }}
      >
        <Background color="rgba(56,189,248,0.06)" gap={24} size={1} />
        <Controls
          style={{ background: 'rgba(10,22,40,0.9)', border: '1px solid rgba(56,189,248,0.15)', borderRadius: '12px' }}
        />
        <MiniMap
          style={{ background: 'rgba(10,22,40,0.9)', border: '1px solid rgba(56,189,248,0.1)', borderRadius: '12px' }}
          nodeColor={() => 'rgba(56,189,248,0.4)'}
          maskColor="rgba(7,15,26,0.8)"
        />

        <Panel position="top-left">
          <div className="flex flex-col gap-2 p-3" style={{ background: 'rgba(10,22,40,0.95)', border: '1px solid rgba(56,189,248,0.15)', borderRadius: '16px', backdropFilter: 'blur(10px)' }}>
            <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: 'rgba(56,189,248,0.5)' }}>Dependency Graph</p>
            <p className="text-xs" style={{ color: 'rgba(56,189,248,0.3)' }}>Drag between nodes to add edges</p>
            <p className="text-xs" style={{ color: 'rgba(56,189,248,0.3)' }}>Click an edge to remove it</p>

            {showAddTask ? (
              <div className="flex flex-col gap-2 mt-1 min-w-[200px]">
                <input
                  autoFocus
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') createTask(); if (e.key === 'Escape') setShowAddTask(false) }}
                  placeholder="Task title..."
                  className="text-xs px-3 py-2 rounded-lg outline-none text-white placeholder-sky-700"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(56,189,248,0.2)' }}
                />
                <select
                  value={newTaskAssignee}
                  onChange={e => setNewTaskAssignee(e.target.value)}
                  className="text-xs px-3 py-2 rounded-lg outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(56,189,248,0.2)', color: '#7dd3fc' }}
                >
                  <option value="">Assign to...</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                <div className="flex gap-2">
                  <button onClick={createTask} disabled={creating} className="flex-1 text-xs py-1.5 rounded-lg text-white font-medium" style={{ background: 'linear-gradient(135deg, #0891b2, #0ea5e9)' }}>
                    {creating ? '...' : 'Add'}
                  </button>
                  <button onClick={() => setShowAddTask(false)} className="text-xs px-2 rounded-lg" style={{ color: 'rgba(56,189,248,0.5)' }}>Cancel</button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddTask(true)}
                className="text-xs py-1.5 px-3 rounded-lg text-white font-medium mt-1 transition-all"
                style={{ background: 'linear-gradient(135deg, #0891b2, #0ea5e9)' }}
              >
                + Add Task Node
              </button>
            )}
          </div>
        </Panel>
      </ReactFlow>
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