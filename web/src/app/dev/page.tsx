'use client'

import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { useState, useEffect } from 'react'
import { Header } from '@/components/Header'
import { TxButton } from '@/components/TxButton'
import { getMockERC20Contract, getEscrowContract, MOCK_ERC20_ADDRESS, ESCROW_ADDRESS } from '@/lib/contracts'

export default function DevPage() {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const [balance, setBalance] = useState<string>('0')
  const [allowance, setAllowance] = useState<string>('0')

  useEffect(() => {
    if (isConnected && address && publicClient) {
      loadBalanceAndAllowance()
    }
  }, [isConnected, address, publicClient])

  const loadBalanceAndAllowance = async () => {
    if (!publicClient || !address) return

    try {
      const mockERC20 = getMockERC20Contract(publicClient)
      
      const [balanceResult, allowanceResult] = await Promise.all([
        mockERC20.read.balanceOf([address]),
        mockERC20.read.allowance([address, ESCROW_ADDRESS])
      ])

      setBalance(formatEther(balanceResult as bigint))
      setAllowance(formatEther(allowanceResult as bigint))
    } catch (error) {
      console.error('Failed to load balance/allowance:', error)
    }
  }

  const handleMint = async () => {
    if (!walletClient || !address) throw new Error('Wallet not connected')

    const mockERC20 = getMockERC20Contract(walletClient)
    const amount = parseEther('1000') // Mint 1000 TEST tokens

    const hash = await mockERC20.write.mint([address, amount])
    console.log('Mint transaction:', hash)
    
    // Refresh balance after successful mint
    setTimeout(loadBalanceAndAllowance, 2000)
  }

  const handleApprove = async () => {
    if (!walletClient) throw new Error('Wallet not connected')

    const mockERC20 = getMockERC20Contract(walletClient)
    const maxAmount = parseEther('1000000') // Approve a large amount

    const hash = await mockERC20.write.approve([ESCROW_ADDRESS, maxAmount])
    console.log('Approve transaction:', hash)
    
    // Refresh allowance after successful approval
    setTimeout(loadBalanceAndAllowance, 2000)
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Development Tools</h1>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600">Please connect your wallet to use development tools.</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Development Tools</h1>
          
          <div className="space-y-6">
            {/* Token Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Token Information</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">MockERC20 Address:</span>
                  <span className="font-mono text-xs">{MOCK_ERC20_ADDRESS}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Escrow Address:</span>
                  <span className="font-mono text-xs">{ESCROW_ADDRESS}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Your Balance:</span>
                  <span className="font-medium">{balance} TEST</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Escrow Allowance:</span>
                  <span className="font-medium">{allowance} TEST</span>
                </div>
              </div>
            </div>

            {/* Mint Tokens */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Mint Test Tokens</h2>
              <p className="text-gray-600 mb-4">
                Mint 1,000 TEST tokens to your wallet for testing purposes.
              </p>
              <TxButton onClick={handleMint}>
                Mint 1,000 TEST to me
              </TxButton>
            </div>

            {/* Approve Escrow */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Approve Escrow</h2>
              <p className="text-gray-600 mb-4">
                Approve the Escrow contract to spend your TEST tokens for creating and funding tasks.
              </p>
              <TxButton onClick={handleApprove}>
                Approve Escrow for unlimited TEST
              </TxButton>
            </div>

            {/* Refresh */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Refresh Data</h2>
              <p className="text-gray-600 mb-4">
                Manually refresh your token balance and allowance.
              </p>
              <button
                onClick={loadBalanceAndAllowance}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}