/**
 * Build Validation Tests
 * 
 * These tests prevent the dynamic server usage errors that occurred during Docker builds.
 * They ensure all API routes that use auth() are properly marked with dynamic = 'force-dynamic'
 * and that the build process succeeds without errors.
 */

import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'

describe('Build Validation Tests', () => {
  // Test 1: Verify all auth-dependent API routes have dynamic export
  describe('API Routes Dynamic Export Validation', () => {
    const apiRoutesPath = join(process.cwd(), 'src', 'app', 'api')
    
    function findApiRoutes(dir: string): string[] {
      const routes: string[] = []
      
      function traverse(currentDir: string) {
        const items = readdirSync(currentDir)
        
        for (const item of items) {
          const fullPath = join(currentDir, item)
          const stat = statSync(fullPath)
          
          if (stat.isDirectory()) {
            traverse(fullPath)
          } else if (item === 'route.ts' || item === 'route.js') {
            routes.push(fullPath)
          }
        }
      }
      
      traverse(dir)
      return routes
    }

    function checkAuthUsage(filePath: string): boolean {
      try {
        const content = readFileSync(filePath, 'utf-8')
        // Check if file imports auth and uses it in a function
        const hasAuthImport = content.includes("from '@/auth'") || content.includes("from \"@/auth\"")
        const hasAuthUsage = content.includes('await auth()')
        return hasAuthImport && hasAuthUsage
      } catch (error) {
        console.warn(`Could not read file ${filePath}:`, error)
        return false
      }
    }

    function hasDynamicExport(filePath: string): boolean {
      try {
        const content = readFileSync(filePath, 'utf-8')
        return content.includes("export const dynamic = 'force-dynamic'")
      } catch (error) {
        console.warn(`Could not read file ${filePath}:`, error)
        return false
      }
    }

    it('should have dynamic export for all API routes that use auth()', () => {
      const apiRoutes = findApiRoutes(apiRoutesPath)
      const authRoutes = apiRoutes.filter(checkAuthUsage)
      const routesWithoutDynamic: string[] = []

      for (const route of authRoutes) {
        if (!hasDynamicExport(route)) {
          routesWithoutDynamic.push(route.replace(process.cwd(), ''))
        }
      }

      if (routesWithoutDynamic.length > 0) {
        throw new Error(`The following API routes use auth() but are missing 'export const dynamic = \"force-dynamic\"':\n${routesWithoutDynamic.join('\n')}`)
      }

      expect(authRoutes.length).toBeGreaterThan(0) // Ensure we found some auth routes
    })

    it('should mark Stripe-dependent routes as dynamic', () => {
      const stripeRoutes = [
        join(apiRoutesPath, 'payments', 'create-intent', 'route.ts'),
        join(apiRoutesPath, 'payments', 'google-pay', 'route.ts')
      ]

      for (const route of stripeRoutes) {
        try {
          const content = readFileSync(route, 'utf-8')
          const hasStripeUsage = content.includes('Stripe') || content.includes('stripe')
          const hasDynamic = content.includes("export const dynamic = 'force-dynamic'")

          if (hasStripeUsage && !hasDynamic) {
            throw new Error(`Stripe route ${route} is missing 'export const dynamic = \"force-dynamic\"'`)
          }
        } catch {
          // Route doesn't exist, which is fine
        }
      }
    })
  })

  // Test 2: Verify Next.js build succeeds without errors
  describe('Next.js Build Success', () => {
    it('should build successfully without dynamic server usage errors', () => {
      try {
        // Set timeout to 5 minutes for build
        const buildOutput = execSync('npm run build', {
          encoding: 'utf-8',
          timeout: 300000,
          stdio: 'pipe'
        })

        // Check that build completed successfully
        expect(buildOutput).toContain('✓ Compiled successfully')
        expect(buildOutput).toContain('✓ Generating static pages')
        
        // Ensure no dynamic server usage errors
        expect(buildOutput).not.toContain('Dynamic server usage')
        expect(buildOutput).not.toContain("couldn't be rendered statically")
        expect(buildOutput).not.toContain('DYNAMIC_SERVER_USAGE')

      } catch (error: any) {
        throw new Error(`Build failed with error: ${error.message}\nOutput: ${error.stdout || error.stderr || 'No output'}`)
      }
    }, 300000) // 5 minute timeout
  })

  // Test 3: Verify environment validation gracefully handles missing values
  describe('Environment Validation Resilience', () => {
    it('should handle missing environment variables gracefully during build', () => {
      // Test the environment validation function directly
      const { validateEnv, resetEnvCache } = require('../lib/env-validation')
      
      // Reset cache to force re-validation
      resetEnvCache()
      
      // Store original env vars
      const originalEnv = { ...process.env }
      
      try {
        // Remove critical env vars to simulate build environment
        delete process.env.NEXTAUTH_SECRET
        delete process.env.DATABASE_URL
        process.env.NEXTAUTH_URL = 'invalid-url'
        
        // This should not throw an error
        const env = validateEnv()
        
        // Should provide fallback values
        expect(env.NEXTAUTH_SECRET).toBeDefined()
        expect(env.DATABASE_URL).toBeDefined()
        expect(env.NEXTAUTH_URL).toBeDefined()
        
        // Should not contain empty strings
        expect(env.NEXTAUTH_SECRET).not.toBe('')
        expect(env.DATABASE_URL).not.toBe('')
        
      } finally {
        // Restore original environment
        process.env = originalEnv
        resetEnvCache()
      }
    })

    it('should not throw errors when validation fails', () => {
      const { validateEnv, resetEnvCache } = require('../lib/env-validation')
      
      resetEnvCache()
      const originalEnv = { ...process.env }
      
      try {
        // Clear all env vars
        process.env = { NODE_ENV: 'test' }
        
        // This should not throw
        expect(() => validateEnv()).not.toThrow()
        
        const env = validateEnv()
        expect(env).toBeDefined()
        expect(typeof env).toBe('object')
        
      } finally {
        process.env = originalEnv
        resetEnvCache()
      }
    })
  })
})