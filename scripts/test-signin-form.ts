#!/usr/bin/env tsx

/**
 * Test script that mimics the signin form behavior
 */

import fetch from 'node-fetch'

const BASE_URL = 'http://localhost:3000'

async function testSigninForm() {
  console.log('🧪 Testing Signin Form Behavior...\n')

  try {
    // Step 1: Get the signin page to see if it loads
    console.log('1️⃣ Loading signin page...')
    const signinPageResponse = await fetch(`${BASE_URL}/auth/signin`)
    console.log('✅ Signin page status:', signinPageResponse.status)

    // Step 2: Get CSRF token
    console.log('\n2️⃣ Getting CSRF token...')
    const csrfResponse = await fetch(`${BASE_URL}/api/auth/csrf`)
    const csrfData = await csrfResponse.json() as { csrfToken: string }
    console.log('✅ CSRF token obtained:', csrfData.csrfToken.substring(0, 20) + '...')

    // Step 3: Get providers
    console.log('\n3️⃣ Getting providers...')
    const providersResponse = await fetch(`${BASE_URL}/api/auth/providers`)
    const providers = await providersResponse.json()
    console.log('✅ Providers:', Object.keys(providers))

    // Step 4: Test the credentials provider directly
    console.log('\n4️⃣ Testing credentials provider...')
    
    // Use the same format as the frontend form
    const formData = new URLSearchParams({
      email: 'admin@israelkitchen.com',
      password: 'admin123',
      csrfToken: csrfData.csrfToken,
      callbackUrl: `${BASE_URL}/dashboard`,
      json: 'true'
    })

    const loginResponse = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
      redirect: 'manual' // Don't follow redirects automatically
    })

    console.log('📊 Login response status:', loginResponse.status)
    console.log('📊 Login response headers:', Object.fromEntries(loginResponse.headers.entries()))
    
    if (loginResponse.status === 302) {
      const location = loginResponse.headers.get('location')
      console.log('📍 Redirect location:', location)
      
      if (location && location.includes('/dashboard')) {
        console.log('✅ Login successful - redirecting to dashboard!')
        
        // Get cookies from the response
        const cookies = loginResponse.headers.get('set-cookie')
        console.log('🍪 Session cookies:', cookies)
        
        // Test session with cookies
        if (cookies) {
          console.log('\n5️⃣ Testing session with cookies...')
          const sessionResponse = await fetch(`${BASE_URL}/api/auth/session`, {
            headers: {
              'Cookie': cookies
            }
          })
          
          const session = await sessionResponse.json()
          console.log('📊 Session data:', session)
          
          if (session && session.user) {
            console.log('🎉 SUCCESS! Admin login working!')
            console.log('👤 User:', session.user.email)
            console.log('🔑 Role:', session.user.role)
          }
        }
      } else if (location && location.includes('error')) {
        console.log('❌ Login failed - redirected to error page')
      }
    } else {
      const responseText = await loginResponse.text()
      console.log('📊 Response body:', responseText.substring(0, 200) + '...')
    }

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testSigninForm()