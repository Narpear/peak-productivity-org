'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { use } from 'react'

const TABS = [
  { label: 'Daily',   path: 'daily' },
  { label: 'Weekly',  path: 'weekly' },
  { label: 'DAG',     path: 'dag' },
  { label: 'Summary', path: 'summary' },
]

export default function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const pathname = usePathname()
  const [project, setProject] = useState<{ name: string; color: string } | null>(null)

  useEffect(() => {
    supabase.from('projects').select('name, color').eq('id', id).single()
      .then(({ data }) => setProject(data))
  }, [id])

  return (
    <div className="flex flex-col h-full">
      {/* Project header */}
      <div className="px-8 pt-8 pb-0" style={{ borderBottom: '1px solid rgba(56,189,248,0.08)' }}>
        <div className="flex items-center gap-3 mb-5">
          {project && <div className="w-3 h-3 rounded-full shrink-0" style={{ background: project.color, boxShadow: `0 0 10px ${project.color}80` }} />}
          <h2 className="text-xl font-bold text-white">{project?.name ?? '...'}</h2>
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          {TABS.map(tab => {
            const href = `/projects/${id}/${tab.path}`
            const active = pathname === href
            return (
              <Link
                key={tab.path}
                href={href}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-t-xl transition-all duration-150 border-b-2',
                  active
                    ? 'text-sky-300 border-sky-400'
                    : 'text-sky-600 border-transparent hover:text-sky-400'
                )}
                style={active ? { background: 'rgba(56,189,248,0.06)' } : {}}
              >
                {tab.label}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  )
}