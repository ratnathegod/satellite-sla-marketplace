'use client'

interface RoleBadgeProps {
  isRequester?: boolean
  isOperator?: boolean
  className?: string
}

export function RoleBadge({ isRequester, isOperator, className = '' }: RoleBadgeProps) {
  if (!isRequester && !isOperator) return null

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isRequester ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500'
      } ${className}`}
    >
      {isRequester ? '👤 You are the requester' : '🛠️ You are the operator'}
    </span>
  )
}
