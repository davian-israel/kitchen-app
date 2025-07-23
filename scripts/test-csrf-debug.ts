#!/usr/bin/env tsx

/**
 * Debug CSRF token handling
 */

import fetch from 'node-fetch'

const BASE_URL = 'http://localhost:3000'

async function debugCSRF() {
  console.log('🔍 Debugging CSRF Token Handling...\n')

  try {
    // Step 1: Get CSRF token
    console.log('1️⃣ Getting CSRF token...')
    const csrfResponse = await fetch(`${BASE_URL}/api/auth/csrf`)
    const csrfData = await csrfResponse.json() as { csrfToken: string }
    console.log('✅ CSRF token:', csrfData.csrfToken)
    console.log('📏 Token length:', csrfData.csrfToken.length)

    // Step 2: Try different CSRF token formats
    console.log('\n2️⃣ Testing different CSRF formats...')
    
    const testFormats = [
      {
        name: 'Standard form data',
        data: new URLSearchParams({
          email: 'admin@israelkitchen.com',
          password: 'admin123',
          csrfToken: csrfData.csrfToken,
          callbackUrl: `${BASE_URL}/dashboard`
        }),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      },
      {
        name: 'JSON format',
        data: JSON.stringify({
          email: 'admin@israelkitchen.com',
          password: 'admin123',
          csrfToken: csrfData.csrfToken,
          callbackUrl: `${BASE_URL}/dashboard`
        }),
        headers: { 'Content-Type': 'application/json' }
      }
    ]

    for (const format of testFormats) {
      console.log(`\n🧪 Testing ${format.name}...`)
      
      const response = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
        method: 'POST',
        headers: format.headers,
        body: format.data
      })

      console.log('📊 Status:', response.status)
      const result = await response.json()
      console.log('📊 Result:', result)
      
      if (!result.url || !result.url.includes('csrf=true')) {
        console.log('✅ This format might work!')
      } else {
        console.log('❌ Still getting CSRF error')
      }
    }

    // Step 3: Check if we can see any server logs
    console.log('\n3️⃣ Check the server console for any authorize function logs...')
    console.log('If you see logs starting with "🔍 NextAuth authorize called", the function is being called.')
    console.log('If not, the CSRF validation is blocking the request before it reaches our authorize function.')

  } catch (error) {
    console.error('❌ Debug failed:', error)
  }
}

// Run the debug
debugCSRF()