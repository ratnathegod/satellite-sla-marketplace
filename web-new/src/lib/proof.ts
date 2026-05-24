import { type Address } from 'viem'

export const DEMO_VERIFIER_MODE = 'deterministic-demo'
export const ZERO_BYTES32 =
  '0x0000000000000000000000000000000000000000000000000000000000000000'

export type Bytes32Hex = `0x${string}`

export interface DemoProofManifest {
  taskId: string
  proofFileName: string
  proofFileSize: number
  proofFileType: string
  proofCid: string
  operator: Address
  requester: Address
  createdAt: string
  verifierMode: typeof DEMO_VERIFIER_MODE
  notes?: string
}

export interface VerifyProofRequest {
  taskId: string
  proofCid: string
  manifestCid: string
  operator: Address
  requester: Address
  proofFileName: string
  proofFileSize: number
  proofFileType: string
  createdAt: string
  verifierMode: typeof DEMO_VERIFIER_MODE
}

export interface VerifyProofResponse {
  valid: boolean
  mode: typeof DEMO_VERIFIER_MODE
  artifactHash: Bytes32Hex
  manifestHash: Bytes32Hex
  attestationId: Bytes32Hex
  proofHash?: Bytes32Hex
  resultHash?: Bytes32Hex
  attestationHash?: Bytes32Hex
  message?: string
  warnings?: string[]
}

export interface SubmittedProofPreview {
  proofCid: string
  proofGatewayUrl: string
  manifestCid: string
  manifestGatewayUrl: string
  verifierMode: string
  artifactHash: Bytes32Hex
  manifestHash: Bytes32Hex
  attestationId: Bytes32Hex
  message?: string
  warnings?: string[]
}

export function buildDemoProofManifest(args: {
  taskId: string
  proofFile: File
  proofCid: string
  operator: Address
  requester: Address
  notes?: string
}): DemoProofManifest {
  return {
    taskId: args.taskId,
    proofFileName: args.proofFile.name,
    proofFileSize: args.proofFile.size,
    proofFileType: args.proofFile.type || 'application/octet-stream',
    proofCid: args.proofCid,
    operator: args.operator,
    requester: args.requester,
    createdAt: new Date().toISOString(),
    verifierMode: DEMO_VERIFIER_MODE,
    notes: args.notes,
  }
}

export function isBytes32Hex(value: unknown): value is Bytes32Hex {
  return (
    typeof value === 'string' &&
    /^0x[0-9a-fA-F]{64}$/.test(value) &&
    value !== ZERO_BYTES32
  )
}

export function requireBytes32(value: unknown, label: string): Bytes32Hex {
  if (!isBytes32Hex(value)) {
    throw new Error(`${label} must be a nonzero 32-byte hex string`)
  }

  return value
}
