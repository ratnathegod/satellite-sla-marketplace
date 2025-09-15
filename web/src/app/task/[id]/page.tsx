'use client'

import { Header } from '@/components/Header'
import { useEffect, useState } from 'react'
import { getEscrowContract, loadContractAddress, TaskStatus, type TaskStatusType } from '@/lib/viem'
import { Address } from '@/components/Address'
import { StatusBadge } from '@/components/StatusBadge'
import type { Address as AddressType } from 'viem'

interface TaskPageProps {
  params: {
    id: string
  }
}

interface TaskData {
  id: bigint
  customer: AddressType
  operator: AddressType
  paymentToken: AddressType
  amount: bigint
  deadline: bigint
  proofDeadline: bigint
  status: TaskStatusType
  ipfsHash: string
  proofHash: string
  loading: boolean
  error: string | null
  exists: boolean
}

export default function TaskPage({ params }: TaskPageProps) {
  const [taskData, setTaskData] = useState<TaskData>({
    id: 0n,
    customer: '0x0000000000000000000000000000000000000000',
    operator: '0x0000000000000000000000000000000000000000',
    paymentToken: '0x0000000000000000000000000000000000000000',
    amount: 0n,
    deadline: 0n,
    proofDeadline: 0n,
    status: 0,
    ipfsHash: '',
    proofHash: '',
    loading: true,
    error: null,
    exists: false,
  })

  useEffect(() => {
    async function loadTaskData() {
      try {
        const escrowAddress = await loadContractAddress('escrow')
        
        if (!escrowAddress) {
          setTaskData(prev => ({
            ...prev,
            loading: false,
            error: 'Escrow contract not deployed. Run `make deploy-local` first.',
          }))
          return
        }

        const escrow = await getEscrowContract()
        const taskId = BigInt(params.id)
        
        // Check if task exists by getting task counter
        const taskCounter = await escrow.read.taskCounter() as bigint
        
        if (taskId === 0n || taskId > taskCounter) {
          setTaskData(prev => ({
            ...prev,
            loading: false,
            error: `Task #${params.id} does not exist. Current task counter: ${taskCounter.toString()}`,
            exists: false,
          }))
          return
        }

        // Get task data
        const task = await escrow.read.tasks([taskId]) as any[]
        
        setTaskData({
          id: taskId,
          customer: task[0] as AddressType,
          operator: task[1] as AddressType,
          paymentToken: task[2] as AddressType,
          amount: task[3] as bigint,
          deadline: task[4] as bigint,
          proofDeadline: task[5] as bigint,
          status: task[6] as TaskStatusType,
          ipfsHash: task[7] as string,
          proofHash: task[8] as string,
          loading: false,
          error: null,
          exists: true,
        })
      } catch (error) {
        console.error('Error loading task data:', error)
        setTaskData(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }))
      }
    }

    loadTaskData()
  }, [params.id])

  const formatTimestamp = (timestamp: bigint) => {
    if (timestamp === 0n) return 'Not set'
    return new Date(Number(timestamp) * 1000).toLocaleString()
  }

  const formatAmount = (amount: bigint) => {
    // Assuming 18 decimals for ERC20 token
    const divisor = 10n ** 18n
    const whole = amount / divisor
    const fractional = amount % divisor
    return `${whole}.${fractional.toString().padStart(18, '0').slice(0, 6)}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Task #{params.id}
            </h1>
            {taskData.exists && !taskData.loading && (
              <StatusBadge status={taskData.status} />
            )}
          </div>
          
          {taskData.loading ? (
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading task data...</p>
            </div>
          ) : taskData.error ? (
            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">{taskData.error}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Task Overview */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Task Overview</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Participants</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">Customer:</span>
                        <div className="mt-1">
                          <Address address={taskData.customer} />
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Operator:</span>
                        <div className="mt-1">
                          {taskData.operator === '0x0000000000000000000000000000000000000000' ? (
                            <span className="text-gray-500 italic">Not assigned</span>
                          ) : (
                            <Address address={taskData.operator} />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Payment Details</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">Token:</span>
                        <div className="mt-1">
                          <Address address={taskData.paymentToken} />
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Amount:</span>
                        <span className="ml-2 font-mono">{formatAmount(taskData.amount)} tokens</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Deadlines */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Deadlines</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-600">Task Deadline:</span>
                    <div className="mt-1 font-mono text-sm">
                      {formatTimestamp(taskData.deadline)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Proof Deadline:</span>
                    <div className="mt-1 font-mono text-sm">
                      {formatTimestamp(taskData.proofDeadline)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Content & Proofs */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Content & Proofs</h2>
                <div className="space-y-4">
                  <div>
                    <span className="text-gray-600">IPFS Hash (Task Description):</span>
                    <div className="mt-1">
                      {taskData.ipfsHash ? (
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono break-all">
                          {taskData.ipfsHash}
                        </code>
                      ) : (
                        <span className="text-gray-500 italic">Not set</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Proof Hash:</span>
                    <div className="mt-1">
                      {taskData.proofHash ? (
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono break-all">
                          {taskData.proofHash}
                        </code>
                      ) : (
                        <span className="text-gray-500 italic">Not submitted</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Information */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Status Information</h2>
                <div className="flex items-center gap-4">
                  <StatusBadge status={taskData.status} />
                  <span className="text-gray-600">
                    Current status: <strong>{TaskStatus[taskData.status]}</strong>
                  </span>
                </div>
                
                <div className="mt-4 text-sm text-gray-600">
                  <h3 className="font-semibold mb-2">Status Descriptions:</h3>
                  <ul className="space-y-1">
                    <li><strong>Created:</strong> Task has been created but not yet funded</li>
                    <li><strong>Funded:</strong> Customer has deposited payment, waiting for operator</li>
                    <li><strong>Accepted:</strong> Operator has accepted the task</li>
                    <li><strong>Submitted:</strong> Operator has submitted proof of completion</li>
                    <li><strong>Disputed:</strong> Customer has disputed the submitted proof</li>
                    <li><strong>Released:</strong> Payment has been released to operator</li>
                    <li><strong>Cancelled:</strong> Task has been cancelled</li>
                    <li><strong>Resolved:</strong> Dispute has been resolved</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}