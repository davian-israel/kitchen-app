#!/usr/bin/env tsx

/**
 * Test different CSRF token formats for NextAuth v4
 */

import fetch from 'node-fetch'

const BASE_URL = 'http://localhost:3000'

async function testCSRFFormats() {
  console.log('🔍 Testing Different CSRF Token Formats...\n')

  try {
    // Step 1: Get CSRF token
    console.log('1️⃣ Getting CSRF token...')
    const csrfResponse = await fetch(`${BASE_URL}/api/auth/csrf`)
    const csrfData = await csrfResponse.json() as { csrfToken: string }
    console.log('✅ CSRF token obtained:', csrfData.csrfToken.substring(0, 20) + '...')

    // Step 2: Try without CSRF token (to see if it's disabled)
    console.log('\n2️⃣ Testing without CSRF token...')
    const noCsrfData = new URLSearchParams({
      email: 'admin@israelkitchen.com',
      password: 'admin123',
      callbackUrl: `${BASE_URL}/dashboard`
    })

    const noCsrfResponse = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: noCsrfData
    })

    console.log('📊 No CSRF Status:', noCsrfResponse.status)
    const noCsrfResult = await noCsrfResponse.json()
    console.log('📊 No CSRF Result:', noCsrfResult)

    // Step 3: Try with different CSRF parameter names
    console.log('\n3️⃣ Testing different CSRF parameter names...')
    
    const csrfVariations = [
      { name: 'csrfToken', value: csrfData.csrfToken },
      { name: 'csrf_token', value: csrfData.csrfToken },
      { name: '_token', value: csrfData.csrfToken },
      { name: 'authenticity_token', value: csrfData.csrfToken }
    ]

    for (const variation of csrfVariations) {
      console.log(`\n🧪 Testing with ${variation.name}...`)
      
      const testData = new URLSearchParams({
        email: 'admin@israelkitchen.com',
        password: 'admin123',
        callbackUrl: `${BASE_URL}/dashboard`,
        [variation.name]: variation.value
      })

      const testResponse = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: testData
      })

      console.log('📊 Status:', testResponse.status)
      const testResult = await testResponse.json()
      console.log('📊 Result:', testResult)
      
      if (!testResult.url || !testResult.url.includes('csrf=true')) {
        console.log('✅ This format might work!')
        break
      }
    }

    // Step 4: Check if we can see authorize function logs
    console.log('\n4️⃣ Checking for authorize function logs...')
    console.log('Look at the server console for logs starting with "🔍 NextAuth authorize called"')
    console.log('If you see these logs, the authorize function is being called.')
    console.log('If not, CSRF validation is blocking the request.')

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testCSRFFormats()