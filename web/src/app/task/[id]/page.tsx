'use client'

import { useState, useEffect } from 'react'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import { formatEther } from 'viem'
import { useParams } from 'next/navigation'
import { Header } from '@/components/Header'
import { TxButton } from '@/components/TxButton'
import { FileDrop } from '@/components/FileDrop'
import { getEscrowContract } from '@/lib/contracts'
import { getIPFSUrl, addFile } from '@/lib/ipfs'

interface Task {
  id: string
  requester: string
  operator: string
  metadataCid: string
  budget: bigint
  deadline: bigint
  status: number
  proofCid?: string
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

export default function TaskDetailPage() {
  const params = useParams()
  const taskId = params.id as string
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [proofFile, setProofFile] = useState<File | null>(null)

  useEffect(() => {
    if (publicClient && taskId) {
      loadTask()
    }
  }, [publicClient, taskId])

  const loadTask = async () => {
    if (!publicClient || !taskId) return

    try {
      setLoading(true)
      const escrow = getEscrowContract(publicClient)
      
      const taskData = await escrow.read.tasks([BigInt(taskId)])
      
      const task: Task = {
        id: taskId,
        requester: taskData[0] as string,
        operator: taskData[1] as string,
        metadataCid: taskData[2] as string,
        budget: taskData[3] as bigint,
        deadline: taskData[4] as bigint,
        status: taskData[5] as number
      }

      // Try to get proof CID if task is completed
      if (task.status >= 2) {
        try {
          const proofCid = await escrow.read.getTaskProof([BigInt(taskId)])
          if (proofCid && proofCid !== '') {
            task.proofCid = proofCid as string
          }
        } catch (error) {
          console.warn('Failed to load proof CID:', error)
        }
      }

      // Load metadata from IPFS
      try {
        const metadataUrl = getIPFSUrl(task.metadataCid)
        const response = await fetch(metadataUrl)
        if (response.ok) {
          task.metadata = await response.json()
        }
      } catch (error) {
        console.warn('Failed to load metadata:', error)
      }

      setTask(task)
    } catch (error) {
      console.error('Failed to load task:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptTask = async () => {
    if (!walletClient || !task) throw new Error('Wallet not connected or task not loaded')

    const escrow = getEscrowContract(walletClient)
    const hash = await escrow.write.acceptTask([BigInt(task.id)])
    
    console.log('Accept task transaction:', hash)
    setTimeout(loadTask, 2000)
  }

  const handleFundTask = async () => {
    if (!walletClient || !task) throw new Error('Wallet not connected or task not loaded')

    const escrow = getEscrowContract(walletClient)
    const hash = await escrow.write.fundTask([BigInt(task.id), task.budget])
    
    console.log('Fund task transaction:', hash)
    setTimeout(loadTask, 2000)
  }

  const handleSubmitProof = async () => {
    if (!walletClient || !task || !proofFile) throw new Error('Missing requirements for proof submission')

    // Upload proof file to IPFS
    const proofCid = await addFile(proofFile)
    console.log('Proof uploaded to IPFS:', proofCid)

    // Submit proof on-chain
    const escrow = getEscrowContract(walletClient)
    const hash = await escrow.write.submitProof([BigInt(task.id), proofCid])
    
    console.log('Submit proof transaction:', hash)
    setTimeout(loadTask, 2000)
  }

  const handleReleasePayment = async () => {
    if (!walletClient || !task) throw new Error('Wallet not connected or task not loaded')

    const escrow = getEscrowContract(walletClient)
    const hash = await escrow.write.releasePayment([BigInt(task.id)])
    
    console.log('Release payment transaction:', hash)
    setTimeout(loadTask, 2000)
  }

  const handleDispute = async () => {
    if (!walletClient || !task) throw new Error('Wallet not connected or task not loaded')

    const escrow = getEscrowContract(walletClient)
    const hash = await escrow.write.disputeTask([BigInt(task.id)])
    
    console.log('Dispute task transaction:', hash)
    setTimeout(loadTask, 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading task...</p>
          </div>
        </main>
      </div>
    )
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Task Not Found</h1>
            <p className="text-gray-600">The requested task could not be found.</p>
          </div>
        </main>
      </div>
    )
  }

  const isRequester = address?.toLowerCase() === task.requester.toLowerCase()
  const isOperator = address?.toLowerCase() === task.operator.toLowerCase()

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {task.metadata?.title || `Task #${task.id}`}
                </h1>
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

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Task Details</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-500">Description:</span>
                    <p className="mt-1">{task.metadata?.description || 'No description available'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Budget:</span>
                    <span className="ml-2 font-medium">{formatEther(task.budget)} TEST</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Deadline:</span>
                    <span className="ml-2 font-medium">
                      {new Date(Number(task.deadline) * 1000).toLocaleString()}
                    </span>
                  </div>
                  {task.metadata?.coordinates && (
                    <div>
                      <span className="text-gray-500">Location:</span>
                      <span className="ml-2 font-medium">
                        {task.metadata.coordinates.latitude.toFixed(6)}, {task.metadata.coordinates.longitude.toFixed(6)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Participants</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-500">Requester:</span>
                    <div className="font-mono text-xs mt-1">{task.requester}</div>
                    {isRequester && <span className="text-blue-600 text-xs">(You)</span>}
                  </div>
                  {task.operator !== '0x0000000000000000000000000000000000000000' && (
                    <div>
                      <span className="text-gray-500">Operator:</span>
                      <div className="font-mono text-xs mt-1">{task.operator}</div>
                      {isOperator && <span className="text-blue-600 text-xs">(You)</span>}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Proof Section */}
            {task.proofCid && (
              <div className="border-t pt-6 mb-6">
                <h3 className="text-lg font-semibold mb-3">Submitted Proof</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Proof file available on IPFS:</p>
                  <a
                    href={getIPFSUrl(task.proofCid)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm font-mono break-all"
                  >
                    {task.proofCid}
                  </a>
                </div>
              </div>
            )}

            {/* Actions */}
            {isConnected && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Actions</h3>
                <div className="space-y-4">
                  
                  {/* Accept task (for operators) */}
                  {task.status === 0 && !isRequester && (
                    <TxButton onClick={handleAcceptTask} variant="primary">
                      Accept Task
                    </TxButton>
                  )}
                  
                  {/* Fund task (for requesters) */}
                  {task.status === 1 && isRequester && (
                    <TxButton onClick={handleFundTask} variant="primary">
                      Fund Task ({formatEther(task.budget)} TEST)
                    </TxButton>
                  )}
                  
                  {/* Submit proof (for operators) */}
                  {task.status === 1 && isOperator && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Upload Proof of Completion
                        </label>
                        <FileDrop
                          onFileSelect={setProofFile}
                          accept="image/*,.pdf,.zip"
                          maxSize={50 * 1024 * 1024} // 50MB
                        />
                      </div>
                      {proofFile && (
                        <TxButton onClick={handleSubmitProof} variant="primary">
                          Submit Proof to IPFS & Blockchain
                        </TxButton>
                      )}
                    </div>
                  )}
                  
                  {/* Release/Dispute (for requesters) */}
                  {task.status === 2 && isRequester && (
                    <div className="flex gap-4">
                      <TxButton onClick={handleReleasePayment} variant="primary">
                        Release Payment
                      </TxButton>
                      <TxButton onClick={handleDispute} variant="danger">
                        Dispute Task
                      </TxButton>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}