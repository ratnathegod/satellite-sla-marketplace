'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAccount, useWalletClient } from 'wagmi'
import { keccak256, stringToBytes } from 'viem'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  Loader2,
  RefreshCw,
  Clock,
  Coins,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Upload,
  ExternalLink,
} from 'lucide-react'
import { StatusBadge } from '@/components/StatusBadge'
import { RoleBadge } from '@/components/RoleBadge'
import { Address } from '@/components/Address'
import { Countdown } from '@/components/Countdown'
import { TxButton } from '@/components/TxButton'
import { FileDrop } from '@/components/FileDrop'
import { useTask, useTaskRole, useTaskActions, useContractEvents } from '@/lib/hooks'
import { getEscrowContract, getMockERC20Contract } from '@/lib/contracts'
import { uploadFile, uploadJson, makeGatewayUrl } from '@/lib/ipfs'
import { formatTokenAmount, formatDate, shortenAddress } from '@/lib/format'
import { TaskStatus, TaskStatusLabel } from '@/lib/types'

export default function TaskDetailPage() {
  const params = useParams()
  const router = useRouter()
  const taskId = params.id as string
  const { address, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()

  // Data hooks
  const { task, loading, error, refresh } = useTask(taskId)
  const { isRequester, isOperator, role } = useTaskRole(task)
  const actions = useTaskActions(task, role)
  const { events } = useContractEvents({ taskId })

  // Local state
  const [refreshing, setRefreshing] = useState(false)
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [operatorWins, setOperatorWins] = useState<boolean | null>(null)

  const handleRefresh = async () => {
    setRefreshing(true)
    await refresh()
    setRefreshing(false)
  }

  // ============ ACTION HANDLERS ============

  const handleFundTask = async () => {
    if (!walletClient || !task) throw new Error('Wallet not connected')

    const escrow = await getEscrowContract(walletClient)
    const mockERC20 = await getMockERC20Contract(walletClient)

    // Approve tokens first
    await (mockERC20.write as any).approve([escrow.address, task.amount])
    await new Promise((r) => setTimeout(r, 1500))

    // Fund task
    await (escrow.write as any).fundTask([BigInt(task.id)])
    toast.success('Task funded successfully!')
    setTimeout(refresh, 2000)
  }

  const handleCancelTask = async () => {
    if (!walletClient || !task) throw new Error('Wallet not connected')

    const escrow = await getEscrowContract(walletClient)
    await (escrow.write as any).cancelUnaccepted([BigInt(task.id)])
    toast.success('Task cancelled')
    setTimeout(refresh, 2000)
  }

  const handleAcceptTask = async () => {
    if (!walletClient || !task) throw new Error('Wallet not connected')

    const escrow = await getEscrowContract(walletClient)

    // If bond > 0, approve and stake
    if (task.bond > 0n) {
      const mockERC20 = await getMockERC20Contract(walletClient)
      await (mockERC20.write as any).approve([escrow.address, task.bond])
      await new Promise((r) => setTimeout(r, 1500))
    }

    await (escrow.write as any).acceptTask([BigInt(task.id)])
    toast.success('Task accepted!')
    setTimeout(refresh, 2000)
  }

  const handleSubmitProof = async () => {
    if (!walletClient || !task || !proofFile) {
      throw new Error('Missing proof file')
    }

    // Upload artifact to IPFS
    const artifactCid = await uploadFile(proofFile)

    // Create and upload manifest
    const manifest = {
      artifactCid,
      filename: proofFile.name,
      size: proofFile.size,
      type: proofFile.type,
      taskId: task.id,
      createdAt: new Date().toISOString(),
    }
    const manifestCid = await uploadJson(manifest)

    // Hash CIDs to bytes32
    const artifactHash = keccak256(stringToBytes(artifactCid))
    const manifestHash = keccak256(stringToBytes(manifestCid))

    // Call verifier API
    const resp = await fetch('/api/verifyProof', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        artifactCid,
        manifestCid,
        artifactHash,
        manifestHash,
        taskId: task.id,
      }),
    })
    const data = await resp.json()
    if (!data.valid || !data.attestationId) {
      throw new Error('Verifier rejected proof')
    }

    const attestationId = data.attestationId as `0x${string}`
    const escrow = await getEscrowContract(walletClient)
    await (escrow.write as any).submitProof([
      BigInt(task.id),
      artifactHash,
      manifestHash,
      attestationId,
    ])

    toast.success('Proof submitted!')
    setProofFile(null)
    setTimeout(refresh, 2000)
  }

  const handleRelease = async () => {
    if (!walletClient || !task) throw new Error('Wallet not connected')

    const escrow = await getEscrowContract(walletClient)
    await (escrow.write as any).release([BigInt(task.id)])
    toast.success('Payment released!')
    setTimeout(refresh, 2000)
  }

  const handleDispute = async () => {
    if (!walletClient || !task) throw new Error('Wallet not connected')

    const escrow = await getEscrowContract(walletClient)
    await (escrow.write as any).dispute([BigInt(task.id)])
    toast.success('Dispute raised!')
    setTimeout(refresh, 2000)
  }

  const handleResolveDispute = async () => {
    if (!walletClient || !task || operatorWins === null) {
      throw new Error('Select dispute outcome')
    }

    const escrow = await getEscrowContract(walletClient)
    await (escrow.write as any).resolveDispute([BigInt(task.id), operatorWins])
    toast.success(`Dispute resolved in favor of ${operatorWins ? 'operator' : 'requester'}`)
    setOperatorWins(null)
    setTimeout(refresh, 2000)
  }

  // ============ RENDER ============

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Loading task...</span>
        </div>
      </div>
    )
  }

  if (error || !task) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-lg rounded-lg border border-destructive/50 bg-card p-8 text-center">
          <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Task Not Found</h1>
          <p className="text-muted-foreground mb-6">
            {error?.message || 'The requested task could not be found.'}
          </p>
          <Link
            href="/tasks"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Tasks
          </Link>
        </div>
      </div>
    )
  }

  const title = task.metadata?.title || `Task #${task.id}`

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Link */}
      <Link
        href="/tasks"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Tasks
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{title}</h1>
            <StatusBadge status={task.status} />
          </div>
          <div className="flex items-center gap-3">
            <RoleBadge isRequester={isRequester} isOperator={isOperator} />
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {task.metadata?.description && (
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="text-lg font-semibold mb-3">Description</h2>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {task.metadata.description}
              </p>
            </div>
          )}

          {/* Task Details */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-lg font-semibold mb-4">Task Details</h2>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-muted-foreground">Requester</dt>
                <dd className="mt-1">
                  <Address address={task.requester} />
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Operator</dt>
                <dd className="mt-1">
                  <Address address={task.operator} />
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground flex items-center gap-1">
                  <Coins className="h-4 w-4" /> Amount
                </dt>
                <dd className="mt-1 font-mono">
                  {formatTokenAmount(task.amount)} TEST
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground flex items-center gap-1">
                  <Shield className="h-4 w-4" /> Bond
                </dt>
                <dd className="mt-1 font-mono">
                  {formatTokenAmount(task.bond)} TEST
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-4 w-4" /> Deadline
                </dt>
                <dd className="mt-1">{formatDate(task.deadline)}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Dispute Window</dt>
                <dd className="mt-1">
                  {Number(task.disputeWindow) / 3600} hours
                </dd>
              </div>
            </dl>
          </div>

          {/* Proof Submission (Submitted state) */}
          {task.status >= TaskStatus.Submitted && task.artifactHash !== '0x0000000000000000000000000000000000000000000000000000000000000000' && (
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="text-lg font-semibold mb-4">Submitted Proof</h2>
              <dl className="grid gap-4">
                <div>
                  <dt className="text-sm text-muted-foreground">Artifact Hash</dt>
                  <dd className="mt-1 font-mono text-xs break-all">
                    {task.artifactHash}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Manifest Hash</dt>
                  <dd className="mt-1 font-mono text-xs break-all">
                    {task.manifestHash}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Attestation ID</dt>
                  <dd className="mt-1 font-mono text-xs break-all">
                    {task.attestationId}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Submitted At</dt>
                  <dd className="mt-1">{formatDate(task.submittedAt)}</dd>
                </div>
              </dl>
            </div>
          )}

          {/* Event History */}
          {events.length > 0 && (
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="text-lg font-semibold mb-4">Event History</h2>
              <div className="space-y-3">
                {events.slice(0, 10).map((event, i) => (
                  <div
                    key={`${event.transactionHash}-${i}`}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <div>
                      <span className="font-medium">{event.eventName}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        Block #{event.blockNumber.toString()}
                      </span>
                    </div>
                    <a
                      href={`#tx-${event.transactionHash}`}
                      className="text-xs font-mono text-primary hover:underline"
                    >
                      {shortenAddress(event.transactionHash)}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Actions */}
        <div className="space-y-6">
          {/* Countdown for time-sensitive states */}
          {task.status === TaskStatus.Accepted && (
            <Countdown deadline={task.deadline} label="Task Deadline" />
          )}

          {task.status === TaskStatus.Submitted && (
            <div className="rounded-lg border border-border bg-card p-4">
              <Countdown
                deadline={task.submittedAt + task.disputeWindow}
                label="Dispute Window"
              />
              {actions.isDisputeWindowActive ? (
                <p className="text-xs text-yellow-500 mt-2 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Requester can dispute during this window
                </p>
              ) : (
                <p className="text-xs text-green-500 mt-2 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Dispute window closed - anyone can release
                </p>
              )}
            </div>
          )}

          {/* Action Panel */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-lg font-semibold mb-4">Actions</h2>

            {!isConnected ? (
              <p className="text-sm text-muted-foreground">
                Connect your wallet to interact with this task
              </p>
            ) : (
              <div className="space-y-4">
                {/* Fund Task */}
                {actions.canFund && (
                  <TxButton onClick={handleFundTask} className="w-full">
                    <Coins className="h-4 w-4 mr-2" />
                    Fund Task ({formatTokenAmount(task.amount)} TEST)
                  </TxButton>
                )}

                {/* Cancel Task */}
                {actions.canCancel && (
                  <TxButton
                    onClick={handleCancelTask}
                    variant="destructive"
                    className="w-full"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel Task
                  </TxButton>
                )}

                {/* Accept Task */}
                {actions.canAccept && (
                  <TxButton onClick={handleAcceptTask} className="w-full">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Accept Task
                    {task.bond > 0n && ` (Stake ${formatTokenAmount(task.bond)} TEST)`}
                  </TxButton>
                )}

                {/* Submit Proof */}
                {actions.canSubmitProof && (
                  <div className="space-y-3">
                    <FileDrop
                      onFileSelect={setProofFile}
                      accept="*/*"
                      className="border-dashed"
                    />
                    {proofFile && (
                      <p className="text-sm text-muted-foreground">
                        Selected: {proofFile.name}
                      </p>
                    )}
                    <TxButton
                      onClick={handleSubmitProof}
                      disabled={!proofFile}
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Submit Proof
                    </TxButton>
                  </div>
                )}

                {/* Release Payment */}
                {actions.canRelease && (
                  <TxButton onClick={handleRelease} className="w-full">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Release Payment
                  </TxButton>
                )}

                {/* Dispute */}
                {actions.canDispute && (
                  <TxButton
                    onClick={handleDispute}
                    variant="destructive"
                    className="w-full"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Raise Dispute
                  </TxButton>
                )}

                {/* Resolve Dispute */}
                {actions.canResolve && (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      As contract owner, resolve this dispute:
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setOperatorWins(true)}
                        className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                          operatorWins === true
                            ? 'bg-green-500 text-white'
                            : 'bg-muted text-muted-foreground hover:bg-accent'
                        }`}
                      >
                        Operator Wins
                      </button>
                      <button
                        onClick={() => setOperatorWins(false)}
                        className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                          operatorWins === false
                            ? 'bg-red-500 text-white'
                            : 'bg-muted text-muted-foreground hover:bg-accent'
                        }`}
                      >
                        Requester Wins
                      </button>
                    </div>
                    <TxButton
                      onClick={handleResolveDispute}
                      disabled={operatorWins === null}
                      className="w-full"
                    >
                      Resolve Dispute
                    </TxButton>
                  </div>
                )}

                {/* No actions available */}
                {!actions.canFund &&
                  !actions.canCancel &&
                  !actions.canAccept &&
                  !actions.canSubmitProof &&
                  !actions.canRelease &&
                  !actions.canDispute &&
                  !actions.canResolve && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {task.status === TaskStatus.Released
                        ? '✅ Task completed and payment released'
                        : task.status === TaskStatus.Cancelled
                        ? '❌ Task was cancelled'
                        : task.status === TaskStatus.Resolved
                        ? '⚖️ Dispute resolved'
                        : 'No actions available for your role'}
                    </p>
                  )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
