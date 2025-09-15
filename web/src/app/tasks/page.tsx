'use client'

import { useState, useEffect } from 'react'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import { formatEther } from 'viem'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { TxButton } from '@/components/TxButton'
import { getEscrowContract } from '@/lib/contracts'
import { getIPFSUrl } from '@/lib/ipfs'

interface Task {
  id: string
  requester: string
  operator: string
  metadataCid: string
  budget: bigint
  deadline: bigint
  status: number
  metadata?: {
    title: string
    description: string
    coordinates?: {
      latitude: number
      longitude: number
    }
    createdAt: string
  }
}

const TaskStatus = {
  0: 'Open',
  1: 'Accepted',
  2: 'Completed',
  3: 'Disputed',
  4: 'Released'
}

export default function TasksPage() {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (publicClient) {
      loadTasks()
    }
  }, [publicClient])

  const loadTasks = async () => {
    if (!publicClient) return

    try {
      setLoading(true)
      const escrow = getEscrowContract(publicClient)
      
      // Get task count
      const taskCount = await escrow.read.taskCount()
      const taskPromises = []

      // Load all tasks
      for (let i = 1; i <= Number(taskCount); i++) {
        taskPromises.push(escrow.read.tasks([BigInt(i)]))
      }

      const taskResults = await Promise.all(taskPromises)
      
      // Process tasks and load metadata
      const tasksWithMetadata = await Promise.all(
        taskResults.map(async (task, index) => {
          const taskData: Task = {
            id: (index + 1).toString(),
            requester: task[0] as string,
            operator: task[1] as string,
            metadataCid: task[2] as string,
            budget: task[3] as bigint,
            deadline: task[4] as bigint,
            status: task[5] as number
          }

          // Try to load metadata from IPFS
          try {
            const metadataUrl = getIPFSUrl(taskData.metadataCid)
            const response = await fetch(metadataUrl)
            if (response.ok) {
              taskData.metadata = await response.json()
            }
          } catch (error) {
            console.warn(`Failed to load metadata for task ${taskData.id}:`, error)
          }

          return taskData
        })
      )

      setTasks(tasksWithMetadata)
    } catch (error) {
      console.error('Failed to load tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptTask = async (taskId: string) => {
    if (!walletClient) throw new Error('Wallet not connected')

    const escrow = getEscrowContract(walletClient)
    const hash = await escrow.write.acceptTask([BigInt(taskId)])
    
    console.log('Accept task transaction:', hash)
    
    // Refresh tasks after successful acceptance
    setTimeout(loadTasks, 2000)
  }

  const handleFundTask = async (taskId: string, budget: bigint) => {
    if (!walletClient) throw new Error('Wallet not connected')

    const escrow = getEscrowContract(walletClient)
    const hash = await escrow.write.fundTask([BigInt(taskId), budget])
    
    console.log('Fund task transaction:', hash)
    
    // Refresh tasks after successful funding
    setTimeout(loadTasks, 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading tasks...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Satellite Tasks</h1>
          <Link
            href="/new-task"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Create New Task
          </Link>
        </div>

        {tasks.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 mb-4">No tasks found.</p>
            <Link
              href="/new-task"
              className="text-blue-600 hover:text-blue-800"
            >
              Create the first task
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {tasks.map((task) => (
              <div key={task.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {task.metadata?.title || `Task #${task.id}`}
                    </h3>
                    <p className="text-gray-600 mt-1">
                      {task.metadata?.description || 'No description available'}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      task.status === 0 ? 'bg-green-100 text-green-800' :
                      task.status === 1 ? 'bg-blue-100 text-blue-800' :
                      task.status === 2 ? 'bg-yellow-100 text-yellow-800' :
                      task.status === 3 ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {TaskStatus[task.status as keyof typeof TaskStatus]}
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 text-sm">
                  <div>
                    <span className="text-gray-500">Budget:</span>
                    <div className="font-medium">{formatEther(task.budget)} TEST</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Deadline:</span>
                    <div className="font-medium">
                      {new Date(Number(task.deadline) * 1000).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Requester:</span>
                    <div className="font-mono text-xs">{task.requester.slice(0, 8)}...</div>
                  </div>
                  {task.operator !== '0x0000000000000000000000000000000000000000' && (
                    <div>
                      <span className="text-gray-500">Operator:</span>
                      <div className="font-mono text-xs">{task.operator.slice(0, 8)}...</div>
                    </div>
                  )}
                </div>

                {task.metadata?.coordinates && (
                  <div className="mb-4 text-sm">
                    <span className="text-gray-500">Location:</span>
                    <span className="ml-2">
                      {task.metadata.coordinates.latitude.toFixed(6)}, {task.metadata.coordinates.longitude.toFixed(6)}
                    </span>
                  </div>
                )}

                <div className="flex gap-2">
                  <Link
                    href={`/task/${task.id}`}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    View Details
                  </Link>
                  
                  {isConnected && (
                    <>
                      {/* Accept task (for operators) */}
                      {task.status === 0 && task.requester.toLowerCase() !== address?.toLowerCase() && (
                        <TxButton
                          onClick={() => handleAcceptTask(task.id)}
                          variant="primary"
                        >
                          Accept Task
                        </TxButton>
                      )}
                      
                      {/* Fund task (for requesters) */}
                      {task.status === 1 && task.requester.toLowerCase() === address?.toLowerCase() && (
                        <TxButton
                          onClick={() => handleFundTask(task.id, task.budget)}
                          variant="primary"
                        >
                          Fund Task
                        </TxButton>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}