/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    outputFileTracingRoot: undefined,
  },
  eslint: {
    // Ignore during builds - warnings are logged but don't fail the build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignore TypeScript errors during builds - they're checked in CI
    ignoreBuildErrors: true,
  },
  // Disable static optimization for pages that need runtime environment variables
  experimental: {
    outputFileTracingRoot: undefined,
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  // Skip trailing slash and other optimizations that might cause issues
  trailingSlash: false,
  
  // Enhanced security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          }
        ],
      },
    ]
  },

};

export default nextConfig;
