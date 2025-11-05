import { createPublicClient, createWalletClient, http, custom, type Address, type PublicClient, type WalletClient } from 'viem'
import { localhost } from 'viem/chains'

// Chain configuration
const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID || '31337')
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'http://localhost:8545'

// Define localhost chain with our RPC
export const localChain = {
  ...localhost,
  id: CHAIN_ID,
  rpcUrls: {
    default: { http: [RPC_URL] },
    public: { http: [RPC_URL] },
  },
}

// Public client for read operations
export const publicClient = createPublicClient({
  chain: localChain,
  transport: http(RPC_URL),
})

// Load ABI from public folder
export async function loadContractABI(name: 'Escrow' | 'MockERC20'): Promise<any> {
  try {
    const res = await fetch(`/abi/${name}.json`)
    if (!res.ok) throw new Error(`Failed to load ${name} ABI`)
    const json = await res.json()
    // Foundry artifact format: { abi, bytecode, ... }
    return json.abi || json
  } catch (error) {
    console.error(`Error loading ${name} ABI:`, error)
    return null
  }
}

// Load contract address for current chain
export async function loadContractAddress(
  kind: 'escrow' | 'mockerc20'
): Promise<Address | null> {
  try {
    const res = await fetch(`/abi/${kind}.address.json`)
    if (!res.ok) return null
    const addressMap = await res.json()
    const address = addressMap[String(CHAIN_ID)]
    return address ? (address as Address) : null
  } catch (error) {
    console.error(`Error loading ${kind} address:`, error)
    return null
  }
}

// Get chain info
export function getChainInfo() {
  return {
    chainId: CHAIN_ID,
    rpcUrl: RPC_URL,
    chain: localChain,
  }
}
