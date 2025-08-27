// Performance monitoring utilities
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

export interface WebVitalsMetric {
  name: string;
  value: number;
  delta: number;
  id: string;
  navigationType: string;
}

// Web Vitals thresholds (in milliseconds, except CLS which is unitless)
export const THRESHOLDS = {
  LCP: { good: 2500, needsImprovement: 4000 },
  FID: { good: 100, needsImprovement: 300 },
  CLS: { good: 0.1, needsImprovement: 0.25 },
  FCP: { good: 1800, needsImprovement: 3000 },
  TTFB: { good: 600, needsImprovement: 1500 },
} as const;

// Performance rating
export function getPerformanceRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS];
  if (!threshold) return 'good';
  
  if (value <= threshold.good) return 'good';
  if (value <= threshold.needsImprovement) return 'needs-improvement';
  return 'poor';
}

// Send metrics to analytics
export function sendToAnalytics(metric: WebVitalsMetric): void {
  if (process.env.NODE_ENV === 'development') {
    console.log('Web Vital:', {
      name: metric.name,
      value: metric.value,
      rating: getPerformanceRating(metric.name, metric.value),
    });
    return;
  }

  // In production, send to your analytics service
  // Examples: Google Analytics, DataDog, New Relic, etc.
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType,
    rating: getPerformanceRating(metric.name, metric.value),
    url: window.location.href,
    timestamp: Date.now(),
  });

  // Use sendBeacon if available, fallback to fetch
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/analytics/vitals', body);
  } else {
    fetch('/api/analytics/vitals', {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
    }).catch(console.error);
  }
}

// Initialize Web Vitals monitoring
export function initWebVitals(): void {
  if (typeof window === 'undefined') return;

  try {
    getCLS(sendToAnalytics);
    getFID(sendToAnalytics);
    getFCP(sendToAnalytics);
    getLCP(sendToAnalytics);
    getTTFB(sendToAnalytics);
  } catch (error) {
    console.warn('Failed to initialize Web Vitals:', error);
  }
}

// Performance observer for custom metrics
export class PerformanceMonitor {
  private observer: PerformanceObserver | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.initObserver();
    }
  }

  private initObserver(): void {
    try {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.handlePerformanceEntry(entry);
        }
      });

      // Observe various entry types
      this.observer.observe({ entryTypes: ['navigation', 'resource', 'paint'] });
    } catch (error) {
      console.warn('Failed to initialize PerformanceObserver:', error);
    }
  }

  private handlePerformanceEntry(entry: PerformanceEntry): void {
    if (process.env.NODE_ENV === 'development') {
      console.log('Performance Entry:', {
        name: entry.name,
        type: entry.entryType,
        duration: entry.duration,
        startTime: entry.startTime,
      });
    }

    // Track slow resources
    if (entry.entryType === 'resource' && entry.duration > 1000) {
      this.trackSlowResource(entry as PerformanceResourceTiming);
    }

    // Track paint metrics
    if (entry.entryType === 'paint') {
      this.trackPaintMetric(entry);
    }
  }

  private trackSlowResource(entry: PerformanceResourceTiming): void {
    const slowResource = {
      name: entry.name,
      duration: entry.duration,
      size: entry.transferSize,
      type: this.getResourceType(entry.name),
      timestamp: Date.now(),
    };

    if (process.env.NODE_ENV === 'production') {
      // Send to analytics
      fetch('/api/analytics/slow-resources', {
        method: 'POST',
        body: JSON.stringify(slowResource),
        headers: { 'Content-Type': 'application/json' },
      }).catch(console.error);
    }
  }

  private trackPaintMetric(entry: PerformanceEntry): void {
    const paintMetric = {
      name: entry.name,
      value: entry.startTime,
      timestamp: Date.now(),
    };

    if (process.env.NODE_ENV === 'production') {
      fetch('/api/analytics/paint-metrics', {
        method: 'POST',
        body: JSON.stringify(paintMetric),
        headers: { 'Content-Type': 'application/json' },
      }).catch(console.error);
    }
  }

  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'javascript';
    if (url.includes('.css')) return 'stylesheet';
    if (url.match(/\.(jpg|jpeg|png|gif|webp|avif)$/)) return 'image';
    if (url.includes('.woff')) return 'font';
    return 'other';
  }

  public disconnect(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();