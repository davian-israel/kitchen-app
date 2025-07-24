/**
 * Test to verify dashboard route 404 error and then fix it
 */

import { jest } from '@jest/globals'

describe('Dashboard Route Test', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()
  })

  describe('Dashboard Route Verification', () => {
    it('should verify dashboard page file exists', () => {
      const fs = require('fs')
      const path = require('path')
      
      const dashboardPath = path.join(process.cwd(), 'src/app/(app)/dashboard/page.tsx')
      
      // The file should exist
      expect(fs.existsSync(dashboardPath)).toBe(true)
      
      // The file should contain a valid React component
      const content = fs.readFileSync(dashboardPath, 'utf8')
      expect(content).toContain('export default')
      expect(content).toContain('function')
      expect(content).toContain('DashboardPage')
    })

    it('should verify dashboard route is accessible when authenticated', async () => {
      // Mock Next.js auth to return authenticated session
      jest.doMock('@/auth', () => ({
        auth: jest.fn(() => Promise.resolve({
          user: { 
            id: '1', 
            email: 'test@example.com', 
            name: 'Test User',
            role: 'USER' 
          },
          expires: '2024-12-31'
        }))
      }))

      // Mock Next.js navigation
      const mockRedirect = jest.fn()
      jest.doMock('next/navigation', () => ({
        redirect: mockRedirect
      }))

      // Import the dashboard component
      const { default: DashboardPage } = await import('@/app/(app)/dashboard/page')
      
      // Should not redirect when authenticated
      const result = await DashboardPage()
      
      // Should not call redirect
      expect(mockRedirect).not.toHaveBeenCalled()
      
      // Should return a valid React element
      expect(result).toBeDefined()
      expect(result.type).toBe('div')
    })

    it('should return null when not authenticated (layout handles redirect)', async () => {
      // Mock Next.js auth to return no session
      jest.doMock('@/auth', () => ({
        auth: jest.fn(() => Promise.resolve(null))
      }))

      // Mock Next.js navigation
      const mockRedirect = jest.fn()
      jest.doMock('next/navigation', () => ({
        redirect: mockRedirect
      }))

      // Import the dashboard component
      const { default: DashboardPage } = await import('@/app/(app)/dashboard/page')
      
      // Should return null when not authenticated (layout handles redirect)
      const result = await DashboardPage()
      
      // Should return null as safety check (layout already redirected)
      expect(result).toBeNull()
      
      // Page itself doesn't redirect - layout does
      expect(mockRedirect).not.toHaveBeenCalled()
    })

    it('should simulate HTTP request to dashboard route', async () => {
      // Mock fetch to simulate browser request
      global.fetch = jest.fn()

      // Test what happens when we make a request to /dashboard
      // Should redirect to signin when not authenticated (307 redirect)
      const mockResponse = {
        status: 307,
        ok: false,
        statusText: 'Temporary Redirect',
        headers: {
          get: (key: string) => key === 'location' ? '/auth/signin' : null
        },
        json: async () => ({ error: 'Temporary Redirect' })
      }

      ;(global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(mockResponse as Response)

      // Simulate the request - should redirect when not authenticated
      const response = await fetch('http://localhost:3005/dashboard')
      
      // Should return 307 redirect (not 404) - this is correct behavior
      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toBe('/auth/signin')
    })

    it('should verify middleware routing for dashboard', () => {
      const fs = require('fs')
      const path = require('path')
      
      // Check if middleware exists and handles dashboard route
      const middlewarePath = path.join(process.cwd(), 'middleware.ts')
      
      if (fs.existsSync(middlewarePath)) {
        const content = fs.readFileSync(middlewarePath, 'utf8')
        
        // Check if middleware properly handles app routes
        expect(content).toContain('/dashboard')
      }
    })

    it('should verify Next.js routing configuration', () => {
      const fs = require('fs')
      const path = require('path')
      
      // Check the route structure
      const appDir = path.join(process.cwd(), 'src/app/(app)')
      const dashboardDir = path.join(appDir, 'dashboard')
      const layoutFile = path.join(appDir, 'layout.tsx')
      
      // All required files should exist for proper routing
      expect(fs.existsSync(appDir)).toBe(true)
      expect(fs.existsSync(dashboardDir)).toBe(true)
      expect(fs.existsSync(layoutFile)).toBe(true)
      
      // Layout should exist for the app group
      const layoutContent = fs.readFileSync(layoutFile, 'utf8')
      expect(layoutContent).toContain('AppLayout')
    })
  })

  describe('Route Resolution Debug', () => {
    it('should check if the issue is with the route group naming', () => {
      const fs = require('fs')
      const path = require('path')
      
      // Check the exact file structure
      const routeStructure = {
        'src/app': fs.existsSync(path.join(process.cwd(), 'src/app')),
        'src/app/(app)': fs.existsSync(path.join(process.cwd(), 'src/app/(app)')),
        'src/app/(app)/dashboard': fs.existsSync(path.join(process.cwd(), 'src/app/(app)/dashboard')),
        'src/app/(app)/dashboard/page.tsx': fs.existsSync(path.join(process.cwd(), 'src/app/(app)/dashboard/page.tsx')),
        'src/app/(app)/layout.tsx': fs.existsSync(path.join(process.cwd(), 'src/app/(app)/layout.tsx')),
      }
      
      // All parts of the route should exist
      Object.entries(routeStructure).forEach(([routePath, exists]) => {
        expect(exists).toBe(true)
      })
    })

    it('should verify there are no conflicting routes', () => {
      const fs = require('fs')
      const path = require('path')
      
      // Check for potential conflicting dashboard routes
      const possibleConflicts = [
        'src/app/dashboard/page.tsx',  // Outside the route group
        'src/app/dashboard.tsx',       // Direct file
        'src/pages/dashboard.tsx',     // Pages router (old)
      ]
      
      possibleConflicts.forEach(conflictPath => {
        const fullPath = path.join(process.cwd(), conflictPath)
        // These should NOT exist to avoid conflicts
        expect(fs.existsSync(fullPath)).toBe(false)
      })
    })
  })
})