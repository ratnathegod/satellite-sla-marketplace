'use client'

interface RoleBadgeProps {
  isRequester?: boolean
  isOperator?: boolean
  isOwner?: boolean
  className?: string
}

export function RoleBadge({
  isRequester,
  isOperator,
  isOwner,
  className = '',
}: RoleBadgeProps) {
  if (!isRequester && !isOperator && !isOwner) return null

  const labels = [
    isRequester ? 'Requester' : null,
    isOperator ? 'Operator' : null,
    isOwner ? 'Contract owner' : null,
  ].filter(Boolean)

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isRequester ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500'
      } ${className}`}
    >
      You are: {labels.join(', ')}
    </span>
  )
}
