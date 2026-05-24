const IPFS_GATEWAY =
  process.env.NEXT_PUBLIC_IPFS_GATEWAY_URL ||
  process.env.NEXT_PUBLIC_IPFS_GATEWAY ||
  'http://localhost:8080/ipfs'

export interface IpfsAddResult {
  cid: string
  gatewayUrl: string
  name?: string
  size?: number
}

async function addToIpfs(formData: FormData): Promise<IpfsAddResult> {
  const response = await fetch('/api/ipfs/add', {
    method: 'POST',
    body: formData,
  })

  const result = await response.json().catch(() => null)

  if (!response.ok) {
    const message =
      result?.error ||
      result?.message ||
      'Failed to upload to local IPFS. Is the IPFS service running?'
    throw new Error(message)
  }

  if (!result?.cid) {
    throw new Error('IPFS upload did not return a CID')
  }

  return result as IpfsAddResult
}

// Upload JSON to IPFS
export async function uploadJson(data: any): Promise<string> {
  const result = await uploadJsonWithResult(data)
  return result.cid
}

export async function uploadJsonWithResult(
  data: any,
  filename = 'data.json'
): Promise<IpfsAddResult> {
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
  const formData = new FormData()
  formData.append('file', blob, filename)

  return addToIpfs(formData)
}

// Upload file to IPFS
export async function uploadFile(file: File): Promise<string> {
  const result = await uploadFileWithResult(file)
  return result.cid
}

export async function uploadFileWithResult(file: File): Promise<IpfsAddResult> {
  const formData = new FormData()
  formData.append('file', file)

  return addToIpfs(formData)
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
