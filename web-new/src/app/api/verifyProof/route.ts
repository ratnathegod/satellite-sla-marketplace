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
      cache: 'no-store',
    })

    const responseText = await response.text()
    let data: any = null
    try {
      data = responseText ? JSON.parse(responseText) : null
    } catch {
      data = { error: responseText || 'Verifier returned non-JSON response' }
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          error: 'Verifier request failed',
          message: data?.error || data?.message || `Verifier returned ${response.status}`,
        },
        { status: response.status }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Verifier proxy error:', error)
    return NextResponse.json(
      {
        error: 'Failed to verify proof',
        message:
          error instanceof Error
            ? error.message
            : 'Verifier is unavailable. Is the local verifier running on port 8091?',
      },
      { status: 500 }
    )
  }
}
