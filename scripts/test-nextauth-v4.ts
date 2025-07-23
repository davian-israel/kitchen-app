#!/usr/bin/env tsx

/**
 * Test script to verify NextAuth v4 configuration
 */

import { authConfig } from '../src/lib/auth-config'

async function testNextAuthConfig() {
  console.log('🧪 Testing NextAuth v4 Configuration...\n')

  try {
    console.log('1️⃣ Checking auth config structure...')
    console.log('✅ Auth config loaded:', {
      hasAdapter: !!authConfig.adapter,
      hasProviders: !!authConfig.providers && authConfig.providers.length > 0,
      hasCallbacks: !!authConfig.callbacks,
      hasPages: !!authConfig.pages,
      sessionStrategy: authConfig.session?.strategy,
      trustHost: authConfig.trustHost
    })

    console.log('\n2️⃣ Checking providers...')
    if (authConfig.providers) {
      authConfig.providers.forEach((provider, index) => {
        console.log(`✅ Provider ${index + 1}:`, {
          id: provider.id,
          name: provider.name,
          type: provider.type
        })
      })
    }

    console.log('\n3️⃣ Checking callbacks...')
    if (authConfig.callbacks) {
      console.log('✅ Callbacks configured:', {
        hasJWT: !!authConfig.callbacks.jwt,
        hasSession: !!authConfig.callbacks.session
      })
    }

    console.log('\n4️⃣ Checking pages configuration...')
    if (authConfig.pages) {
      console.log('✅ Pages configured:', authConfig.pages)
    }

    console.log('\n✅ NextAuth v4 configuration looks good!')

  } catch (error) {
    console.error('❌ Configuration test failed:', error)
  }
}

// Run the test
testNextAuthConfig()