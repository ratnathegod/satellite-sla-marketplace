'use client'

import { useMemo, useState, useEffect } from 'react'
import { usePublicClient } from 'wagmi'
import { getEscrowContract } from '@/lib/contracts'
import {
  TaskStatus,
  type Task,
  type TaskRole,
  type TaskActions,
  type RequiredTaskRole,
} from '@/lib/types'

/**
 * State → Role → Actions Matrix
 *
 * | Status      | Requester Actions                         | Operator Actions | Owner Actions         |
 * |-------------|-------------------------------------------|------------------|-----------------------|
 * | Created     | fundTask; cancelUnaccepted after deadline | –                | –                     |
 * | Funded      | cancelUnaccepted after deadline           | acceptTask       | –                     |
 * | Accepted    | –                                         | submitProof      | –                     |
 * | Submitted   | release or dispute while window is open   | –                | –                     |
 * | Disputed    | –                                         | –                | resolveDispute        |
 * | Released    | –                                         | –                | –                     |
 * | Cancelled   | –                                         | –                | –                     |
 * | Resolved    | –                                         | –                | –                     |
 */

interface UseTaskActionsReturn extends TaskActions {
  isDisputeWindowActive: boolean
  disputeWindowLoading: boolean
  isDeadlinePassed: boolean
  isSubmissionDeadlineOpen: boolean
}

function buildAction(
  canExecute: boolean,
  label: string,
  description: string,
  requiredRole: RequiredTaskRole,
  disabledReason?: string
) {
  return {
    canExecute,
    label,
    description,
    requiredRole,
    disabledReason: canExecute ? undefined : disabledReason,
  }
}

function emptyActions(reason: string): TaskActions {
  const unavailable = (label: string, description: string, requiredRole: RequiredTaskRole) =>
    buildAction(false, label, description, requiredRole, reason)

  return {
    canFund: false,
    canCancel: false,
    canAccept: false,
    canSubmitProof: false,
    canRelease: false,
    canDispute: false,
    canResolve: false,
    fund: unavailable('Fund Task', 'Transfer payment into escrow.', 'requester'),
    cancel: unavailable('Cancel Task', 'Cancel an unaccepted task after its deadline.', 'requester'),
    accept: unavailable('Accept Task', 'Accept a funded task as the designated operator.', 'operator'),
    submitProof: unavailable('Submit Proof', 'Submit proof before the task deadline.', 'operator'),
    release: unavailable('Release Payment', 'Release submitted work while the dispute window is open.', 'requester'),
    dispute: unavailable('Raise Dispute', 'Dispute submitted work while the dispute window is open.', 'requester'),
    resolve: unavailable('Resolve Dispute', 'Resolve a disputed task as contract owner.', 'owner'),
    statusMessage: reason,
  }
}

/**
 * Hook to compute available actions based on task status and user role
 */
export function useTaskActions(
  task: Task | null,
  role: TaskRole,
  isOwner = false
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
      return emptyActions('Task data is not loaded yet.')
    }

    const { status } = task
    const isRequester = role === 'requester'
    const isOperator = role === 'operator'
    const now = Math.floor(Date.now() / 1000)
    const deadline = Number(task.deadline)
    const isDeadlinePassed = now > deadline
    const isSubmissionDeadlineOpen = now <= deadline

    const canFund = status === TaskStatus.Created && isRequester
    const canCancel =
      (status === TaskStatus.Created || status === TaskStatus.Funded) &&
      isRequester &&
      isDeadlinePassed
    const canAccept = status === TaskStatus.Funded && isOperator
    const canSubmitProof =
      status === TaskStatus.Accepted && isOperator && isSubmissionDeadlineOpen
    const canRelease =
      status === TaskStatus.Submitted &&
      isRequester &&
      isDisputeWindowActive &&
      !disputeWindowLoading
    const canDispute =
      status === TaskStatus.Submitted &&
      isRequester &&
      isDisputeWindowActive &&
      !disputeWindowLoading
    const canResolve = status === TaskStatus.Disputed && isOwner

    const fundReason =
      status !== TaskStatus.Created
        ? 'Task must be in Created status before it can be funded.'
        : !isRequester
        ? 'Only the requester can fund this task.'
        : undefined

    const cancelReason =
      status !== TaskStatus.Created && status !== TaskStatus.Funded
        ? 'Only Created or Funded tasks can be cancelled before acceptance.'
        : !isRequester
        ? 'Only the requester can cancel this task.'
        : !isDeadlinePassed
        ? 'Cancellation is only available after the deadline. Based on local time; the contract enforces final validity.'
        : undefined

    const acceptReason =
      status !== TaskStatus.Funded
        ? 'Task must be Funded before the operator can accept.'
        : !isOperator
        ? 'Only the designated operator can accept this task.'
        : undefined

    const submitReason =
      status !== TaskStatus.Accepted
        ? 'Operator must accept before proof can be submitted.'
        : !isOperator
        ? 'Only the designated operator can submit proof.'
        : !isSubmissionDeadlineOpen
        ? 'The proof submission deadline has passed. Based on local time; the contract enforces final validity.'
        : undefined

    const releaseReason =
      status !== TaskStatus.Submitted
        ? 'Task must be Submitted before funds can be released.'
        : !isRequester
        ? 'Only the requester can release funds.'
        : disputeWindowLoading
        ? 'Checking the dispute window before enabling release.'
        : !isDisputeWindowActive
        ? 'The dispute window has expired; the contract no longer allows release.'
        : undefined

    const disputeReason =
      status !== TaskStatus.Submitted
        ? 'Task must be Submitted before it can be disputed.'
        : !isRequester
        ? 'Only the requester can raise a dispute.'
        : disputeWindowLoading
        ? 'Checking the dispute window before enabling dispute.'
        : !isDisputeWindowActive
        ? 'The dispute window has expired; the contract no longer allows disputes.'
        : undefined

    const resolveReason =
      status !== TaskStatus.Disputed
        ? 'Task must be Disputed before it can be resolved.'
        : !isOwner
        ? 'Only the contract owner can resolve disputes.'
        : undefined

    const statusMessage = (() => {
      switch (status) {
        case TaskStatus.Created:
          if (isRequester && !isDeadlinePassed) {
            return 'You can fund this task now. Cancellation unlocks only after the deadline.'
          }
          if (isRequester && isDeadlinePassed) {
            return 'You can fund or cancel this unaccepted task. The contract checks the final deadline.'
          }
          return 'Only the requester can fund or cancel this task.'
        case TaskStatus.Funded:
          if (isOperator) {
            return 'You can accept this funded task. A bond approval is required when the bond is greater than zero.'
          }
          if (isRequester && !isDeadlinePassed) {
            return 'Waiting for the operator to accept. The requester can cancel only after the deadline.'
          }
          if (isRequester && isDeadlinePassed) {
            return 'The operator has not accepted before the deadline; the requester can cancel for a refund.'
          }
          return 'Only the operator can accept; only the requester can cancel after the deadline.'
        case TaskStatus.Accepted:
          if (isOperator && isSubmissionDeadlineOpen) {
            return 'You can submit proof before the task deadline.'
          }
          if (isOperator && !isSubmissionDeadlineOpen) {
            return 'The proof submission deadline has passed; the contract will reject proof submission.'
          }
          return 'Waiting for operator proof. Requester actions become available after proof submission.'
        case TaskStatus.Submitted:
          if (isRequester && isDisputeWindowActive) {
            return 'You can release payment or raise a dispute while the dispute window is open.'
          }
          if (isRequester && !isDisputeWindowActive) {
            return 'The dispute window has expired; the contract no longer allows release or dispute.'
          }
          return 'Only the requester can release funds or dispute while the dispute window is open.'
        case TaskStatus.Disputed:
          return isOwner
            ? 'As contract owner, you can resolve this dispute.'
            : 'Only the contract owner can resolve disputes.'
        case TaskStatus.Released:
          return 'Task completed and payment released.'
        case TaskStatus.Cancelled:
          return 'Task was cancelled.'
        case TaskStatus.Resolved:
          return 'Dispute was resolved by the contract owner.'
        default:
          return 'No actions available for this task status.'
      }
    })()

    return {
      canFund,
      canCancel,
      canAccept,
      canSubmitProof,
      canRelease,
      canDispute,
      canResolve,
      fund: buildAction(
        canFund,
        'Fund Task',
        'Requester transfers payment into escrow.',
        'requester',
        fundReason
      ),
      cancel: buildAction(
        canCancel,
        'Cancel Task',
        'Requester cancels a Created or Funded task after the deadline.',
        'requester',
        cancelReason
      ),
      accept: buildAction(
        canAccept,
        'Accept Task',
        'Designated operator accepts the funded task and posts bond if required.',
        'operator',
        acceptReason
      ),
      submitProof: buildAction(
        canSubmitProof,
        'Submit Proof',
        'Designated operator submits proof before the task deadline.',
        'operator',
        submitReason
      ),
      release: buildAction(
        canRelease,
        'Release Payment',
        'Requester accepts submitted proof and releases payment while the dispute window is open.',
        'requester',
        releaseReason
      ),
      dispute: buildAction(
        canDispute,
        'Raise Dispute',
        'Requester disputes submitted proof while the dispute window is open.',
        'requester',
        disputeReason
      ),
      resolve: buildAction(
        canResolve,
        'Resolve Dispute',
        'Contract owner resolves a disputed task.',
        'owner',
        resolveReason
      ),
      statusMessage,
    }
  }, [task, role, isOwner, isDisputeWindowActive, disputeWindowLoading])

  return {
    ...actions,
    isDisputeWindowActive,
    disputeWindowLoading,
    isDeadlinePassed: task ? Math.floor(Date.now() / 1000) > Number(task.deadline) : false,
    isSubmissionDeadlineOpen: task
      ? Math.floor(Date.now() / 1000) <= Number(task.deadline)
      : false,
  }
}
