'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAccount, usePublicClient } from 'wagmi'
import { type Address } from 'viem'
import { getEscrowContract } from '@/lib/contracts'
import { type Task, type TaskRole } from '@/lib/types'

interface UseTaskRoleReturn {
  role: TaskRole
  isRequester: boolean
  isOperator: boolean
  isOwner: boolean
  ownerAddress: Address | null
  ownerLoading: boolean
}

/**
 * Hook to determine the connected wallet's role relative to a task
 */
export function useTaskRole(task: Task | null): UseTaskRoleReturn {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const [ownerAddress, setOwnerAddress] = useState<Address | null>(null)
  const [ownerLoading, setOwnerLoading] = useState(false)

  useEffect(() => {
    async function loadOwner() {
      if (!publicClient) {
        setOwnerAddress(null)
        return
      }

      try {
        setOwnerLoading(true)
        const escrow = await getEscrowContract(publicClient)
        setOwnerAddress(await escrow.read.owner())
      } catch (error) {
        console.warn('Failed to load escrow owner:', error)
        setOwnerAddress(null)
      } finally {
        setOwnerLoading(false)
      }
    }

    loadOwner()
  }, [publicClient])

  return useMemo(() => {
    if (!address) {
      return {
        role: 'none' as TaskRole,
        isRequester: false,
        isOperator: false,
        isOwner: false,
        ownerAddress,
        ownerLoading,
      }
    }

    const normalizedAddress = address.toLowerCase()
    const isRequester = task?.requester.toLowerCase() === normalizedAddress
    const isOperator = task?.operator.toLowerCase() === normalizedAddress
    const isOwner = ownerAddress?.toLowerCase() === normalizedAddress

    let role: TaskRole = 'none'
    if (isRequester) role = 'requester'
    else if (isOperator) role = 'operator'
    else if (isOwner) role = 'owner'

    return {
      role,
      isRequester,
      isOperator,
      isOwner,
      ownerAddress,
      ownerLoading,
    }
  }, [task, address, ownerAddress, ownerLoading])
}
