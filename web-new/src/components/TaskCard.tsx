'use client'

import Link from 'next/link'
import { ArrowRight, Clock, Coins } from 'lucide-react'
import { StatusBadge } from '@/components/StatusBadge'
import { Address } from '@/components/Address'
import { formatTokenAmount, formatTimeRemaining } from '@/lib/format'
import { type TaskWithMetadata } from '@/lib/types'

interface TaskCardProps {
  task: TaskWithMetadata
  showRequester?: boolean
  showOperator?: boolean
}

export function TaskCard({
  task,
  showRequester = true,
  showOperator = true,
}: TaskCardProps) {
  const title = task.metadata?.title || `Task #${task.id}`
  const description = task.metadata?.description

  return (
    <Link
      href={`/task/${task.id}`}
      className="group block rounded-lg border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors truncate">
              {title}
            </h3>
            <StatusBadge status={task.status} />
          </div>

          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
              {description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            {/* Amount */}
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Coins className="h-4 w-4" />
              <span>{formatTokenAmount(task.amount)} TEST</span>
            </div>

            {/* Deadline */}
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{formatTimeRemaining(task.deadline)}</span>
            </div>

            {/* Requester */}
            {showRequester && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <span className="text-xs">Requester:</span>
                <Address address={task.requester} shorten />
              </div>
            )}

            {/* Operator */}
            {showOperator && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <span className="text-xs">Operator:</span>
                <Address address={task.operator} shorten />
              </div>
            )}
          </div>
        </div>

        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
      </div>
    </Link>
  )
}
