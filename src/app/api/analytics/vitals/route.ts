import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const webVitalSchema = z.object({
  name: z.string(),
  value: z.number(),
  delta: z.number(),
  id: z.string(),
  navigationType: z.string(),
  rating: z.enum(['good', 'needs-improvement', 'poor']),
  url: z.string(),
  timestamp: z.number(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const vital = webVitalSchema.parse(body);
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Web Vital received:', vital);
    }
    
    // In production, you would typically:
    // 1. Store in database for analysis
    // 2. Send to analytics service (Google Analytics, DataDog, etc.)
    // 3. Trigger alerts for poor performance
    
    // Example: Log critical performance issues
    if (vital.rating === 'poor') {
      console.warn(`Poor ${vital.name} performance: ${vital.value}ms on ${vital.url}`);
      
      // Here you could:
      // - Send alert to monitoring system
      // - Store in database for analysis
      // - Trigger automated responses
    }
    
    return NextResponse.json({ status: 'received' });
  } catch (error) {
    console.error('Error processing web vital:', error);
    return NextResponse.json(
      { error: 'Invalid web vital data' },
      { status: 400 }
    );
  }
}