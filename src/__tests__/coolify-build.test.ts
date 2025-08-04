/**
 * Coolify Build Tests
 * 
 * These tests simulate Coolify deployment conditions and verify that builds
 * succeed even when environment variables are missing or malformed.
 */

import { execSync } from 'child_process'
import { readFileSync } from 'fs'

describe('Coolify Build Validation', () => {
  const originalEnv = { ...process.env }

  afterEach(() => {
    // Restore original environment
    process.env = { ...originalEnv }
  })

  describe('Environment Variable Resilience', () => {
    it('should handle missing NEXTAUTH_URL during build', () => {
      const { validateEnv, resetEnvCache } = require('../lib/env-validation')
      
      resetEnvCache()
      
      // Simulate missing NEXTAUTH_URL (common in Coolify)
      delete process.env.NEXTAUTH_URL
      
      const env = validateEnv()
      
      // Should provide fallback
      expect(env.NEXTAUTH_URL).toBe('http://localhost:3000')
      expect(env.NEXTAUTH_URL).not.toBe('')
    })

    it('should handle empty environment variables during build', () => {
      const { validateEnv, resetEnvCache } = require('../lib/env-validation')
      
      resetEnvCache()
      
      // Simulate empty environment variables (Coolify issue)
      process.env.NEXTAUTH_URL = ''
      process.env.NEXTAUTH_SECRET = ''
      process.env.DATABASE_URL = ''
      
      const env = validateEnv()
      
      // Should provide fallbacks, not throw
      expect(env.NEXTAUTH_URL).toBeDefined()
      expect(env.NEXTAUTH_SECRET).toBeDefined()
      expect(env.DATABASE_URL).toBeDefined()
      
      // Should not be empty strings
      expect(env.NEXTAUTH_URL).not.toBe('')
      expect(env.NEXTAUTH_SECRET).not.toBe('')
      expect(env.DATABASE_URL).not.toBe('')
    })

    it('should skip validation when SKIP_ENV_VALIDATION is true', () => {
      const { validateEnv, resetEnvCache } = require('../lib/env-validation')
      
      resetEnvCache()
      
      // Simulate Coolify build environment
      process.env.SKIP_ENV_VALIDATION = 'true'
      delete process.env.NEXTAUTH_URL
      delete process.env.NEXTAUTH_SECRET
      delete process.env.DATABASE_URL
      
      // Should not throw
      expect(() => validateEnv()).not.toThrow()
      
      const env = validateEnv()
      expect(env.SKIP_ENV_VALIDATION).toBe('true')
      expect(env.NEXTAUTH_URL).toBeDefined()
    })
  })

  describe('Docker Build Simulation', () => {
    it('should build successfully without environment variables', () => {
      try {
        // Simulate Docker build with minimal environment
        const buildOutput = execSync('SKIP_ENV_VALIDATION=true npm run build', {
          encoding: 'utf-8',
          timeout: 300000,
          env: {
            ...process.env,
            NODE_ENV: 'production',
            SKIP_ENV_VALIDATION: 'true',
            // Clear potentially problematic env vars
            NEXTAUTH_URL: undefined,
            NEXTAUTH_SECRET: undefined,
            DATABASE_URL: undefined,
            STRIPE_SECRET_KEY: undefined,
          }
        })

        // Check build succeeded
        expect(buildOutput).toContain('✓ Compiled successfully')
        expect(buildOutput).not.toContain('ERR_INVALID_URL')
        expect(buildOutput).not.toContain('TypeError')
        expect(buildOutput).not.toContain('Export encountered errors')

      } catch (error: any) {
        fail(`Coolify-style build failed: ${error.message}\nOutput: ${error.stdout || error.stderr}`)
      }
    }, 300000) // 5 minute timeout

    it('should have valid fallback URLs that work with URL constructor', () => {
      const { validateEnv, resetEnvCache } = require('../lib/env-validation')
      
      resetEnvCache()
      
      // Clear environment
      delete process.env.NEXTAUTH_URL
      
      const env = validateEnv()
      
      // Test that fallback URL works with URL constructor
      expect(() => new URL(env.NEXTAUTH_URL)).not.toThrow()
      
      const url = new URL(env.NEXTAUTH_URL)
      expect(url.protocol).toBeDefined()
      expect(url.host).toBeDefined()
    })
  })

  describe('Dockerfile Configuration', () => {
    it('should have proper build arguments and defaults in Dockerfile', () => {
      const dockerfileContent = readFileSync('Dockerfile', 'utf-8')
      
      // Check for build args with defaults
      expect(dockerfileContent).toContain('ARG DATABASE_URL=')
      expect(dockerfileContent).toContain('ARG NEXTAUTH_URL=')  
      expect(dockerfileContent).toContain('ARG NEXTAUTH_SECRET=')
      
      // Check for environment variable fallbacks
      expect(dockerfileContent).toContain('ENV DATABASE_URL=${DATABASE_URL:-')
      expect(dockerfileContent).toContain('ENV NEXTAUTH_URL=${NEXTAUTH_URL:-')
      
      // Check for build skip flag
      expect(dockerfileContent).toContain('SKIP_ENV_VALIDATION=true')
    })

    it('should handle build without explicit build args', () => {
      // Test Docker build without build args (Coolify scenario)
      try {
        execSync('docker build -t test-coolify-build .', {
          timeout: 600000,
          stdio: 'pipe'
        })
      } catch (error: any) {
        // If Docker is not available, skip this test
        if (error.message.includes('docker: command not found')) {
          console.warn('Docker not available, skipping Docker build test')
          return
        }
        
        fail(`Docker build without args failed: ${error.message}`)
      }
    }, 600000) // 10 minute timeout
  })

  describe('Next.js Configuration', () => {
    it('should have proper configuration for build resilience', () => {
      const nextConfigContent = readFileSync('next.config.mjs', 'utf-8')
      
      // Check for standalone output (required for Docker)
      expect(nextConfigContent).toContain("output: 'standalone'")
      
      // Check for build error tolerance
      expect(nextConfigContent).toContain('ignoreBuildErrors: true')
      expect(nextConfigContent).toContain('ignoreDuringBuilds: true')
      
      // Check for Prisma external package config
      expect(nextConfigContent).toContain('@prisma/client')
    })
  })

  describe('Page Rendering', () => {
    it('should not fail during static generation with missing env vars', () => {
      // This test ensures pages don't crash during build-time rendering
      const { validateEnv } = require('../lib/env-validation')
      
      // Simulate build environment
      process.env.SKIP_ENV_VALIDATION = 'true'
      delete process.env.NEXTAUTH_URL
      
      const env = validateEnv()
      
      // Should be able to create URL objects without throwing
      expect(() => new URL(env.NEXTAUTH_URL)).not.toThrow()
    })
  })
})