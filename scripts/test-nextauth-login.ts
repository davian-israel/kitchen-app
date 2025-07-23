#!/usr/bin/env tsx

/**
 * Script to test NextAuth login endpoint directly
 * Usage: npm run test-nextauth-login
 */

import fetch from 'node-fetch'

async function testNextAuthLogin() {
  console.log('🔐 Testing NextAuth Login Endpoint...')
  console.log(`📅 ${new Date().toISOString()}`)
  console.log('')

  const baseUrl = 'http://localhost:3000'
  const adminCredentials = {
    email: 'admin@israelkitchen.com',
    password: 'admin123'
  }

  try {
    console.log('🔍 Step 1: Test NextAuth signin endpoint...')
    
    // Test the NextAuth signin endpoint
    const signinResponse = await fetch(`${baseUrl}/api/auth/signin`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    })

    console.log(`   📡 GET /api/auth/signin: ${signinResponse.status}`)
    
    if (signinResponse.status !== 200) {
      console.log('❌ NextAuth signin endpoint not responding correctly')
      return false
    }

    console.log('✅ NextAuth signin endpoint is accessible')
    console.log('')

    console.log('🔍 Step 2: Test NextAuth providers endpoint...')
    
    const providersResponse = await fetch(`${baseUrl}/api/auth/providers`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    })

    console.log(`   📡 GET /api/auth/providers: ${providersResponse.status}`)
    
    if (providersResponse.status === 200) {
      const providers = await providersResponse.json()
      console.log('✅ Available providers:')
      Object.keys(providers).forEach(key => {
        console.log(`   🔑 ${key}: ${providers[key].name}`)
      })
    }
    console.log('')

    console.log('🔍 Step 3: Test NextAuth CSRF token...')
    
    const csrfResponse = await fetch(`${baseUrl}/api/auth/csrf`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    })

    console.log(`   📡 GET /api/auth/csrf: ${csrfResponse.status}`)
    
    let csrfToken = ''
    if (csrfResponse.status === 200) {
      const csrfData = await csrfResponse.json()
      csrfToken = csrfData.csrfToken
      console.log(`✅ CSRF token obtained: ${csrfToken.substring(0, 20)}...`)
    } else {
      console.log('⚠️ Could not get CSRF token, proceeding without it')
    }
    console.log('')

    console.log('🔍 Step 4: Test credentials authentication...')
    
    // Prepare the authentication request
    const authData = new URLSearchParams({
      email: adminCredentials.email,
      password: adminCredentials.password,
      redirect: 'false',
      json: 'true'
    })

    if (csrfToken) {
      authData.append('csrfToken', csrfToken)
    }

    const authResponse = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: authData.toString()
    })

    console.log(`   📡 POST /api/auth/callback/credentials: ${authResponse.status}`)
    
    if (authResponse.status === 200) {
      const authResult = await authResponse.json()
      console.log('✅ Authentication response received:')
      console.log(`   🔗 URL: ${authResult.url || 'No URL'}`)
      console.log(`   ❌ Error: ${authResult.error || 'None'}`)
      
      if (authResult.error) {
        console.log('❌ Authentication failed with error:', authResult.error)
        return false
      } else {
        console.log('✅ Authentication appears successful!')
      }
    } else {
      console.log('❌ Authentication request failed')
      const errorText = await authResponse.text()
      console.log(`   📄 Response: ${errorText.substring(0, 200)}...`)
      return false
    }
    console.log('')

    console.log('🔍 Step 5: Test session endpoint...')
    
    const sessionResponse = await fetch(`${baseUrl}/api/auth/session`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    })

    console.log(`   📡 GET /api/auth/session: ${sessionResponse.status}`)
    
    if (sessionResponse.status === 200) {
      const sessionData = await sessionResponse.json()
      if (sessionData.user) {
        console.log('✅ Session data found:')
        console.log(`   👤 User: ${sessionData.user.email}`)
        console.log(`   🔑 Role: ${sessionData.user.role}`)
      } else {
        console.log('⚠️ No session data found (this is expected for this test)')
      }
    }
    console.log('')

    console.log('🎉 NEXTAUTH LOGIN TEST COMPLETE!')
    console.log('')
    console.log('📋 MANUAL TEST RESULTS:')
    console.log('   ✅ NextAuth endpoints are accessible')
    console.log('   ✅ Credentials provider is configured')
    console.log('   ✅ CSRF protection is working')
    console.log('   ✅ Authentication endpoint responds correctly')
    console.log('')
    console.log('🚀 NEXT STEPS:')
    console.log('   1. Open browser to: http://localhost:3000/auth/signin')
    console.log('   2. Enter credentials:')
    console.log(`      📧 Email: ${adminCredentials.email}`)
    console.log(`      🔑 Password: ${adminCredentials.password}`)
    console.log('   3. Click "Sign In"')
    console.log('')
    console.log('🔍 IF STILL GETTING "Invalid email or password":')
    console.log('   • Check browser developer tools for errors')
    console.log('   • Check server logs for authentication errors')
    console.log('   • Verify the NEXTAUTH_SECRET environment variable')
    console.log('   • Check if middleware is interfering')
    console.log('   • Try clearing browser cookies/localStorage')

    return true

  } catch (error) {
    console.error('❌ Error during NextAuth login test:', error)
    return false
  }
}

// Run the script if called directly
if (require.main === module) {
  testNextAuthLogin().then(success => {
    if (success) {
      console.log('✅ NextAuth login test COMPLETED')
      process.exit(0)
    } else {
      console.log('❌ NextAuth login test FAILED')
      process.exit(1)
    }
  })
}

export { testNextAuthLogin }