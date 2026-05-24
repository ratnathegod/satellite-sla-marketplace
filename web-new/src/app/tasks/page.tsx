'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, RefreshCw, Filter, Loader2 } from 'lucide-react'
import { useAccount } from 'wagmi'
import { TaskCard } from '@/components/TaskCard'
import { useTasks } from '@/lib/hooks'
import { TaskStatus, TaskStatusLabel, type TaskWithMetadata } from '@/lib/types'

type FilterOption = 'all' | 'active' | 'completed' | 'my-tasks'

const filterOptions: { value: FilterOption; label: string }[] = [
  { value: 'all', label: 'All Tasks' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'my-tasks', label: 'My Tasks' },
]

export default function TasksPage() {
  const { address } = useAccount()
  const [filter, setFilter] = useState<FilterOption>('all')
  const { tasks, loading, error, refresh } = useTasks()
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    await refresh()
    setRefreshing(false)
  }

  // Filter tasks based on selection
  const filteredTasks = tasks.filter((task) => {
    switch (filter) {
      case 'active':
        return [
          TaskStatus.Created,
          TaskStatus.Funded,
          TaskStatus.Accepted,
          TaskStatus.Submitted,
          TaskStatus.Disputed,
        ].includes(task.status)
      case 'completed':
        return [
          TaskStatus.Released,
          TaskStatus.Cancelled,
          TaskStatus.Resolved,
        ].includes(task.status)
      case 'my-tasks':
        if (!address) return false
        const normalizedAddr = address.toLowerCase()
        return (
          task.requester.toLowerCase() === normalizedAddr ||
          task.operator.toLowerCase() === normalizedAddr
        )
      default:
        return true
    }
  })

  // Group tasks by status for the summary
  const statusCounts = tasks.reduce(
    (acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1
      return acc
    },
    {} as Record<number, number>
  )

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Tasks</h1>
          <p className="text-muted-foreground mt-1">
            Browse and manage satellite tasking requests
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={loading || refreshing}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
            />
            Refresh
          </button>
          <Link
            href="/new-task"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Task
          </Link>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
        {Object.values(TaskStatus)
          .filter((v) => typeof v === 'number')
          .map((status) => (
            <div
              key={status}
              className="rounded-lg border border-border bg-card p-3 text-center"
            >
              <p className="text-2xl font-bold text-foreground">
                {statusCounts[status as number] || 0}
              </p>
              <p className="text-xs text-muted-foreground">
                {TaskStatusLabel[status as TaskStatus]}
              </p>
            </div>
          ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        {filterOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setFilter(option.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === option.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-accent'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Loading tasks...</span>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="text-destructive font-medium">Failed to load tasks</p>
          <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
          <button
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 rounded-md bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90"
          >
            Try Again
          </button>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <Filter className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No tasks found</h3>
          <p className="text-muted-foreground mb-6">
            {filter === 'my-tasks' && !address
              ? 'Connect your wallet to see your tasks'
              : filter === 'all'
              ? 'Be the first to create a satellite task!'
              : 'No tasks match the selected filter'}
          </p>
          {filter === 'all' && (
            <Link
              href="/new-task"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Create Task
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  )
}
