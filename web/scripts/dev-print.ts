#!/usr/bin/env node

import { readFileSync } from 'fs'
import { join } from 'path'

interface AddressMap {
  [chainId: string]: string
}

function loadAddresses(contractName: string): AddressMap | null {
  try {
    const filePath = join(__dirname, '..', 'public', 'abi', `${contractName.toLowerCase()}.address.json`)
    const content = readFileSync(filePath, 'utf-8')
    return JSON.parse(content)
  } catch (error) {
    console.error(`Failed to load ${contractName} addresses:`, error)
    return null
  }
}

function main() {
  console.log('🚀 Satellite Tasking Marketplace - Contract Addresses\n')
  
  const chainId = process.env.NEXT_PUBLIC_CHAIN_ID || '31337'
  console.log(`Chain ID: ${chainId}`)
  console.log(`RPC URL: ${process.env.NEXT_PUBLIC_RPC_URL || 'http://localhost:8545'}\n`)
  
  // Load contract addresses
  const escrowAddresses = loadAddresses('escrow')
  const tokenAddresses = loadAddresses('mockerc20')
  
  if (escrowAddresses && escrowAddresses[chainId]) {
    console.log(`📋 Escrow Contract: ${escrowAddresses[chainId]}`)
  } else {
    console.log('❌ Escrow contract not deployed or address file missing')
  }
  
  if (tokenAddresses && tokenAddresses[chainId]) {
    console.log(`🪙 MockERC20 Token: ${tokenAddresses[chainId]}`)
  } else {
    console.log('❌ MockERC20 token not deployed or address file missing')
  }
  
  console.log('\n📖 Quick Links:')
  console.log('• Dashboard: http://localhost:3000')
  console.log('• Events: http://localhost:3000/events')
  console.log('• Task #1: http://localhost:3000/task/1')
  console.log('• Create Task: http://localhost:3000/new-task')
  
  console.log('\n🔧 Development Commands:')
  console.log('• Deploy contracts: make deploy-local')
  console.log('• Export ABIs: make export-abi')
  console.log('• Start dev stack: make dev')
  console.log('• Run tests: make test')
  
  if (!escrowAddresses || !escrowAddresses[chainId]) {
    console.log('\n⚠️  Run `make deploy-local` to deploy contracts first!')
  }
}

main()