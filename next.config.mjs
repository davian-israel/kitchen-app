/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    outputFileTracingRoot: undefined,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  // Disable static optimization for pages that need runtime environment variables
  experimental: {
    outputFileTracingRoot: undefined,
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  // Skip trailing slash and other optimizations that might cause issues
  trailingSlash: false,
  // Disable static optimization during build
  ...(process.env.SKIP_ENV_VALIDATION === 'true' && {
    typescript: {
      ignoreBuildErrors: true,
    },
    eslint: {
      ignoreDuringBuilds: true,
    },
  }),
};

export default nextConfig;
