import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: 'http://127.0.0.1:3100',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'pnpm exec next dev -H 127.0.0.1 -p 3100',
    url: 'http://127.0.0.1:3100',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_CHAIN_ID: '31337',
      NEXT_PUBLIC_RPC_URL: 'http://127.0.0.1:8545',
      NEXT_PUBLIC_VERIFIER_URL: 'http://127.0.0.1:19091',
      VERIFIER_URL: 'http://127.0.0.1:19091',
      IPFS_API_URL: 'http://127.0.0.1:5001',
      IPFS_GATEWAY_URL: 'http://127.0.0.1:8080/ipfs',
      NEXT_PUBLIC_IPFS_API_URL: 'http://127.0.0.1:5001',
      NEXT_PUBLIC_IPFS_GATEWAY_URL: 'http://127.0.0.1:8080/ipfs',
      NEXT_PUBLIC_WALLET_CONNECT_ID: 'local-demo',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
