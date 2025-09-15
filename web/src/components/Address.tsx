'use client'

import { useState } from 'react'
import { type Address as AddressType } from 'viem'

interface AddressProps {
  address: AddressType
  showCopy?: boolean
  shorten?: boolean
  className?: string
}

export function Address({ address, showCopy = true, shorten = true, className = '' }: AddressProps) {
  const [copied, setCopied] = useState(false)

  const displayAddress = shorten 
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : address

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy address:', error)
    }
  }

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
        {displayAddress}
      </code>
      {showCopy && (
        <button
          onClick={handleCopy}
          className="text-blue-600 hover:text-blue-800 text-sm transition-colors"
          title="Copy address"
        >
          {copied ? '✓' : '📋'}
        </button>
      )}
    </div>
  )
}