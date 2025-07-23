#!/usr/bin/env tsx

/**
 * Test script to verify admin login works from frontend perspective
 */

import fetch from 'node-fetch'

const BASE_URL = 'http://localhost:3000'

async function testFrontendLogin() {
  console.log('🧪 Testing Frontend Admin Login...\n')

  try {
    // Step 1: Get CSRF token
    console.log('1️⃣ Getting CSRF token...')
    const csrfResponse = await fetch(`${BASE_URL}/api/auth/csrf`)
    const csrfData = await csrfResponse.json() as { csrfToken: string }
    console.log('✅ CSRF token obtained:', csrfData.csrfToken.substring(0, 20) + '...')

    // Step 2: Get providers
    console.log('\n2️⃣ Getting auth providers...')
    const providersResponse = await fetch(`${BASE_URL}/api/auth/providers`)
    const providers = await providersResponse.json()
    console.log('✅ Providers available:', Object.keys(providers))

    // Step 3: Attempt login with credentials
    console.log('\n3️⃣ Attempting login with admin credentials...')
    const loginResponse = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: 'admin@israelkitchen.com',
        password: 'admin123',
        csrfToken: csrfData.csrfToken,
        callbackUrl: `${BASE_URL}/dashboard`,
        json: 'true'
      })
    })

    console.log('📊 Login response status:', loginResponse.status)
    console.log('📊 Login response headers:', Object.fromEntries(loginResponse.headers.entries()))
    
    const loginResult = await loginResponse.text()
    console.log('📊 Login response body:', loginResult)

    if (loginResponse.ok) {
      console.log('✅ Login successful!')
      
      // Step 4: Check session
      console.log('\n4️⃣ Checking session...')
      const sessionResponse = await fetch(`${BASE_URL}/api/auth/session`, {
        headers: {
          'Cookie': loginResponse.headers.get('set-cookie') || ''
        }
      })
      
      const session = await sessionResponse.json()
      console.log('📊 Session data:', session)
      
      if (session.user) {
        console.log('✅ Session established successfully!')
        console.log('👤 User:', session.user.email, '| Role:', session.user.role)
      } else {
        console.log('❌ No session found')
      }
    } else {
      console.log('❌ Login failed')
    }

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testFrontendLogin()