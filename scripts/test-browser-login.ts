#!/usr/bin/env tsx

/**
 * Comprehensive browser login test
 */

import fetch from 'node-fetch'

const BASE_URL = 'http://localhost:3000'

async function testBrowserLogin() {
  console.log('🧪 Testing Browser Login Flow...\n')

  try {
    // Step 1: Check if server is running
    console.log('1️⃣ Checking server status...')
    const healthResponse = await fetch(`${BASE_URL}/`)
    console.log('✅ Server is running:', healthResponse.status === 200)

    // Step 2: Check signin page
    console.log('\n2️⃣ Checking signin page...')
    const signinResponse = await fetch(`${BASE_URL}/auth/signin`)
    console.log('✅ Signin page accessible:', signinResponse.status === 200)

    // Step 3: Test session endpoint
    console.log('\n3️⃣ Testing session endpoint...')
    const sessionResponse = await fetch(`${BASE_URL}/api/auth/session`)
    const sessionData = await sessionResponse.json()
    console.log('📊 Current session:', sessionData)

    // Step 4: Get CSRF token
    console.log('\n4️⃣ Getting CSRF token...')
    const csrfResponse = await fetch(`${BASE_URL}/api/auth/csrf`)
    const csrfData = await csrfResponse.json() as { csrfToken: string }
    console.log('✅ CSRF token obtained')

    // Step 5: Test login with proper form data
    console.log('\n5️⃣ Testing login...')
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
      body: formData
    })

    console.log('📊 Login response status:', loginResponse.status)
    const loginResult = await loginResponse.json()
    console.log('📊 Login result:', loginResult)

    // Check if login was successful
    if (loginResult.url && !loginResult.url.includes('error')) {
      console.log('✅ Login appears successful!')
      
      // Get cookies
      const cookies = loginResponse.headers.get('set-cookie')
      if (cookies) {
        console.log('🍪 Session cookies set')
        
        // Test authenticated session
        console.log('\n6️⃣ Testing authenticated session...')
        const authSessionResponse = await fetch(`${BASE_URL}/api/auth/session`, {
          headers: {
            'Cookie': cookies
          }
        })
        
        const authSession = await authSessionResponse.json()
        console.log('📊 Authenticated session:', authSession)
        
        if (authSession && authSession.user) {
          console.log('🎉 SUCCESS! Admin login is working!')
          console.log('👤 User:', authSession.user.email)
          console.log('🔑 Role:', authSession.user.role)
          
          // Test dashboard access
          console.log('\n7️⃣ Testing dashboard access...')
          const dashboardResponse = await fetch(`${BASE_URL}/dashboard`, {
            headers: {
              'Cookie': cookies
            },
            redirect: 'manual'
          })
          
          console.log('📊 Dashboard access status:', dashboardResponse.status)
          if (dashboardResponse.status === 200) {
            console.log('✅ Dashboard accessible!')
          } else if (dashboardResponse.status === 307 || dashboardResponse.status === 302) {
            console.log('📍 Dashboard redirected to:', dashboardResponse.headers.get('location'))
          }
        } else {
          console.log('❌ Session not established properly')
        }
      }
    } else {
      console.log('❌ Login failed or redirected to error')
    }

    console.log('\n📋 MANUAL TEST INSTRUCTIONS:')
    console.log('1. Open browser to: http://localhost:3000/auth/signin')
    console.log('2. Enter credentials:')
    console.log('   📧 Email: admin@israelkitchen.com')
    console.log('   🔑 Password: admin123')
    console.log('3. Click "Sign In"')
    console.log('4. Check if you are redirected to dashboard')

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testBrowserLogin()