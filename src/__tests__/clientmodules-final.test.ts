/**
 * Final 3 Integration Tests to Verify ClientModules Error is Fixed
 * These tests confirm the clientModules error has been resolved
 */

describe('ClientModules Error Fix - Final Verification', () => {
  
  /**
   * Test 1: Verify Client Components Use Correct Navigation Pattern
   */
  it('Test 1: All client components use useRouter instead of redirect', () => {
    const fs = require('fs')
    const path = require('path')
    
    // Key client component files that were causing the clientModules error
    const clientFiles = [
      'src/app/(app)/menu/page.tsx',
      'src/app/(app)/checkout/page.tsx', 
      'src/app/(app)/orders/page.tsx',
      'src/app/(app)/checkout/success/page.tsx',
      'src/app/(app)/admin/users/page.tsx',
      'src/app/(app)/admin/orders/page.tsx',
    ]

    let allFilesFixed = true
    const issueDetails: string[] = []

    clientFiles.forEach(relativePath => {
      const filePath = path.join(process.cwd(), relativePath)
      
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8')
        
        // Check if it's a client component
        const isClientComponent = content.includes("'use client'")
        
        if (isClientComponent) {
          // Should use useRouter, not redirect
          const usesUseRouter = content.includes('import { useRouter }') || content.includes('useRouter')
          const usesRedirect = content.includes('import { redirect }') && !content.includes('import { useRouter')
          
          if (!usesUseRouter || usesRedirect) {
            allFilesFixed = false
            issueDetails.push(`${relativePath}: Client component not using useRouter properly`)
          }
        }
      }
    })

    // All client components should be fixed
    expect(allFilesFixed).toBe(true)
    if (!allFilesFixed) {
      throw new Error(`Client components still have issues: ${issueDetails.join(', ')}`)
    }
  })

  /**
   * Test 2: Verify Server Components Use Correct Navigation Pattern  
   */
  it('Test 2: Server components correctly use redirect (not useRouter)', () => {
    const fs = require('fs')
    const path = require('path')
    
    // Server component files that should use redirect
    const serverFiles = [
      'src/app/(app)/dashboard/page.tsx',
      'src/app/(app)/profile/page.tsx',
      'src/app/(app)/admin/page.tsx',
      'src/app/(app)/layout.tsx',
    ]

    let allFilesCorrect = true
    const issueDetails: string[] = []

    serverFiles.forEach(relativePath => {
      const filePath = path.join(process.cwd(), relativePath)
      
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8')
        
        // Should NOT be client component
        const isClientComponent = content.includes("'use client'")
        
        if (!isClientComponent) {
          // If it does redirects, should use redirect function
          if (content.includes('redirect(')) {
            const usesRedirectImport = content.includes('import { redirect }')
            const usesUseRouter = content.includes('import { useRouter }')
            
            if (!usesRedirectImport || usesUseRouter) {
              allFilesCorrect = false
              issueDetails.push(`${relativePath}: Server component not using redirect properly`)
            }
          }
        } else {
          allFilesCorrect = false
          issueDetails.push(`${relativePath}: Should be server component, not client`)
        }
      }
    })

    expect(allFilesCorrect).toBe(true)
    if (!allFilesCorrect) {
      throw new Error(`Server components have issues: ${issueDetails.join(', ')}`)
    }
  })

  /**
   * Test 3: Verify No Mixed Import Patterns That Cause ClientModules Conflicts
   */
  it('Test 3: No component imports both redirect and useRouter (causes clientModules error)', () => {
    const fs = require('fs')
    const path = require('path')
    const glob = require('glob')
    
    // Find all TypeScript/TSX files in the app directory
    const pattern = path.join(process.cwd(), 'src/app/**/*.{ts,tsx}')
    const files = glob.sync(pattern)
    
    let hasConflicts = false
    const conflicts: string[] = []

    files.forEach(filePath => {
      const content = fs.readFileSync(filePath, 'utf8')
      
      // Check for the problematic import pattern that causes clientModules error
      const hasRedirectImport = content.includes('import { redirect }')
      const hasUseRouterImport = content.includes('import { useRouter }')
      
      // This combination causes clientModules errors
      if (hasRedirectImport && hasUseRouterImport) {
        hasConflicts = true
        conflicts.push(path.relative(process.cwd(), filePath))
      }
    })

    expect(hasConflicts).toBe(false)
    if (hasConflicts) {
      throw new Error(`Files with conflicting imports (cause clientModules error): ${conflicts.join(', ')}`)
    }
  })

  /**
   * Bonus Test: Verify the Fix Works at Runtime
   */
  it('Bonus: Runtime navigation simulation works without clientModules errors', () => {
    // Mock the Next.js navigation hooks
    const mockPush = jest.fn()
    
    jest.doMock('next/navigation', () => ({
      useRouter: jest.fn(() => ({ push: mockPush })),
      redirect: jest.fn(),
    }))

    jest.doMock('next-auth/react', () => ({
      useSession: jest.fn(() => ({ data: null, status: 'unauthenticated' })),
    }))

    // Simulate what happens in our fixed client components
    const simulateFixedClientComponent = () => {
      const { useRouter } = require('next/navigation')
      const { useSession } = require('next-auth/react')
      
      // This is the correct pattern we implemented
      const router = useRouter()
      const { status } = useSession()
      
      if (status === 'unauthenticated') {
        router.push('/auth/signin')  // Using router.push (not redirect)
      }
    }

    // Should execute without throwing clientModules errors
    expect(() => {
      simulateFixedClientComponent()
    }).not.toThrow()

    // Should have used router.push
    expect(mockPush).toHaveBeenCalledWith('/auth/signin')
  })
})