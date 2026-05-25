import { describe, expect, it } from 'vitest'
import {
  DEMO_VERIFIER_MODE,
  ZERO_BYTES32,
  buildDemoProofManifest,
  isBytes32Hex,
  requireBytes32,
} from './proof'

const requester = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
const operator = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'
const validBytes32 = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'

describe('proof helpers', () => {
  it('accepts nonzero 32-byte hex strings', () => {
    expect(isBytes32Hex(validBytes32)).toBe(true)
    expect(requireBytes32(validBytes32, 'artifactHash')).toBe(validBytes32)
  })

  it('rejects zero, short, and malformed hashes', () => {
    expect(isBytes32Hex(ZERO_BYTES32)).toBe(false)
    expect(isBytes32Hex('0x1234')).toBe(false)
    expect(isBytes32Hex(`0x${'z'.repeat(64)}`)).toBe(false)
    expect(isBytes32Hex(null)).toBe(false)
    expect(() => requireBytes32(ZERO_BYTES32, 'artifactHash')).toThrow(
      'artifactHash must be a nonzero 32-byte hex string'
    )
  })

  it('builds an inspectable deterministic-demo proof manifest', () => {
    const proofFile = new File(['proof-content'], 'scene.tif', {
      type: 'image/tiff',
    })

    const manifest = buildDemoProofManifest({
      taskId: '7',
      proofFile,
      proofCid: 'bafyproof',
      operator,
      requester,
      notes: 'Cloud-free scene accepted for local demo.',
    })

    expect(manifest).toMatchObject({
      taskId: '7',
      proofFileName: 'scene.tif',
      proofFileSize: proofFile.size,
      proofFileType: 'image/tiff',
      proofCid: 'bafyproof',
      operator,
      requester,
      verifierMode: DEMO_VERIFIER_MODE,
      notes: 'Cloud-free scene accepted for local demo.',
    })
    expect(new Date(manifest.createdAt).toString()).not.toBe('Invalid Date')
  })
})
