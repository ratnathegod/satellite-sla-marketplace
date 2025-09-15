'use client'

import { useState } from 'react'
import { toast } from 'react-hot-toast'

interface TxButtonProps {
  onClick: () => Promise<void>
  children: React.ReactNode
  disabled?: boolean
  className?: string
  variant?: 'primary' | 'secondary' | 'danger'
}

export function TxButton({ 
  onClick, 
  children, 
  disabled = false, 
  className = '',
  variant = 'primary'
}: TxButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    if (isLoading || disabled) return

    setIsLoading(true)
    try {
      await onClick()
      toast.success('Transaction successful!')
    } catch (error: any) {
      console.error('Transaction failed:', error)
      toast.error(error?.message || 'Transaction failed')
    } finally {
      setIsLoading(false)
    }
  }

  const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700'
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading || disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {isLoading ? (
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span>Processing...</span>
        </div>
      ) : (
        children
      )}
    </button>
  )
}