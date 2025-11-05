'use client'

import { useState } from 'react'
import { type Address as AddressType } from 'viem'
import { Copy, Check } from 'lucide-react'
import { copyToClipboard, shortenAddress } from '@/lib/format'

interface AddressProps {
  address: AddressType
  shorten?: boolean
  showCopy?: boolean
  className?: string
}

export function Address({ address, shorten = true, showCopy = true, className = '' }: AddressProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const success = await copyToClipboard(address)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const displayAddress = shorten ? shortenAddress(address) : address

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <code className="rounded bg-muted px-2 py-1 text-sm font-mono">
        {displayAddress}
      </code>
      {showCopy && (
        <button
          onClick={handleCopy}
          className="text-muted-foreground hover:text-foreground transition-colors"
          title="Copy address"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </button>
      )}
    </div>
  )
}
