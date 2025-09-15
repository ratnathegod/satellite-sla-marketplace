import { TaskStatus, type TaskStatusType } from '@/lib/viem'

interface StatusBadgeProps {
  status: TaskStatusType
  className?: string
}

const statusColors = {
  0: 'bg-gray-100 text-gray-800', // Created
  1: 'bg-blue-100 text-blue-800', // Funded
  2: 'bg-yellow-100 text-yellow-800', // Accepted
  3: 'bg-purple-100 text-purple-800', // Submitted
  4: 'bg-red-100 text-red-800', // Disputed
  5: 'bg-green-100 text-green-800', // Released
  6: 'bg-gray-100 text-gray-800', // Cancelled
  7: 'bg-green-100 text-green-800', // Resolved
} as const

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const statusText = TaskStatus[status]
  const colorClass = statusColors[status]

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass} ${className}`}>
      {statusText}
    </span>
  )
}