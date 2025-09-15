'use client'

import { useState } from 'react'
import { useAccount, useWalletClient } from 'wagmi'
import { parseEther } from 'viem'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { TxButton } from '@/components/TxButton'
import { FileDrop } from '@/components/FileDrop'
import { getEscrowContract } from '@/lib/contracts'
import { addJSON } from '@/lib/ipfs'

interface TaskFormData {
  title: string
  description: string
  latitude: string
  longitude: string
  deadline: string
  budget: string
}

export default function NewTask() {
  const { isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()
  const router = useRouter()
  
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    latitude: '',
    longitude: '',
    deadline: '',
    budget: ''
  })
  
  const [requirementsFile, setRequirementsFile] = useState<File | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleCreateTask = async () => {
    if (!walletClient) throw new Error('Wallet not connected')
    
    // Validate form
    if (!formData.title || !formData.description || !formData.budget) {
      throw new Error('Please fill in all required fields')
    }

    // Create task manifest
    const taskManifest = {
      title: formData.title,
      description: formData.description,
      coordinates: {
        latitude: parseFloat(formData.latitude) || 0,
        longitude: parseFloat(formData.longitude) || 0
      },
      deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,
      budget: formData.budget,
      createdAt: new Date().toISOString(),
      requirements: requirementsFile ? {
        filename: requirementsFile.name,
        size: requirementsFile.size,
        type: requirementsFile.type
      } : null
    }

    // Upload manifest to IPFS
    const manifestCid = await addJSON(taskManifest)
    console.log('Task manifest uploaded to IPFS:', manifestCid)

    // Create task on-chain
    const escrow = getEscrowContract(walletClient)
    const budgetWei = parseEther(formData.budget)
    const deadlineTimestamp = formData.deadline 
      ? Math.floor(new Date(formData.deadline).getTime() / 1000)
      : Math.floor(Date.now() / 1000) + 86400 * 7 // Default to 7 days from now

    const hash = await escrow.write.createTask([
      manifestCid,
      budgetWei,
      BigInt(deadlineTimestamp)
    ])

    console.log('Create task transaction:', hash)
    
    // Redirect to tasks page after successful creation
    setTimeout(() => {
      router.push('/tasks')
    }, 2000)
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Create New Satellite Task</h1>
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-gray-600">Please connect your wallet to create a new task.</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Create New Satellite Task</h1>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Task Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., High-resolution imaging of agricultural area"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Detailed description of the satellite task requirements..."
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 mb-2">
                    Latitude
                  </label>
                  <input
                    type="number"
                    id="latitude"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleInputChange}
                    step="0.000001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 40.7128"
                  />
                </div>
                
                <div>
                  <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 mb-2">
                    Longitude
                  </label>
                  <input
                    type="number"
                    id="longitude"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleInputChange}
                    step="0.000001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., -74.0060"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-2">
                  Deadline
                </label>
                <input
                  type="datetime-local"
                  id="deadline"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-2">
                  Budget (TEST tokens) *
                </label>
                <input
                  type="number"
                  id="budget"
                  name="budget"
                  value={formData.budget}
                  onChange={handleInputChange}
                  step="0.001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Requirements Document (Optional)
                </label>
                <FileDrop
                  onFileSelect={setRequirementsFile}
                  accept=".pdf,.doc,.docx,.txt"
                  maxSize={5 * 1024 * 1024} // 5MB
                />
              </div>

              <div className="border-t pt-6">
                <TxButton onClick={handleCreateTask} className="w-full">
                  Create Task & Upload to IPFS
                </TxButton>
                <p className="text-sm text-gray-500 mt-2">
                  This will create the task manifest, upload it to IPFS, and create the task on-chain.
                  Make sure you have approved the Escrow contract to spend your TEST tokens.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}