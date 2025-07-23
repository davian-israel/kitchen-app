import { NextRequest, NextResponse } from 'next/server'
import { setCSRFToken } from '@/lib/csrf'

export async function GET(request: NextRequest) {
  try {
    const csrfToken = await setCSRFToken()
    
    return NextResponse.json({ 
      csrfToken 
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    console.error('Error generating CSRF token:', error)
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    )
  }
}