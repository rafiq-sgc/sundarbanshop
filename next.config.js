/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',
  
  images: {
    domains: ['localhost', 'ekomart-nextjs.vercel.app'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  env: {
    MONGODB_URI: process.env.MONGODB_URI,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },
  // Reduce logging noise in development
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  // Fix for nodemailer and other Node.js modules
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't resolve 'fs', 'net', 'tls' and other Node.js modules on the client
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
        'node:fs': false,
        'node:net': false,
        'node:tls': false,
        'node:dns': false,
        'node:child_process': false,
      }
    }
    return config
  },
}

module.exports = nextConfig
