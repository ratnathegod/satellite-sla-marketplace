'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePublicClient } from 'wagmi'
import { getEscrowContract } from '@/lib/contracts'
import { fetchJson } from '@/lib/ipfs'
import { parseTask, TaskStatus, type TaskWithMetadata, type TaskMetadata } from '@/lib/types'

interface UseTasksReturn {
  tasks: TaskWithMetadata[]
  loading: boolean
  error: Error | null
  refresh: () => Promise<void>
}

interface UseTasksOptions {
  statusFilter?: TaskStatus | 'all'
}

/**
 * Hook to fetch all tasks with optional status filtering
 */
export function useTasks(options: UseTasksOptions = {}): UseTasksReturn {
  const { statusFilter = 'all' } = options
  const publicClient = usePublicClient()
  const [tasks, setTasks] = useState<TaskWithMetadata[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadTasks = useCallback(async () => {
    if (!publicClient) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const escrow = await getEscrowContract(publicClient)
      const nextId = (await (escrow.read as any).nextTaskId()) as bigint
      const count = Number(nextId)

      if (count === 0) {
        setTasks([])
        setLoading(false)
        return
      }

      // Fetch all task created events for metadata CIDs
      let createEvents: any[] = []
      try {
        createEvents = await escrow.getEvents.TaskCreated({
          fromBlock: 0n,
          toBlock: 'latest',
        }) as any[]
      } catch (eventError) {
        console.warn('Failed to fetch TaskCreated events:', eventError)
      }

      // Build a map of taskId -> metadataCid
      const cidMap = new Map<string, string>()
      for (const event of createEvents) {
        if (event.args?.taskId !== undefined && event.args?.taskRefCid) {
          cidMap.set(event.args.taskId.toString(), event.args.taskRefCid as string)
        }
      }

      // Fetch all tasks in parallel
      const taskPromises = Array.from({ length: count }, async (_, i) => {
        const rawTask = await escrow.read.getTask([BigInt(i)])
        const task = parseTask(String(i), rawTask as readonly unknown[])

        // Filter by status if specified
        if (statusFilter !== 'all' && task.status !== statusFilter) {
          return null
        }

        const metadataCid = cidMap.get(String(i))
        let metadata: TaskMetadata | undefined

        // Try to fetch metadata from IPFS
        if (metadataCid) {
          try {
            const result = await fetchJson<TaskMetadata>(metadataCid)
            if (result) metadata = result
          } catch {
            // Ignore IPFS errors
          }
        }

        return {
          ...task,
          metadataCid,
          metadata,
        } as TaskWithMetadata
      })

      const results = await Promise.all(taskPromises)
      const filteredTasks = results.filter((t): t is TaskWithMetadata => t !== null)

      // Sort by ID descending (newest first)
      filteredTasks.sort((a, b) => Number(b.id) - Number(a.id))

      setTasks(filteredTasks)
    } catch (err) {
      console.error('Failed to load tasks:', err)
      setError(err instanceof Error ? err : new Error('Failed to load tasks'))
    } finally {
      setLoading(false)
    }
  }, [publicClient, statusFilter])

  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  return {
    tasks,
    loading,
    error,
    refresh: loadTasks,
  }
}
