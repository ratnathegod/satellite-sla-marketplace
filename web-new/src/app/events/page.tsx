'use client'

import { useState } from 'react'
import Link from 'next/link'
import { RefreshCw, Loader2, Filter, ExternalLink, Activity } from 'lucide-react'
import { Address } from '@/components/Address'
import { useContractEvents } from '@/lib/hooks'
import { shortenAddress, formatTokenAmount } from '@/lib/format'
import { type EscrowEvent } from '@/lib/types'

// Event type colors
const eventColors: Record<string, string> = {
  TaskCreated: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  TaskFunded: 'bg-green-500/10 text-green-500 border-green-500/20',
  TaskAccepted: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  ProofSubmitted: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
  TaskReleased: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  TaskDisputed: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  DisputeResolved: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  TaskCancelled: 'bg-red-500/10 text-red-500 border-red-500/20',
  Unknown: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
}

// Get all known event types for filtering
const eventTypes = [
  'All',
  'TaskCreated',
  'TaskFunded',
  'TaskAccepted',
  'ProofSubmitted',
  'TaskReleased',
  'TaskDisputed',
  'DisputeResolved',
  'TaskCancelled',
]

function EventCard({ event }: { event: EscrowEvent }) {
  const colorClass = eventColors[event.eventName] || eventColors.Unknown

  // Format event args for display
  const formatArgValue = (key: string, value: unknown): string => {
    if (value === undefined || value === null) return '—'
    if (typeof value === 'bigint') {
      if (key.toLowerCase().includes('amount') || key.toLowerCase().includes('bond')) {
        return `${formatTokenAmount(value)} TEST`
      }
      return value.toString()
    }
    if (typeof value === 'string' && value.startsWith('0x') && value.length === 42) {
      return shortenAddress(value as `0x${string}`)
    }
    if (typeof value === 'string' && value.startsWith('0x') && value.length > 42) {
      return `${value.slice(0, 10)}...${value.slice(-8)}`
    }
    return String(value)
  }

  // Filter out some internal args
  const displayArgs = Object.entries(event.args).filter(
    ([key]) => !['__length__', 'length'].includes(key) && !key.match(/^\d+$/)
  )

  return (
    <div className="rounded-lg border border-border bg-card p-4 hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${colorClass}`}
          >
            {event.eventName}
          </span>
          {event.taskId !== undefined && (
            <Link
              href={`/task/${event.taskId}`}
              className="text-sm text-primary hover:underline"
            >
              Task #{event.taskId.toString()}
            </Link>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">
            Block #{event.blockNumber.toString()}
          </p>
          <a
            href={`#tx-${event.transactionHash}`}
            className="text-xs font-mono text-muted-foreground hover:text-primary"
          >
            {shortenAddress(event.transactionHash)}
          </a>
        </div>
      </div>

      {displayArgs.length > 0 && (
        <div className="grid gap-2 text-sm">
          {displayArgs.map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-muted-foreground capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </span>
              <span className="font-mono text-xs">
                {typeof value === 'string' && value.startsWith('0x') && value.length === 42 ? (
                  <Address address={value as `0x${string}`} />
                ) : (
                  formatArgValue(key, value)
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function EventsPage() {
  const [eventFilter, setEventFilter] = useState('All')
  const { events, loading, error, refresh } = useContractEvents({ limit: 200 })
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    await refresh()
    setRefreshing(false)
  }

  // Filter events
  const filteredEvents =
    eventFilter === 'All'
      ? events
      : events.filter((e) => e.eventName === eventFilter)

  // Count events by type
  const eventCounts = events.reduce(
    (acc, event) => {
      acc[event.eventName] = (acc[event.eventName] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Activity className="h-8 w-8 text-primary" />
            Event Explorer
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time Escrow contract event logs
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading || refreshing}
          className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Event Type Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
        {eventTypes.slice(1).map((type) => (
          <button
            key={type}
            onClick={() => setEventFilter(type)}
            className={`rounded-lg border p-3 text-center transition-colors ${
              eventFilter === type
                ? 'border-primary bg-primary/10'
                : 'border-border bg-card hover:border-primary/50'
            }`}
          >
            <p className="text-2xl font-bold">{eventCounts[type] || 0}</p>
            <p className="text-xs text-muted-foreground truncate">{type}</p>
          </button>
        ))}
      </div>

      {/* Filter Pills */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        {eventTypes.map((type) => (
          <button
            key={type}
            onClick={() => setEventFilter(type)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              eventFilter === type
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-accent'
            }`}
          >
            {type}
            {type !== 'All' && eventCounts[type] ? ` (${eventCounts[type]})` : ''}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Loading events...</span>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="text-destructive font-medium">Failed to load events</p>
          <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
          <button
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 rounded-md bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90"
          >
            Try Again
          </button>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <Activity className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No events found</h3>
          <p className="text-muted-foreground">
            {eventFilter === 'All'
              ? 'No contract events have been emitted yet'
              : `No ${eventFilter} events found`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Showing {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
          </p>
          {filteredEvents.map((event, i) => (
            <EventCard key={`${event.transactionHash}-${i}`} event={event} />
          ))}
        </div>
      )}
    </div>
  )
}
