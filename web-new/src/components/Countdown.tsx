'use client'

import { useEffect, useState } from 'react'
import { formatTimeRemaining } from '@/lib/format'
import { Clock } from 'lucide-react'

interface CountdownProps {
  deadline: bigint
  label?: string
  className?: string
}

export function Countdown({ deadline, label = 'Time remaining', className = '' }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState('')
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    const updateCountdown = () => {
      const remaining = formatTimeRemaining(deadline)
      setTimeLeft(remaining)
      setIsExpired(remaining === 'Expired')
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [deadline])

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Clock className={`h-4 w-4 ${isExpired ? 'text-destructive' : 'text-muted-foreground'}`} />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-sm font-medium ${isExpired ? 'text-destructive' : 'text-foreground'}`}>
          {timeLeft}
        </p>
      </div>
    </div>
  )
}
