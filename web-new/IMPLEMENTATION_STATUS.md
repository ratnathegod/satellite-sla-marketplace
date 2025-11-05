# SatSLA - Satellite SLA Marketplace (New Frontend)

## ✅ What's Been Built

### Core Infrastructure (COMPLETE)
- ✅ Next.js 14 with App Router
- ✅ TypeScript configuration
- ✅ Tailwind CSS with dark theme
- ✅ Package.json with all dependencies (Framer Motion, RainbowKit, Wagmi, Viem, Lottie, etc.)
- ✅ Port 5001 configuration
- ✅ Environment variables (.env.local)

### Library Utilities (COMPLETE)
- ✅ `lib/viem.ts` - Viem client setup, ABI/address loaders
- ✅ `lib/contracts.ts` - Contract helpers, TaskStatus enum, Task interface
- ✅ `lib/ipfs.ts` - IPFS upload/download functions
- ✅ `lib/format.ts` - Address shortening, token formatting, date/time helpers
- ✅ `lib/utils.ts` - CN utility for Tailwind

### Providers & Layout (COMPLETE)
- ✅ `app/providers.tsx` - Wagmi + RainbowKit + React Query + Toaster
- ✅ `app/layout.tsx` - Root layout with Header/Footer
- ✅ `app/globals.css` - Dark theme CSS variables

### Components (COMPLETE)
- ✅ `components/Header.tsx` - Navigation + RainbowKit connect button
- ✅ `components/Footer.tsx` - Footer with links
- ✅ `components/Address.tsx` - Address display with copy
- ✅ `components/TxButton.tsx` - Transaction button with loading/toast
- ✅ `components/FileDrop.tsx` - Drag & drop file uploader
- ✅ `components/StatCard.tsx` - Animated stat card component
- ✅ `components/Countdown.tsx` - Deadline countdown timer
- ✅ `components/StatusBadge.tsx` - Task status badge
- ✅ `components/RoleBadge.tsx` - User role indicator
- ✅ `components/AnimatedBackground.tsx` - Framer Motion animated background

### Pages (PARTIAL)
- ✅ `app/page.tsx` - Home page with hero, stats, CTAs
- ✅ `app/api/verifyProof/route.ts` - Verifier proxy API route
- ⚠️ **MISSING**: `/new-task`, `/tasks`, `/task/[id]`, `/events`, `/dev` pages

### Assets (COMPLETE)
- ✅ ABIs copied from old web directory
- ✅ Logo SVG placeholder
- ✅ Lottie animation JSON
- ⚠️ `hero-loop.webm` video (document placeholder)

### Dependencies (INSTALLED)
- ✅ All packages installed via `pnpm install`

---

## 🚧 Remaining Tasks

You need to create the following page files. I'll provide the code for each below.

### 1. Create Task Page
**Path**: `src/app/new-task/page.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useAccount, useWalletClient } from 'wagmi'
import { useRouter } from 'next/navigation'
import { parseEther, keccak256, stringToBytes } from 'viem'
import toast from 'react-hot-toast'
import { TxButton } from '@/components/TxButton'
import { getEscrowContract, getMockERC20Contract, getContractAddresses } from '@/lib/contracts'
import { uploadJson } from '@/lib/ipfs'

export default function NewTaskPage() {
  const { address, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    operator: '',
    amount: '',
    bond: '',
    deadline: '',
    disputeWindow: '259200', // 3 days in seconds
    fundNow: true,
  })

  const handleSubmit = async () => {
    if (!walletClient || !address) throw new Error('Wallet not connected')
    
    // Validate
    if (!formData.title || !formData.operator || !formData.amount) {
      throw new Error('Please fill in all required fields')
    }

    // Upload manifest to IPFS
    const manifest = {
      title: formData.title,
      description: formData.description,
      createdAt: new Date().toISOString(),
    }
    const taskRefCid = await uploadJson(manifest)
    console.log('Manifest uploaded:', taskRefCid)

    // Get addresses
    const { token } = await getContractAddresses()
    if (!token) throw new Error('Token not deployed')

    // Create task
    const escrow = await getEscrowContract(walletClient)
    const amount = parseEther(formData.amount)
    const bond = formData.bond ? parseEther(formData.bond) : 0n
    const deadline = formData.deadline 
      ? BigInt(Math.floor(new Date(formData.deadline).getTime() / 1000))
      : BigInt(Math.floor(Date.now() / 1000) + 86400 * 7)
    const disputeWindow = BigInt(formData.disputeWindow)

    await escrow.write.createTask([
      formData.operator as `0x${string}`,
      token,
      amount,
      bond,
      Number(deadline),
      Number(disputeWindow),
      taskRefCid,
    ])

    // Get task ID
    await new Promise(r => setTimeout(r, 2000))
    const nextId = await escrow.read.nextTaskId()
    const taskId = (BigInt(nextId) - 1n).toString()

    // Fund if requested
    if (formData.fundNow) {
      await escrow.write.fundTask([BigInt(taskId)])
      toast.success('Task created and funded!')
    } else {
      toast.success('Task created!')
    }

    setTimeout(() => router.push(`/task/${taskId}`), 1500)
  }

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-2xl rounded-lg border border-border bg-card p-8 text-center">
          <h1 className="mb-4 text-2xl font-bold">Create Task</h1>
          <p className="text-muted-foreground">Connect your wallet to create a task</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-8 text-3xl font-bold">Create Satellite Task</h1>
        <div className="rounded-lg border border-border bg-card p-8">
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                placeholder="e.g., High-resolution imaging"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                rows={4}
                placeholder="Task details..."
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Operator Address *</label>
              <input
                type="text"
                value={formData.operator}
                onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm"
                placeholder="0x..."
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">Amount (TEST) *</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  placeholder="100"
                  step="0.01"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Bond (TEST)</label>
                <input
                  type="number"
                  value={formData.bond}
                  onChange={(e) => setFormData({ ...formData, bond: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  placeholder="50"
                  step="0.01"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Deadline</label>
              <input
                type="datetime-local"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Dispute Window (seconds)</label>
              <input
                type="number"
                value={formData.disputeWindow}
                onChange={(e) => setFormData({ ...formData, disputeWindow: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="fundNow"
                checked={formData.fundNow}
                onChange={(e) => setFormData({ ...formData, fundNow: e.target.checked })}
                className="h-4 w-4"
              />
              <label htmlFor="fundNow" className="text-sm">Fund task immediately</label>
            </div>

            <TxButton onClick={handleSubmit} className="w-full">
              Create Task {formData.fundNow && '& Fund'}
            </TxButton>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### 2. Install Missing Dependency

```bash
cd /Users/ratna/satellite-sla-marketplace/satellite-sla-marketplace/web-new
pnpm add tailwindcss-animate
```

---

## 🚀 Running the App

```bash
cd web-new
pnpm install        # Already done
pnpm dev            # Starts on port 5001
```

Then visit: **http://localhost:5001**

---

## 📝 Next Steps

1. Create the remaining page files (I'll provide them in follow-up messages if needed):
   - `/tasks` page (list all tasks)
   - `/task/[id]` page (task detail with actions)
   - `/events` page (event explorer)
   - `/dev` page (mint tokens, approve escrow)

2. Test the full flow:
   - Connect wallet
   - Create task
   - Accept/fund/submit/release actions
   - View events

The foundation is solid—all infrastructure, utilities, components, and the home page are complete. The remaining pages follow similar patterns using the established components and lib functions.
