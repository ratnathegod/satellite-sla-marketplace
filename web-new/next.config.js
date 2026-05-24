/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding')
    return config
  },
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
}

// Print custom startup message in development
if (process.env.NODE_ENV !== 'production') {
  const originalLog = console.log
  let hasLogged = false
  
  console.log = function(...args) {
    originalLog.apply(console, args)
    
    // Detect Next.js ready message and add our custom message
    const message = args.join(' ')
    if (!hasLogged && message.includes('Ready in')) {
      hasLogged = true
      const chainId = process.env.NEXT_PUBLIC_CHAIN_ID || '31337'
      const port = process.env.PORT || '3000'
      setTimeout(() => {
        originalLog(`\n🚀 SatSLA running on http://localhost:${port} (chain ${chainId})\n`)
      }, 100)
    }
  }
}

module.exports = nextConfig
