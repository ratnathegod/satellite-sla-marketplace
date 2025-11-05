'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TxButtonProps {
  onClick: () => Promise<void>
  children: React.ReactNode
  disabled?: boolean
  className?: string
  variant?: 'default' | 'destructive' | 'outline' | 'secondary'
}

export function TxButton({
  onClick,
  children,
  disabled = false,
  className = '',
  variant = 'default',
}: TxButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    if (isLoading || disabled) return

    setIsLoading(true)
    const loadingToast = toast.loading('Transaction pending...')
    
    try {
      await onClick()
      toast.success('Transaction successful!', { id: loadingToast })
    } catch (error: any) {
      console.error('Transaction error:', error)
      const message = error?.message || error?.shortMessage || 'Transaction failed'
      toast.error(message, { id: loadingToast })
    } finally {
      setIsLoading(false)
    }
  }

  const variantClasses = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading || disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        variantClasses[variant],
        className
      )}
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
}
