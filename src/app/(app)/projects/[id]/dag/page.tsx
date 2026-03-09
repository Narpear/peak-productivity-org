'use client'

import { use } from 'react'
import DagView from '@/components/dag/DagView'

export default function DagPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <DagView projectId={id} />
}