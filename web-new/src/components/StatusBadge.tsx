'use client'

import { TaskStatus, TaskStatusLabel } from '@/lib/contracts'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: TaskStatus
  className?: string
}

const statusColors: Record<TaskStatus, string> = {
  [TaskStatus.Created]: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  [TaskStatus.Funded]: 'bg-green-500/10 text-green-500 border-green-500/20',
  [TaskStatus.Accepted]: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  [TaskStatus.Submitted]: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  [TaskStatus.Disputed]: 'bg-red-500/10 text-red-500 border-red-500/20',
  [TaskStatus.Released]: 'bg-green-500/10 text-green-500 border-green-500/20',
  [TaskStatus.Cancelled]: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  [TaskStatus.Resolved]: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
        statusColors[status],
        className
      )}
    >
      {TaskStatusLabel[status]}
    </span>
  )
}
