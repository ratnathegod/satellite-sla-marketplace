'use client'

import { type Address } from 'viem'

/**
 * Task status enum matching the Escrow contract
 */
export enum TaskStatus {
  Created = 0,
  Funded = 1,
  Accepted = 2,
  Submitted = 3,
  Disputed = 4,
  Released = 5,
  Cancelled = 6,
  Resolved = 7,
}

/**
 * Human-readable labels for task statuses
 */
export const TaskStatusLabel: Record<TaskStatus, string> = {
  [TaskStatus.Created]: 'Created',
  [TaskStatus.Funded]: 'Funded',
  [TaskStatus.Accepted]: 'Accepted',
  [TaskStatus.Submitted]: 'Submitted',
  [TaskStatus.Disputed]: 'Disputed',
  [TaskStatus.Released]: 'Released',
  [TaskStatus.Cancelled]: 'Cancelled',
  [TaskStatus.Resolved]: 'Resolved',
}

/**
 * Task interface matching the Escrow contract struct
 */
export interface Task {
  id: string
  requester: Address
  operator: Address
  token: Address
  amount: bigint
  bond: bigint
  deadline: bigint
  disputeWindow: bigint
  status: TaskStatus
  artifactHash: `0x${string}`
  manifestHash: `0x${string}`
  attestationId: `0x${string}`
  submittedAt: bigint
}

/**
 * Task metadata stored on IPFS
 */
export interface TaskMetadata {
  title: string
  description?: string
  createdAt?: string
  coordinates?: {
    latitude: number
    longitude: number
  }
  [key: string]: unknown
}

/**
 * Extended task with metadata
 */
export interface TaskWithMetadata extends Task {
  metadataCid?: string
  metadata?: TaskMetadata
}

/**
 * User role relative to a task
 */
export type TaskRole = 'requester' | 'operator' | 'none'

/**
 * Available actions for a task based on status and role
 */
export interface TaskActions {
  canFund: boolean
  canCancel: boolean
  canAccept: boolean
  canSubmitProof: boolean
  canRelease: boolean
  canDispute: boolean
  canResolve: boolean
}

/**
 * Event log from the Escrow contract
 */
export interface EscrowEvent {
  blockNumber: bigint
  transactionHash: `0x${string}`
  eventName: string
  taskId?: bigint
  args: Record<string, unknown>
  timestamp?: number
}

/**
 * Parse raw contract task data into Task interface
 */
export function parseTask(id: string | number, rawTask: readonly unknown[]): Task {
  return {
    id: String(id),
    requester: rawTask[0] as Address,
    operator: rawTask[1] as Address,
    token: rawTask[2] as Address,
    amount: rawTask[3] as bigint,
    bond: rawTask[4] as bigint,
    deadline: rawTask[5] as bigint,
    disputeWindow: rawTask[6] as bigint,
    status: Number(rawTask[7]) as TaskStatus,
    artifactHash: rawTask[8] as `0x${string}`,
    manifestHash: rawTask[9] as `0x${string}`,
    attestationId: rawTask[10] as `0x${string}`,
    submittedAt: rawTask[11] as bigint,
  }
}
