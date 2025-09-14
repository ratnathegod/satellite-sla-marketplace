'use client'

import Link from 'next/link'
import { ConnectButton } from '@rainbow-me/rainbowkit'

export function Header() {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              SatMarket
            </Link>
            
            <nav className="hidden md:flex space-x-6">
              <Link 
                href="/" 
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Home
              </Link>
              <Link 
                href="/new-task" 
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Create Task
              </Link>
              <Link 
                href="/tasks" 
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Browse Tasks
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <ConnectButton />
          </div>
        </div>
      </div>
    </header>
  )
}