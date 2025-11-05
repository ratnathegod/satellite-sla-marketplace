import { getContract, type Address, type PublicClient, type WalletClient } from 'viem'
import { loadContractABI, loadContractAddress, publicClient } from './viem'

// Get Escrow contract instance
export async function getEscrowContract(client?: PublicClient | WalletClient) {
  const address = await loadContractAddress('escrow')
  if (!address) throw new Error('Escrow contract address not found')
  
  const abi = await loadContractABI('Escrow')
  if (!abi) throw new Error('Escrow ABI not found')
  
  return getContract({
    address,
    abi,
    client: client || publicClient,
  })
}

// Get MockERC20 contract instance
export async function getMockERC20Contract(client?: PublicClient | WalletClient) {
  const address = await loadContractAddress('mockerc20')
  if (!address) throw new Error('MockERC20 contract address not found')
  
  const abi = await loadContractABI('MockERC20')
  if (!abi) throw new Error('MockERC20 ABI not found')
  
  return getContract({
    address,
    abi,
    client: client || publicClient,
  })
}

// Get both contract addresses
export async function getContractAddresses() {
  const [escrow, token] = await Promise.all([
    loadContractAddress('escrow'),
    loadContractAddress('mockerc20'),
  ])
  
  return { escrow, token }
}

// Task status enum (matches Solidity)
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

// Parse task from contract response
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

export function parseTask(id: string, data: any): Task {
  return {
    id,
    requester: data[0] as Address,
    operator: data[1] as Address,
    token: data[2] as Address,
    amount: data[3] as bigint,
    bond: data[4] as bigint,
    deadline: data[5] as bigint,
    disputeWindow: data[6] as bigint,
    status: Number(data[7]) as TaskStatus,
    artifactHash: data[8] as `0x${string}`,
    manifestHash: data[9] as `0x${string}`,
    attestationId: data[10] as `0x${string}`,
    submittedAt: data[11] as bigint,
  }
}
