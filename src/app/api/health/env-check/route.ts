import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Environment Check Endpoint
 * Returns status of required environment variables (without exposing values)
 * 
 * DELETE THIS FILE after deployment is verified!
 */
export async function GET() {
  const envStatus = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    variables: {
      // Required
      DATABASE_URL: {
        set: !!process.env.DATABASE_URL,
        preview: process.env.DATABASE_URL 
          ? `${process.env.DATABASE_URL.substring(0, 20)}...` 
          : 'NOT SET',
      },
      NEXTAUTH_SECRET: {
        set: !!process.env.NEXTAUTH_SECRET,
        length: process.env.NEXTAUTH_SECRET?.length || 0,
      },
      NEXTAUTH_URL: {
        set: !!process.env.NEXTAUTH_URL,
        value: process.env.NEXTAUTH_URL || 'NOT SET',
      },
      // Stripe
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: {
        set: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
        preview: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
          ? `${process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.substring(0, 12)}...`
          : 'NOT SET',
      },
      STRIPE_SECRET_KEY: {
        set: !!process.env.STRIPE_SECRET_KEY,
        preview: process.env.STRIPE_SECRET_KEY
          ? `${process.env.STRIPE_SECRET_KEY.substring(0, 10)}...`
          : 'NOT SET',
      },
      // Optional
      NEXTAUTH_DEBUG: {
        set: !!process.env.NEXTAUTH_DEBUG,
        value: process.env.NEXTAUTH_DEBUG || 'false',
      },
    },
    checks: {
      databaseConfigured: !!process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgresql'),
      authConfigured: !!process.env.NEXTAUTH_SECRET && (process.env.NEXTAUTH_SECRET.length >= 32),
      stripeConfigured: !!process.env.STRIPE_SECRET_KEY && !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      urlConfigured: !!process.env.NEXTAUTH_URL && process.env.NEXTAUTH_URL.startsWith('https'),
    },
    allRequiredSet: false,
  }

  // Calculate overall status
  envStatus.allRequiredSet = 
    envStatus.checks.databaseConfigured &&
    envStatus.checks.authConfigured &&
    envStatus.checks.urlConfigured

  const status = envStatus.allRequiredSet ? 200 : 500

  return NextResponse.json(envStatus, { status })
}

