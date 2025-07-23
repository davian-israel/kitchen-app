#!/usr/bin/env tsx

/**
 * Complete login flow test for NextAuth v4
 */

import fetch from 'node-fetch'

const BASE_URL = 'http://localhost:3000'

async function testCompleteLoginFlow() {
  console.log('🧪 Testing Complete Login Flow...\n')

  try {
    // Step 1: Get CSRF token
    console.log('1️⃣ Getting CSRF token...')
    const csrfResponse = await fetch(`${BASE_URL}/api/auth/csrf`)
    const csrfData = await csrfResponse.json() as { csrfToken: string }
    console.log('✅ CSRF token obtained')

    // Step 2: Attempt login with credentials
    console.log('\n2️⃣ Attempting login with admin credentials...')
    const loginResponse = await fetch(`${BASE_URL}/api/auth/signin/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@israelkitchen.com',
        password: 'admin123',
        csrfToken: csrfData.csrfToken,
        callbackUrl: `${BASE_URL}/dashboard`,
        json: true
      })
    })

    console.log('📊 Login response status:', loginResponse.status)
    console.log('📊 Login response headers:', Object.fromEntries(loginResponse.headers.entries()))
    
    const loginResult = await loginResponse.json()
    console.log('📊 Login response body:', loginResult)

    if (loginResponse.ok && !loginResult.error) {
      console.log('✅ Login successful!')
      
      // Step 3: Check session with cookies
      console.log('\n3️⃣ Checking session with cookies...')
      const cookies = loginResponse.headers.get('set-cookie') || ''
      console.log('🍪 Cookies received:', cookies)
      
      const sessionResponse = await fetch(`${BASE_URL}/api/auth/session`, {
        headers: {
          'Cookie': cookies
        }
      })
      
      const session = await sessionResponse.json()
      console.log('📊 Session data:', session)
      
      if (session && session.user) {
        console.log('✅ Session established successfully!')
        console.log('👤 User:', session.user.email, '| Role:', session.user.role)
      } else {
        console.log('❌ No session found')
      }
    } else {
      console.log('❌ Login failed:', loginResult.error || 'Unknown error')
    }

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testCompleteLoginFlow()