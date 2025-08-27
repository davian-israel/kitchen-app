/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    outputFileTracingRoot: undefined,
  },
  eslint: {
    // SECURITY FIX: Enable in production unless explicitly skipped for build environments
    ignoreDuringBuilds: process.env.NODE_ENV === 'development' || process.env.SKIP_ENV_VALIDATION === 'true',
  },
  typescript: {
    // SECURITY FIX: Enable in production unless explicitly skipped for build environments
    ignoreBuildErrors: process.env.NODE_ENV === 'development' || process.env.SKIP_ENV_VALIDATION === 'true',
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

  // SECURITY: Only disable validation in development/build environments  
  ...(process.env.SKIP_ENV_VALIDATION === 'true' && process.env.NODE_ENV !== 'production' && {
    typescript: {
      ignoreBuildErrors: true,
    },
    eslint: {
      ignoreDuringBuilds: true,
    },
  }),
};

export default nextConfig;
