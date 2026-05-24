'use client'

import { useMemo } from 'react'
import { useAccount } from 'wagmi'
import { type Task, type TaskRole } from '@/lib/types'

interface UseTaskRoleReturn {
  role: TaskRole
  isRequester: boolean
  isOperator: boolean
}

/**
 * Hook to determine the connected wallet's role relative to a task
 */
export function useTaskRole(task: Task | null): UseTaskRoleReturn {
  const { address } = useAccount()

  return useMemo(() => {
    if (!task || !address) {
      return {
        role: 'none' as TaskRole,
        isRequester: false,
        isOperator: false,
      }
    }

    const normalizedAddress = address.toLowerCase()
    const isRequester = task.requester.toLowerCase() === normalizedAddress
    const isOperator = task.operator.toLowerCase() === normalizedAddress

    let role: TaskRole = 'none'
    if (isRequester) role = 'requester'
    else if (isOperator) role = 'operator'

    return {
      role,
      isRequester,
      isOperator,
    }
  }, [task, address])
}
