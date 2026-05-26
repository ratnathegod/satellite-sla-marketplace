import http from 'node:http'
import { expect, test } from '@playwright/test'

const verifierPort = 19091
const bytes32Pattern = /^0x[0-9a-fA-F]{64}$/

let verifierServer: http.Server

test.beforeAll(async () => {
  verifierServer = http.createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/healthz') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ status: 'ok', message: 'fake verifier healthy' }))
      return
    }

    if (req.method === 'POST' && req.url === '/verifyProof') {
      let body = ''
      req.on('data', (chunk) => {
        body += chunk
      })
      req.on('end', () => {
        try {
          const parsed = JSON.parse(body)
          if (!parsed.taskId || !parsed.proofCid || !parsed.manifestCid) {
            res.writeHead(400, { 'Content-Type': 'text/plain' })
            res.end('missing required fields')
            return
          }

          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(
            JSON.stringify({
              valid: true,
              mode: 'deterministic-demo',
              artifactHash:
                '0x1111111111111111111111111111111111111111111111111111111111111111',
              manifestHash:
                '0x2222222222222222222222222222222222222222222222222222222222222222',
              attestationId:
                '0x3333333333333333333333333333333333333333333333333333333333333333',
              message: 'Fake deterministic verifier accepted proof.',
              warnings: ['fake verifier used only for browser smoke tests'],
            })
          )
        } catch {
          res.writeHead(400, { 'Content-Type': 'text/plain' })
          res.end('invalid json')
        }
      })
      return
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end('not found')
  })

  await new Promise<void>((resolve) => {
    verifierServer.listen(verifierPort, '127.0.0.1', resolve)
  })
})

test.afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    verifierServer.close((error) => {
      if (error) reject(error)
      else resolve()
    })
  })
})

test('home page loads with primary navigation', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })

  await expect(page.getByText('Satellite SLA').first()).toBeVisible()
  await expect(page.getByRole('link', { name: /Create Task/i }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: /Browse Tasks/i }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: /Events/i }).first()).toBeVisible()
})

test('core routes render without a wallet', async ({ page }) => {
  await page.goto('/new-task', { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('heading', { name: 'Create Task' })).toBeVisible()
  await expect(page.getByText('Connect your wallet to create a task')).toBeVisible()

  await page.goto('/tasks', { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('heading', { name: 'Tasks' })).toBeVisible()
  await expect(page.getByText('Browse and manage satellite tasking requests')).toBeVisible()

  await page.goto('/events', { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('heading', { name: /Event Explorer/i })).toBeVisible()
  await expect(page.getByText('Real-time Escrow contract event logs')).toBeVisible()
})

test('verifier proxy returns deterministic-demo bytes32 fields', async ({ request }) => {
  const response = await request.post('/api/verifyProof', {
    data: {
      taskId: '1',
      proofCid: 'bafyproof',
      manifestCid: 'bafymanifest',
      operator: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      requester: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      proofFileName: 'proof.txt',
      proofFileSize: 12,
      proofFileType: 'text/plain',
      createdAt: '2026-05-25T00:00:00.000Z',
      verifierMode: 'deterministic-demo',
    },
  })

  expect(response.ok()).toBe(true)
  const body = await response.json()
  expect(body.valid).toBe(true)
  expect(body.mode).toBe('deterministic-demo')
  expect(body.artifactHash).toMatch(bytes32Pattern)
  expect(body.manifestHash).toMatch(bytes32Pattern)
  expect(body.attestationId).toMatch(bytes32Pattern)
})

test('IPFS upload route gives a clear result or local-service failure', async ({ request }) => {
  const response = await request.post('/api/ipfs/add', {
    multipart: {
      file: {
        name: 'proof.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('demo proof'),
      },
    },
  })

  const body = await response.json()
  if (response.ok()) {
    expect(body.cid).toBeTruthy()
    expect(body.gatewayUrl).toContain('/ipfs/')
  } else {
    expect([500, 502]).toContain(response.status())
    expect(body.error).toMatch(/IPFS|local/i)
  }
})
