'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Rocket, FileText, Activity, Database } from 'lucide-react'
import { AnimatedBackground } from '@/components/AnimatedBackground'
import { StatCard } from '@/components/StatCard'
import { Address } from '@/components/Address'
import { getEscrowContract } from '@/lib/contracts'
import { publicClient, getChainInfo } from '@/lib/viem'
import { type Address as AddressType } from 'viem'

interface ContractData {
  chainId: number
  escrowAddress: AddressType | null
  owner: AddressType | null
  totalTasks: number
  loading: boolean
}

export default function Home() {
  const [data, setData] = useState<ContractData>({
    chainId: 0,
    escrowAddress: null,
    owner: null,
    totalTasks: 0,
    loading: true,
  })

  useEffect(() => {
    async function loadData() {
      try {
        const { chainId } = getChainInfo()
        const escrow = await getEscrowContract(publicClient)
        const escrowAddress = escrow.address as AddressType
        const [owner, nextTaskId] = await Promise.all([
          escrow.read.owner(),
          escrow.read.nextTaskId(),
        ])

        setData({
          chainId,
          escrowAddress,
          owner: owner as AddressType,
          totalTasks: Number(nextTaskId),
          loading: false,
        })
      } catch (error) {
        console.error('Error loading contract data:', error)
        setData((prev) => ({ ...prev, loading: false }))
      }
    }

    loadData()
  }, [])

  return (
    <>
      <AnimatedBackground />
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mx-auto max-w-4xl text-center mb-16"
        >
          <h1 className="mb-6 text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            <span className="bg-gradient-to-r from-primary via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Satellite SLA
            </span>
            <br />
            Marketplace
          </h1>
          <p className="mb-8 text-xl text-muted-foreground max-w-2xl mx-auto">
            Decentralized satellite tasking with verifiable Service Level Agreements. 
            Create tasks, lock escrow, verify completion—all on-chain.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/new-task">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-8 py-3 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
              >
                <Rocket className="h-4 w-4" />
                Create Task
              </motion.button>
            </Link>
            <Link href="/tasks">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-input bg-background px-8 py-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <Database className="h-4 w-4" />
                Browse Tasks
              </motion.button>
            </Link>
            <Link href="/events">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-input bg-background px-8 py-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <Activity className="h-4 w-4" />
                Events
              </motion.button>
            </Link>
          </div>
        </motion.div>

        {/* Stats Section */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12">
          <StatCard
            title="Total Tasks"
            value={data.totalTasks}
            icon={FileText}
            loading={data.loading}
          />
          <StatCard
            title="Network"
            value={data.chainId || '—'}
            icon={Activity}
            description="Chain ID"
            loading={data.loading}
          />
          <div className="col-span-2">
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-medium text-muted-foreground">Contract Information</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Escrow Contract</p>
                  {data.loading ? (
                    <div className="h-6 w-full animate-pulse rounded bg-muted" />
                  ) : data.escrowAddress ? (
                    <Address address={data.escrowAddress} />
                  ) : (
                    <p className="text-sm text-destructive">Not deployed</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Contract Owner</p>
                  {data.loading ? (
                    <div className="h-6 w-full animate-pulse rounded bg-muted" />
                  ) : data.owner ? (
                    <Address address={data.owner} />
                  ) : (
                    <p className="text-sm text-destructive">Unknown</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="mx-auto max-w-4xl"
        >
          <h2 className="mb-8 text-center text-3xl font-bold">How It Works</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3">
                <Rocket className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">1. Create Task</h3>
              <p className="text-sm text-muted-foreground">
                Define requirements, set budget, choose operator, and lock funds in escrow.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3">
                <Database className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">2. Execute & Verify</h3>
              <p className="text-sm text-muted-foreground">
                Operator completes task, uploads proof to IPFS, and submits attestation on-chain.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">3. Release Payment</h3>
              <p className="text-sm text-muted-foreground">
                Requester reviews proof and releases payment, or disputes within the window.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  )
}
