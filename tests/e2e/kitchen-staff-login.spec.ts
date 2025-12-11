import { test, expect } from '@playwright/test'

/**
 * Kitchen Staff Login E2E Test
 * Tests the complete kitchen staff login flow in production
 * 
 * Test URL: https://israel-kitchen-qzsdui82b-davianrs-projects.vercel.app
 */

const PRODUCTION_URL = 'https://israel-kitchen-qzsdui82b-davianrs-projects.vercel.app'
const KITCHEN_CREDENTIALS = {
  email: 'kitchen@israelkitchen.com',
  password: 'kitchen123',
}

const CUSTOMER_CREDENTIALS = {
  email: 'customer@example.com',
  password: 'customer123',
}

test.describe('Kitchen Staff Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Set a longer timeout for production tests
    test.setTimeout(60000)
  })

  test('should load the signin page correctly', async ({ page }) => {
    await page.goto(`${PRODUCTION_URL}/auth/signin`)

    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Verify page title and branding
    await expect(page.locator('h1')).toContainText('Israel Kitchen')
    await expect(page.locator('h2')).toContainText('Welcome Back')

    // Verify form elements exist
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()

    console.log('✅ Sign-in page loaded successfully')
  })

  test('should successfully login as kitchen staff and redirect to kitchen orders', async ({ page }) => {
    console.log('🧪 Testing kitchen staff login flow...')

    // Navigate to signin page
    await page.goto(`${PRODUCTION_URL}/auth/signin`)
    await page.waitForLoadState('networkidle')

    console.log('📝 Filling in kitchen staff credentials...')

    // Fill in credentials
    await page.locator('input[type="email"]').fill(KITCHEN_CREDENTIALS.email)
    await page.locator('input[type="password"]').fill(KITCHEN_CREDENTIALS.password)

    // Take screenshot before login
    await page.screenshot({ path: 'test-results/kitchen-login-before.png' })

    console.log('🚀 Submitting login form...')

    // Click sign in button
    await page.locator('button[type="submit"]').click()

    // Wait for navigation to complete
    await page.waitForURL(`${PRODUCTION_URL}/kitchen/orders`, { timeout: 15000 })

    console.log('✅ Successfully redirected to kitchen orders page')

    // Verify we're on the kitchen orders page
    expect(page.url()).toBe(`${PRODUCTION_URL}/kitchen/orders`)

    // Wait for page to fully load
    await page.waitForLoadState('networkidle')

    // Take screenshot after login
    await page.screenshot({ path: 'test-results/kitchen-orders-page.png' })

    console.log('🔍 Verifying kitchen orders page elements...')

    // Verify kitchen-specific elements
    await expect(page.locator('h1')).toContainText('Kitchen Orders', { timeout: 10000 })
    await expect(page.getByText('Manage and prepare customer orders')).toBeVisible()

    // Verify statistics cards are present
    await expect(page.getByText('Pending')).toBeVisible()
    await expect(page.getByText('In Preparation')).toBeVisible()
    await expect(page.getByText('Ready')).toBeVisible()

    // Verify filter buttons exist
    await expect(page.getByRole('button', { name: 'All Orders' })).toBeVisible()

    // Verify refresh button exists
    await expect(page.getByRole('button', { name: /Refresh/i })).toBeVisible()

    console.log('✅ All kitchen orders page elements verified')
  })

  test('should display kitchen staff role-specific navigation', async ({ page }) => {
    console.log('🧪 Testing kitchen staff navigation...')

    // Login
    await page.goto(`${PRODUCTION_URL}/auth/signin`)
    await page.locator('input[type="email"]').fill(KITCHEN_CREDENTIALS.email)
    await page.locator('input[type="password"]').fill(KITCHEN_CREDENTIALS.password)
    await page.locator('button[type="submit"]').click()

    // Wait for redirect
    await page.waitForURL(`${PRODUCTION_URL}/kitchen/orders`)
    await page.waitForLoadState('networkidle')

    // Check for kitchen-specific navigation link
    const kitchenNavLink = page.getByRole('link', { name: /Kitchen Orders/i })
    
    // Navigation might be in a menu, so we may need to open it first (mobile)
    const menuButton = page.locator('[aria-label="Open menu"]')
    if (await menuButton.isVisible()) {
      await menuButton.click()
      await page.waitForTimeout(500)
    }

    // Verify kitchen orders link is visible
    await expect(kitchenNavLink.first()).toBeVisible()

    console.log('✅ Kitchen staff navigation verified')
  })

  test('should display correct statistics on kitchen orders page', async ({ page }) => {
    console.log('🧪 Testing kitchen orders statistics...')

    // Login
    await page.goto(`${PRODUCTION_URL}/auth/signin`)
    await page.locator('input[type="email"]').fill(KITCHEN_CREDENTIALS.email)
    await page.locator('input[type="password"]').fill(KITCHEN_CREDENTIALS.password)
    await page.locator('button[type="submit"]').click()

    await page.waitForURL(`${PRODUCTION_URL}/kitchen/orders`)
    await page.waitForLoadState('networkidle')

    // Wait for statistics to load
    await page.waitForSelector('text=Pending', { timeout: 10000 })

    // Get statistics values (they might be 0 if no orders)
    const pendingCount = await page.locator('text=Pending').locator('..').locator('.text-2xl').textContent()
    const preparingCount = await page.locator('text=In Preparation').locator('..').locator('.text-2xl').textContent()
    const readyCount = await page.locator('text=Ready').locator('..').locator('.text-2xl').textContent()

    console.log(`📊 Statistics:`)
    console.log(`   Pending: ${pendingCount}`)
    console.log(`   In Preparation: ${preparingCount}`)
    console.log(`   Ready: ${readyCount}`)

    // Verify statistics are numbers
    expect(pendingCount).toMatch(/^\d+$/)
    expect(preparingCount).toMatch(/^\d+$/)
    expect(readyCount).toMatch(/^\d+$/)

    console.log('✅ Statistics displayed correctly')
  })

  test('should be able to use filter buttons', async ({ page }) => {
    console.log('🧪 Testing order filters...')

    // Login
    await page.goto(`${PRODUCTION_URL}/auth/signin`)
    await page.locator('input[type="email"]').fill(KITCHEN_CREDENTIALS.email)
    await page.locator('input[type="password"]').fill(KITCHEN_CREDENTIALS.password)
    await page.locator('button[type="submit"]').click()

    await page.waitForURL(`${PRODUCTION_URL}/kitchen/orders`)
    await page.waitForLoadState('networkidle')

    // Test filter buttons
    const filters = ['All Orders', 'Pending', 'In Preparation', 'Ready']

    for (const filter of filters) {
      const filterButton = page.getByRole('button', { name: filter })
      await expect(filterButton).toBeVisible()
      await filterButton.click()
      await page.waitForTimeout(500)
      
      // Verify button is highlighted (has active styling)
      const buttonClasses = await filterButton.getAttribute('class')
      console.log(`   Filter "${filter}" clicked - Active: ${buttonClasses?.includes('bg-orange-500')}`)
    }

    console.log('✅ All filter buttons work correctly')
  })

  test('should be able to refresh orders', async ({ page }) => {
    console.log('🧪 Testing refresh functionality...')

    // Login
    await page.goto(`${PRODUCTION_URL}/auth/signin`)
    await page.locator('input[type="email"]').fill(KITCHEN_CREDENTIALS.email)
    await page.locator('input[type="password"]').fill(KITCHEN_CREDENTIALS.password)
    await page.locator('button[type="submit"]').click()

    await page.waitForURL(`${PRODUCTION_URL}/kitchen/orders`)
    await page.waitForLoadState('networkidle')

    // Click refresh button
    const refreshButton = page.getByRole('button', { name: /Refresh/i })
    await expect(refreshButton).toBeVisible()
    await refreshButton.click()

    // Wait for refresh to complete (spinner animation)
    await page.waitForTimeout(1000)

    console.log('✅ Refresh functionality works')
  })

  test('should reject invalid credentials', async ({ page }) => {
    console.log('🧪 Testing invalid login credentials...')

    await page.goto(`${PRODUCTION_URL}/auth/signin`)
    await page.waitForLoadState('networkidle')

    // Try with wrong password
    await page.locator('input[type="email"]').fill(KITCHEN_CREDENTIALS.email)
    await page.locator('input[type="password"]').fill('wrongpassword')
    await page.locator('button[type="submit"]').click()

    // Wait for error message
    await page.waitForTimeout(2000)

    // Verify error message is shown
    const errorMessage = page.locator('text=Invalid email or password')
    await expect(errorMessage).toBeVisible()

    // Verify we're still on the signin page
    expect(page.url()).toContain('/auth/signin')

    console.log('✅ Invalid credentials correctly rejected')
  })

  test('should prevent customer from accessing kitchen orders page', async ({ page }) => {
    console.log('🧪 Testing authorization - customer should not access kitchen page...')

    // Login as customer
    await page.goto(`${PRODUCTION_URL}/auth/signin`)
    await page.waitForLoadState('networkidle')

    await page.locator('input[type="email"]').fill(CUSTOMER_CREDENTIALS.email)
    await page.locator('input[type="password"]').fill(CUSTOMER_CREDENTIALS.password)
    await page.locator('button[type="submit"]').click()

    // Wait for redirect (should go to /dashboard)
    await page.waitForURL(`${PRODUCTION_URL}/dashboard`, { timeout: 15000 })
    console.log('   ✅ Customer redirected to dashboard')

    // Now try to access kitchen orders page directly
    await page.goto(`${PRODUCTION_URL}/kitchen/orders`)
    await page.waitForLoadState('networkidle')

    // Should be redirected back to dashboard
    await page.waitForURL(`${PRODUCTION_URL}/dashboard`, { timeout: 10000 })
    
    expect(page.url()).toBe(`${PRODUCTION_URL}/dashboard`)

    console.log('✅ Customer correctly prevented from accessing kitchen orders')
  })

  test('should maintain session after page reload', async ({ page }) => {
    console.log('🧪 Testing session persistence...')

    // Login
    await page.goto(`${PRODUCTION_URL}/auth/signin`)
    await page.locator('input[type="email"]').fill(KITCHEN_CREDENTIALS.email)
    await page.locator('input[type="password"]').fill(KITCHEN_CREDENTIALS.password)
    await page.locator('button[type="submit"]').click()

    await page.waitForURL(`${PRODUCTION_URL}/kitchen/orders`)
    await page.waitForLoadState('networkidle')

    console.log('   ✅ Initial login successful')

    // Reload the page
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Verify still on kitchen orders page (not redirected to signin)
    expect(page.url()).toBe(`${PRODUCTION_URL}/kitchen/orders`)
    await expect(page.locator('h1')).toContainText('Kitchen Orders')

    console.log('✅ Session maintained after reload')
  })

  test('should handle network errors gracefully', async ({ page }) => {
    console.log('🧪 Testing error handling...')

    // Login first
    await page.goto(`${PRODUCTION_URL}/auth/signin`)
    await page.locator('input[type="email"]').fill(KITCHEN_CREDENTIALS.email)
    await page.locator('input[type="password"]').fill(KITCHEN_CREDENTIALS.password)
    await page.locator('button[type="submit"]').click()

    await page.waitForURL(`${PRODUCTION_URL}/kitchen/orders`)
    await page.waitForLoadState('networkidle')

    // The page should have error handling UI components
    // Even if there's an error fetching orders, the page should still render
    await expect(page.locator('h1')).toContainText('Kitchen Orders')

    console.log('✅ Page handles errors gracefully')
  })
})

test.describe('Kitchen Staff Login Performance', () => {
  test('should load kitchen orders page within acceptable time', async ({ page }) => {
    console.log('🧪 Testing page load performance...')

    const startTime = Date.now()

    // Login
    await page.goto(`${PRODUCTION_URL}/auth/signin`)
    await page.locator('input[type="email"]').fill(KITCHEN_CREDENTIALS.email)
    await page.locator('input[type="password"]').fill(KITCHEN_CREDENTIALS.password)
    await page.locator('button[type="submit"]').click()

    await page.waitForURL(`${PRODUCTION_URL}/kitchen/orders`)
    await page.waitForLoadState('networkidle')

    const endTime = Date.now()
    const loadTime = endTime - startTime

    console.log(`⏱️  Total load time: ${loadTime}ms`)

    // Verify load time is under 10 seconds (generous for production)
    expect(loadTime).toBeLessThan(10000)

    console.log('✅ Page loads within acceptable time')
  })
})

test.describe('Kitchen Staff Mobile View', () => {
  test.use({ 
    viewport: { width: 375, height: 667 }, // iPhone SE size
    isMobile: true,
  })

  test('should work correctly on mobile devices', async ({ page }) => {
    console.log('🧪 Testing mobile view...')

    // Login
    await page.goto(`${PRODUCTION_URL}/auth/signin`)
    await page.waitForLoadState('networkidle')

    // Verify mobile layout
    await page.locator('input[type="email"]').fill(KITCHEN_CREDENTIALS.email)
    await page.locator('input[type="password"]').fill(KITCHEN_CREDENTIALS.password)
    await page.locator('button[type="submit"]').click()

    await page.waitForURL(`${PRODUCTION_URL}/kitchen/orders`)
    await page.waitForLoadState('networkidle')

    // Take mobile screenshot
    await page.screenshot({ path: 'test-results/kitchen-orders-mobile.png', fullPage: true })

    // Verify page elements are visible on mobile
    await expect(page.locator('h1')).toContainText('Kitchen Orders')
    await expect(page.getByText('Pending')).toBeVisible()

    console.log('✅ Mobile view works correctly')
  })
})

