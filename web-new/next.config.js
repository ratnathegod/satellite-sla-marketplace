/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding')
    return config
  },
  // Add custom server startup message
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
}

// Print startup message when in development
if (process.env.NODE_ENV === 'development') {
  const port = process.env.PORT || 5001
  const chainId = process.env.NEXT_PUBLIC_CHAIN_ID || 31337
  
  // Use setTimeout to ensure this runs after Next.js server starts
  setTimeout(() => {
    console.log(`🚀 SatSLA running on http://localhost:${port} (chain ${chainId})`)
  }, 1000)
}

module.exports = nextConfig
