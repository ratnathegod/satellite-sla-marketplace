'use client'

import { Header } from '@/components/Header'
import { useEffect, useState } from 'react'
import { publicClient, loadContractAddress, loadContractABI } from '@/lib/viem'
import { Address } from '@/components/Address'
import type { Address as AddressType, Log } from 'viem'

interface EventLog {
  blockNumber: bigint
  transactionHash: string
  eventName: string
  taskId?: bigint
  args: Record<string, any>
}

interface EventsPageState {
  events: EventLog[]
  loading: boolean
  error: string | null
  escrowAddress: AddressType | null
}

export default function EventsPage() {
  const [state, setState] = useState<EventsPageState>({
    events: [],
    loading: true,
    error: null,
    escrowAddress: null,
  })

  useEffect(() => {
    async function loadEvents() {
      try {
        const escrowAddress = await loadContractAddress('escrow')
        
        if (!escrowAddress) {
          setState(prev => ({
            ...prev,
            loading: false,
            error: 'Escrow contract not deployed. Run `make deploy-local` first.',
          }))
          return
        }

        const abi = await loadContractABI('Escrow')
        if (!abi) {
          setState(prev => ({
            ...prev,
            loading: false,
            error: 'Failed to load Escrow ABI.',
          }))
          return
        }

        // Get current block number
        const currentBlock = await publicClient.getBlockNumber()
        const fromBlock = currentBlock > 1000n ? currentBlock - 1000n : 0n

        // Get all logs for the contract
        const logs = await publicClient.getLogs({
          address: escrowAddress,
          fromBlock,
          toBlock: 'latest',
        })

        // Parse events
        const eventLogs: EventLog[] = []
        
        for (const log of logs) {
          try {
            // Try to decode the log using the ABI
            const decodedLog = publicClient.decodeEventLog({
              abi,
              data: log.data,
              topics: log.topics,
            })

            const eventLog: EventLog = {
              blockNumber: log.blockNumber!,
              transactionHash: log.transactionHash!,
              eventName: decodedLog.eventName,
              args: decodedLog.args as Record<string, any>,
            }

            // Extract taskId if present in args
            if (decodedLog.args && typeof decodedLog.args === 'object') {
              const args = decodedLog.args as Record<string, any>
              if ('taskId' in args) {
                eventLog.taskId = args.taskId as bigint
              }
            }

            eventLogs.push(eventLog)
          } catch (decodeError) {
            console.warn('Failed to decode log:', decodeError)
            // Add as unknown event
            eventLogs.push({
              blockNumber: log.blockNumber!,
              transactionHash: log.transactionHash!,
              eventName: 'Unknown',
              args: {},
            })
          }
        }

        // Sort by block number (newest first)
        eventLogs.sort((a, b) => Number(b.blockNumber - a.blockNumber))

        setState({
          events: eventLogs,
          loading: false,
          error: null,
          escrowAddress,
        })
      } catch (error) {
        console.error('Error loading events:', error)
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }))
      }
    }

    loadEvents()
  }, [])

  const getEventColor = (eventName: string) => {
    switch (eventName) {
      case 'TaskCreated':
        return 'bg-blue-100 text-blue-800'
      case 'TaskFunded':
        return 'bg-green-100 text-green-800'
      case 'TaskAccepted':
        return 'bg-yellow-100 text-yellow-800'
      case 'ProofSubmitted':
        return 'bg-purple-100 text-purple-800'
      case 'TaskReleased':
        return 'bg-green-100 text-green-800'
      case 'TaskDisputed':
        return 'bg-red-100 text-red-800'
      case 'TaskResolved':
        return 'bg-indigo-100 text-indigo-800'
      case 'TaskCancelled':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatArgValue = (key: string, value: any) => {
    if (typeof value === 'bigint') {
      if (key === 'taskId' || key === 'amount') {
        return value.toString()
      }
      // For timestamps, convert to readable date
      if (key.includes('deadline') || key.includes('Deadline')) {
        return new Date(Number(value) * 1000).toLocaleString()
      }
      return value.toString()
    }
    if (typeof value === 'string' && value.startsWith('0x') && value.length === 42) {
      return value // Address
    }
    return String(value)
  }

  const isAddress = (value: any): value is AddressType => {
    return typeof value === 'string' && value.startsWith('0x') && value.length === 42
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Contract Events
            </h1>
            {state.escrowAddress && (
              <div className="text-sm text-gray-600">
                <span>Contract: </span>
                <Address address={state.escrowAddress} />
              </div>
            )}
          </div>
          
          {state.loading ? (
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading events...</p>
            </div>
          ) : state.error ? (
            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">{state.error}</p>
              </div>
            </div>
          ) : state.events.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <p className="text-gray-600">No events found. Try creating and funding a task first.</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Block
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Transaction
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Event
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Task ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {state.events.map((event, index) => (
                      <tr key={`${event.transactionHash}-${index}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                          {event.blockNumber.toString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                          <a
                            href={`https://etherscan.io/tx/${event.transactionHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                            title={event.transactionHash}
                          >
                            {event.transactionHash.slice(0, 10)}...
                          </a>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEventColor(event.eventName)}`}>
                            {event.eventName}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {event.taskId ? (
                            <a
                              href={`/task/${event.taskId.toString()}`}
                              className="text-blue-600 hover:text-blue-800 font-mono"
                            >
                              #{event.taskId.toString()}
                            </a>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="space-y-1">
                            {Object.entries(event.args).map(([key, value]) => (
                              <div key={key} className="flex items-center gap-2">
                                <span className="text-gray-600 text-xs">{key}:</span>
                                {isAddress(value) ? (
                                  <Address address={value} shorten={true} showCopy={false} />
                                ) : (
                                  <span className="font-mono text-xs">
                                    {formatArgValue(key, value)}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="bg-gray-50 px-6 py-3 text-sm text-gray-600">
                Showing {state.events.length} events from the last 1000 blocks
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}