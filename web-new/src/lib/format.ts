import { type Address } from 'viem'
import { formatEther, formatUnits } from 'viem'

// Format address to short version
export function shortenAddress(address: Address, chars = 4): string {
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`
}

// Format token amount
export function formatTokenAmount(amount: bigint, decimals = 18, maxDecimals = 4): string {
  const formatted = formatUnits(amount, decimals)
  const num = parseFloat(formatted)
  
  if (num === 0) return '0'
  if (num < 0.0001) return '< 0.0001'
  
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  })
}

// Format ETH/native token
export function formatEth(amount: bigint, maxDecimals = 4): string {
  return formatTokenAmount(amount, 18, maxDecimals)
}

// Format timestamp to readable date
export function formatDate(timestamp: bigint | number): string {
  const ms = typeof timestamp === 'bigint' ? Number(timestamp) * 1000 : timestamp * 1000
  return new Date(ms).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Format time remaining
export function formatTimeRemaining(deadline: bigint): string {
  const now = Math.floor(Date.now() / 1000)
  const diff = Number(deadline) - now
  
  if (diff <= 0) return 'Expired'
  
  const days = Math.floor(diff / 86400)
  const hours = Math.floor((diff % 86400) / 3600)
  const minutes = Math.floor((diff % 3600) / 60)
  
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

// Copy to clipboard
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    return false
  }
}

// Format duration in seconds to readable string
export function formatDuration(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''}`
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`
  
  const minutes = Math.floor(seconds / 60)
  return `${minutes} minute${minutes > 1 ? 's' : ''}`
}
