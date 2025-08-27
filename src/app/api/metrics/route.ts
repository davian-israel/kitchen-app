import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Simple metrics collection for Prometheus
export async function GET() {
  try {
    const metrics: string[] = [];
    
    // Application info
    metrics.push(`# HELP app_info Application information`);
    metrics.push(`# TYPE app_info gauge`);
    metrics.push(`app_info{version="${process.env.npm_package_version || '0.1.0'}",environment="${process.env.NODE_ENV || 'development'}"} 1`);
    
    // Database metrics
    try {
      const userCount = await db.user.count();
      const orderCount = await db.order.count();
      const mealCount = await db.meal.count();
      
      metrics.push(`# HELP app_users_total Total number of users`);
      metrics.push(`# TYPE app_users_total gauge`);
      metrics.push(`app_users_total ${userCount}`);
      
      metrics.push(`# HELP app_orders_total Total number of orders`);
      metrics.push(`# TYPE app_orders_total gauge`);
      metrics.push(`app_orders_total ${orderCount}`);
      
      metrics.push(`# HELP app_meals_total Total number of meals`);
      metrics.push(`# TYPE app_meals_total gauge`);
      metrics.push(`app_meals_total ${mealCount}`);
    } catch (dbError) {
      console.warn('Database metrics collection failed:', dbError);
      metrics.push(`# Database connection failed`);
    }
    
    // System metrics
    const memUsage = process.memoryUsage();
    metrics.push(`# HELP nodejs_memory_heap_used_bytes Node.js heap memory used`);
    metrics.push(`# TYPE nodejs_memory_heap_used_bytes gauge`);
    metrics.push(`nodejs_memory_heap_used_bytes ${memUsage.heapUsed}`);
    
    metrics.push(`# HELP nodejs_memory_heap_total_bytes Node.js heap memory total`);
    metrics.push(`# TYPE nodejs_memory_heap_total_bytes gauge`);
    metrics.push(`nodejs_memory_heap_total_bytes ${memUsage.heapTotal}`);
    
    metrics.push(`# HELP nodejs_memory_external_bytes Node.js external memory`);
    metrics.push(`# TYPE nodejs_memory_external_bytes gauge`);
    metrics.push(`nodejs_memory_external_bytes ${memUsage.external}`);
    
    // Process uptime
    metrics.push(`# HELP nodejs_process_uptime_seconds Node.js process uptime in seconds`);
    metrics.push(`# TYPE nodejs_process_uptime_seconds counter`);
    metrics.push(`nodejs_process_uptime_seconds ${process.uptime()}`);
    
    return new NextResponse(metrics.join('\n'), {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
    
  } catch (error) {
    console.error('Metrics collection failed:', error);
    return new NextResponse('# Metrics collection failed', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  }
}