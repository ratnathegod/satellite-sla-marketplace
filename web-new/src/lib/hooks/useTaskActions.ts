'use client'

import { useMemo, useState, useEffect } from 'react'
import { usePublicClient } from 'wagmi'
import { getEscrowContract } from '@/lib/contracts'
import { TaskStatus, type Task, type TaskRole, type TaskActions } from '@/lib/types'

/**
 * State → Role → Actions Matrix
 *
 * | Status      | Requester Actions            | Operator Actions | Anyone          |
 * |-------------|------------------------------|------------------|-----------------|
 * | Created     | fundTask, cancelUnaccepted   | –                | –               |
 * | Funded      | cancelUnaccepted             | acceptTask       | –               |
 * | Accepted    | –                            | submitProof      | –               |
 * | Submitted   | release, dispute (if window) | –                | release (after) |
 * | Disputed    | resolveDispute (owner only)  | –                | –               |
 * | Released    | –                            | –                | –               |
 * | Cancelled   | –                            | –                | –               |
 * | Resolved    | –                            | –                | –               |
 */

interface UseTaskActionsReturn extends TaskActions {
  isDisputeWindowActive: boolean
  disputeWindowLoading: boolean
}

/**
 * Hook to compute available actions based on task status and user role
 */
export function useTaskActions(
  task: Task | null,
  role: TaskRole
): UseTaskActionsReturn {
  const publicClient = usePublicClient()
  const [isDisputeWindowActive, setIsDisputeWindowActive] = useState(false)
  const [disputeWindowLoading, setDisputeWindowLoading] = useState(false)

  // Check dispute window status for Submitted tasks
  useEffect(() => {
    async function checkDisputeWindow() {
      if (!publicClient || !task || task.status !== TaskStatus.Submitted) {
        setIsDisputeWindowActive(false)
        return
      }

      try {
        setDisputeWindowLoading(true)
        const escrow = await getEscrowContract(publicClient)
        const isActive = await escrow.read.isDisputeWindowActive([BigInt(task.id)])
        setIsDisputeWindowActive(isActive as boolean)
      } catch (error) {
        console.error('Failed to check dispute window:', error)
        setIsDisputeWindowActive(false)
      } finally {
        setDisputeWindowLoading(false)
      }
    }

    checkDisputeWindow()
  }, [publicClient, task])

  const actions = useMemo((): TaskActions => {
    if (!task) {
      return {
        canFund: false,
        canCancel: false,
        canAccept: false,
        canSubmitProof: false,
        canRelease: false,
        canDispute: false,
        canResolve: false,
      }
    }

    const { status } = task
    const isRequester = role === 'requester'
    const isOperator = role === 'operator'

    return {
      // Fund: Requester can fund a Created task
      canFund: status === TaskStatus.Created && isRequester,

      // Cancel: Requester can cancel Created or Funded tasks (before acceptance)
      canCancel:
        (status === TaskStatus.Created || status === TaskStatus.Funded) &&
        isRequester,

      // Accept: Operator can accept a Funded task
      canAccept: status === TaskStatus.Funded && isOperator,

      // Submit Proof: Operator can submit proof for an Accepted task
      canSubmitProof: status === TaskStatus.Accepted && isOperator,

      // Release: Requester can release during window, anyone can release after window
      canRelease:
        status === TaskStatus.Submitted &&
        (isRequester || !isDisputeWindowActive),

      // Dispute: Requester can dispute during active window
      canDispute:
        status === TaskStatus.Submitted && isRequester && isDisputeWindowActive,

      // Resolve: Only contract owner can resolve (we don't check owner here, UI can show for requester)
      canResolve: status === TaskStatus.Disputed && isRequester,
    }
  }, [task, role, isDisputeWindowActive])

  return {
    ...actions,
    isDisputeWindowActive,
    disputeWindowLoading,
  }
}
