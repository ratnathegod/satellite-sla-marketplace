'use client'

import Link from 'next/link'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Satellite } from 'lucide-react'

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center space-x-2">
            <Satellite className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
              SatSLA
            </span>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link
              href="/"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Home
            </Link>
            <Link
              href="/new-task"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Create Task
            </Link>
            <Link
              href="/tasks"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Browse Tasks
            </Link>
            <Link
              href="/events"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Events
            </Link>
            <Link
              href="/dev"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Dev Tools
            </Link>
          </nav>
        </div>
        
        <ConnectButton />
      </div>
    </header>
  )
}
