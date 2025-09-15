'use client'

import Link from 'next/link'
import { Header } from '@/components/Header'
import { useEffect, useState } from 'react'
import { publicClient, getEscrowContract, loadContractAddress, getChainInfo } from '@/lib/viem'
import { Address } from '@/components/Address'
import type { Address as AddressType } from 'viem'

interface ContractInfo {
  chainId: number
  blockNumber: bigint
  escrowAddress: AddressType | null
  owner: AddressType | null
  taskCount: bigint
  loading: boolean
  error: string | null
}

export default function Home() {
  const [contractInfo, setContractInfo] = useState<ContractInfo>({
    chainId: 0,
    blockNumber: 0n,
    escrowAddress: null,
    owner: null,
    taskCount: 0n,
    loading: true,
    error: null,
  })

  useEffect(() => {
    async function loadContractInfo() {
      try {
        const { chainId } = getChainInfo()
        const blockNumber = await publicClient.getBlockNumber()
        const escrowAddress = await loadContractAddress('escrow')
        
        if (!escrowAddress) {
          setContractInfo(prev => ({
            ...prev,
            chainId,
            blockNumber,
            loading: false,
            error: 'Escrow contract not deployed. Run `make deploy-local` first.',
          }))
          return
        }

        const escrow = await getEscrowContract()
        const owner = await escrow.read.owner() as AddressType
        const taskCount = await escrow.read.taskCounter() as bigint

        setContractInfo({
          chainId,
          blockNumber,
          escrowAddress,
          owner,
          taskCount,
          loading: false,
          error: null,
        })
      } catch (error) {
        console.error('Error loading contract info:', error)
        setContractInfo(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }))
      }
    }

    loadContractInfo()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Satellite Tasking Marketplace
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Decentralized satellite task management with verifiable SLAs
          </p>
        </div>

        {/* Contract Info Dashboard */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-semibold mb-4">Contract Status</h2>
          
          {contractInfo.loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading contract info...</p>
            </div>
          ) : contractInfo.error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{contractInfo.error}</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Network Info</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">Chain ID:</span>
                    <span className="ml-2 font-mono">{contractInfo.chainId}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Block Number:</span>
                    <span className="ml-2 font-mono">{contractInfo.blockNumber.toString()}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Contract Info</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">Escrow Address:</span>
                    <div className="mt-1">
                      {contractInfo.escrowAddress && (
                        <Address address={contractInfo.escrowAddress} />
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Owner:</span>
                    <div className="mt-1">
                      {contractInfo.owner && (
                        <Address address={contractInfo.owner} />
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Tasks:</span>
                    <span className="ml-2 font-mono">{contractInfo.taskCount.toString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Create New Task</h2>
            <p className="text-gray-600 mb-4">
              Submit a new satellite imaging or data collection task with escrow protection.
            </p>
            <Link
              href="/new-task"
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Task
            </Link>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">View Events</h2>
            <p className="text-gray-600 mb-4">
              Browse all contract events and transaction history.
            </p>
            <Link
              href="/events"
              className="inline-block bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              View Events
            </Link>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Task Details</h2>
            <p className="text-gray-600 mb-4">
              View detailed information about a specific task.
            </p>
            <Link
              href="/task/1"
              className="inline-block bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              View Task #1
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}