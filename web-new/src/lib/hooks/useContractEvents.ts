'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePublicClient } from 'wagmi'
import { decodeEventLog, type Log } from 'viem'
import { loadContractABI, loadContractAddress } from '@/lib/viem'
import { type EscrowEvent } from '@/lib/types'

interface UseContractEventsReturn {
  events: EscrowEvent[]
  loading: boolean
  error: Error | null
  refresh: () => Promise<void>
}

interface UseContractEventsOptions {
  taskId?: string
  limit?: number
}

/**
 * Hook to fetch and decode Escrow contract events
 */
export function useContractEvents(
  options: UseContractEventsOptions = {}
): UseContractEventsReturn {
  const { taskId, limit = 100 } = options
  const publicClient = usePublicClient()
  const [events, setEvents] = useState<EscrowEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadEvents = useCallback(async () => {
    if (!publicClient) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const escrowAddress = await loadContractAddress('escrow')
      if (!escrowAddress) {
        throw new Error('Escrow contract not deployed')
      }

      const abi = await loadContractABI('Escrow')
      if (!abi) {
        throw new Error('Failed to load Escrow ABI')
      }

      // Get logs from recent blocks
      const currentBlock = await publicClient.getBlockNumber()
      const fromBlock = currentBlock > 10000n ? currentBlock - 10000n : 0n

      const logs = await publicClient.getLogs({
        address: escrowAddress,
        fromBlock,
        toBlock: 'latest',
      })

      // Decode events
      const decodedEvents: EscrowEvent[] = []

      for (const log of logs) {
        try {
          const decoded = decodeEventLog({
            abi,
            data: log.data,
            topics: log.topics,
          }) as { eventName: string; args: Record<string, unknown> }

          const eventTaskId =
            decoded.args && typeof decoded.args === 'object' && 'taskId' in decoded.args
              ? (decoded.args.taskId as bigint)
              : undefined

          // Filter by taskId if specified
          if (taskId !== undefined && eventTaskId?.toString() !== taskId) {
            continue
          }

          decodedEvents.push({
            blockNumber: log.blockNumber!,
            transactionHash: log.transactionHash!,
            eventName: decoded.eventName,
            taskId: eventTaskId,
            args: decoded.args as Record<string, unknown>,
          })
        } catch (decodeError) {
          // Add as unknown event if decoding fails
          decodedEvents.push({
            blockNumber: log.blockNumber!,
            transactionHash: log.transactionHash!,
            eventName: 'Unknown',
            args: {},
          })
        }
      }

      // Sort by block number descending (newest first) and limit
      decodedEvents.sort((a, b) => Number(b.blockNumber - a.blockNumber))
      const limitedEvents = decodedEvents.slice(0, limit)

      setEvents(limitedEvents)
    } catch (err) {
      console.error('Failed to load events:', err)
      setError(err instanceof Error ? err : new Error('Failed to load events'))
    } finally {
      setLoading(false)
    }
  }, [publicClient, taskId, limit])

  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  return {
    events,
    loading,
    error,
    refresh: loadEvents,
  }
}
