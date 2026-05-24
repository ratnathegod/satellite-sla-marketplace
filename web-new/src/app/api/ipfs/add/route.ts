import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

const IPFS_API_URL =
  process.env.IPFS_API_URL ||
  process.env.NEXT_PUBLIC_IPFS_API_URL ||
  'http://localhost:5001'

const IPFS_GATEWAY_URL =
  process.env.IPFS_GATEWAY_URL ||
  process.env.NEXT_PUBLIC_IPFS_GATEWAY_URL ||
  'http://localhost:8080/ipfs'

function makeGatewayUrl(cid: string): string {
  const gateway = IPFS_GATEWAY_URL.replace(/\/$/, '')
  return gateway.endsWith('/ipfs') ? `${gateway}/${cid}` : `${gateway}/ipfs/${cid}`
}

function parseKuboAddResponse(text: string): { Hash?: string; Name?: string; Size?: string } {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const lastLine = lines[lines.length - 1] || text
  return JSON.parse(lastLine)
}

export async function POST(req: NextRequest) {
  try {
    const incoming = await req.formData()
    const file = incoming.get('file')

    if (!(file instanceof Blob)) {
      return NextResponse.json(
        { error: 'A file field is required for IPFS upload' },
        { status: 400 }
      )
    }

    const filename =
      'name' in file && typeof file.name === 'string' ? file.name : 'upload.bin'
    const outgoing = new FormData()
    outgoing.append('file', file, filename)

    const response = await fetch(`${IPFS_API_URL}/api/v0/add?cid-version=1`, {
      method: 'POST',
      body: outgoing,
    })

    const text = await response.text()
    if (!response.ok) {
      return NextResponse.json(
        {
          error: 'Local IPFS upload failed',
          message: text || `IPFS API returned ${response.status}`,
        },
        { status: 502 }
      )
    }

    const result = parseKuboAddResponse(text)
    const cid = result.Hash
    if (!cid) {
      return NextResponse.json(
        { error: 'IPFS API response did not include a CID' },
        { status: 502 }
      )
    }

    return NextResponse.json({
      cid,
      gatewayUrl: makeGatewayUrl(cid),
      name: result.Name || filename,
      size: Number(result.Size || file.size || 0),
    })
  } catch (error) {
    console.error('IPFS proxy error:', error)
    return NextResponse.json(
      {
        error: 'Unable to reach local IPFS API',
        message:
          error instanceof Error
            ? error.message
            : 'Start the local IPFS service with make dev and retry.',
      },
      { status: 500 }
    )
  }
}
