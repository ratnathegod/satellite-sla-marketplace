'use client'

import { WalletProvider } from '@/providers/wallet'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WalletProvider>
      {children}
    </WalletProvider>
  )
}