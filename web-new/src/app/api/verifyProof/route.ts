import { NextRequest, NextResponse } from 'next/server'

const VERIFIER_URL =
  process.env.VERIFIER_URL ||
  process.env.NEXT_PUBLIC_VERIFIER_URL ||
  'http://localhost:8091'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    const response = await fetch(`${VERIFIER_URL}/verifyProof`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Verifier request failed' },
        { status: response.status }
      )
    }
    
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Verifier proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to verify proof' },
      { status: 500 }
    )
  }
}
