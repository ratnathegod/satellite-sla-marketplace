'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePublicClient } from 'wagmi'
import { getEscrowContract } from '@/lib/contracts'
import { fetchJson } from '@/lib/ipfs'
import { parseTask, type TaskWithMetadata, type TaskMetadata } from '@/lib/types'

interface UseTaskReturn {
  task: TaskWithMetadata | null
  loading: boolean
  error: Error | null
  refresh: () => Promise<void>
}

/**
 * Hook to fetch a single task by ID with metadata
 */
export function useTask(taskId: string | undefined): UseTaskReturn {
  const publicClient = usePublicClient()
  const [task, setTask] = useState<TaskWithMetadata | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadTask = useCallback(async () => {
    if (!publicClient || taskId === undefined) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const escrow = await getEscrowContract(publicClient)
      const rawTask = await escrow.read.getTask([BigInt(taskId)])
      const parsedTask = parseTask(taskId, rawTask as readonly unknown[])

      // Try to get metadata CID from TaskCreated event
      let metadataCid: string | undefined
      let metadata: TaskMetadata | undefined

      try {
        const events = await escrow.getEvents.TaskCreated({
          fromBlock: 0n,
          toBlock: 'latest',
        }) as any[]
        const createEvent = events.find(
          (e: any) => e.args?.taskId?.toString() === taskId
        )
        if (createEvent?.args?.taskRefCid) {
          metadataCid = createEvent.args.taskRefCid as string
        }
      } catch (eventError) {
        console.warn('Failed to fetch TaskCreated event:', eventError)
      }

      // Fetch metadata from IPFS if we have a CID
      if (metadataCid) {
        try {
          const result = await fetchJson<TaskMetadata>(metadataCid)
          if (result) metadata = result
        } catch (ipfsError) {
          console.warn('Failed to fetch IPFS metadata:', ipfsError)
        }
      }

      setTask({
        ...parsedTask,
        metadataCid,
        metadata,
      })
    } catch (err) {
      console.error('Failed to load task:', err)
      setError(err instanceof Error ? err : new Error('Failed to load task'))
    } finally {
      setLoading(false)
    }
  }, [publicClient, taskId])

  useEffect(() => {
    loadTask()
  }, [loadTask])

  return {
    task,
    loading,
    error,
    refresh: loadTask,
  }
}
