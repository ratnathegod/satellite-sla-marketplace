const IPFS_API =
  process.env.NEXT_PUBLIC_IPFS_API_URL ||
  process.env.NEXT_PUBLIC_IPFS_API ||
  'http://localhost:5001'

const IPFS_GATEWAY =
  process.env.NEXT_PUBLIC_IPFS_GATEWAY_URL ||
  process.env.NEXT_PUBLIC_IPFS_GATEWAY ||
  'http://localhost:8080/ipfs'

// Upload JSON to IPFS
export async function uploadJson(data: any): Promise<string> {
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
  const formData = new FormData()
  formData.append('file', blob, 'data.json')
  
  const response = await fetch(`${IPFS_API}/api/v0/add`, {
    method: 'POST',
    body: formData,
  })
  
  if (!response.ok) {
    throw new Error('Failed to upload JSON to IPFS')
  }
  
  const result = await response.json()
  return result.Hash as string
}

// Upload file to IPFS
export async function uploadFile(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  
  const response = await fetch(`${IPFS_API}/api/v0/add`, {
    method: 'POST',
    body: formData,
  })
  
  if (!response.ok) {
    throw new Error('Failed to upload file to IPFS')
  }
  
  const result = await response.json()
  return result.Hash as string
}

// Get IPFS gateway URL
export function makeGatewayUrl(cid: string): string {
  const gateway = IPFS_GATEWAY.replace(/\/$/, '')
  return gateway.endsWith('/ipfs') ? `${gateway}/${cid}` : `${gateway}/ipfs/${cid}`
}

// Fetch JSON from IPFS
export async function fetchJson<T = any>(cid: string): Promise<T | null> {
  try {
    const response = await fetch(makeGatewayUrl(cid))
    if (!response.ok) return null
    return await response.json()
  } catch (error) {
    console.error('Error fetching from IPFS:', error)
    return null
  }
}
