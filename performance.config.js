// Performance Configuration for Israel Kitchen
module.exports = {
  // Next.js Bundle Analysis
  bundleAnalyzer: {
    enabled: process.env.ANALYZE === 'true',
    openAnalyzer: false,
  },
  
  // Core Web Vitals Targets
  webVitals: {
    lcp: 2500, // Largest Contentful Paint (ms)
    fid: 100,  // First Input Delay (ms)
    cls: 0.1,  // Cumulative Layout Shift
    fcp: 1800, // First Contentful Paint (ms)
    ttfb: 600, // Time to First Byte (ms)
  },
  
  // Performance Budgets
  budgets: {
    javascript: {
      initial: 244, // KB - Initial JS bundle
      total: 488,   // KB - Total JS
    },
    css: {
      initial: 50,  // KB - Critical CSS
      total: 100,   // KB - Total CSS
    },
    images: {
      perPage: 500, // KB - Images per page
    },
    fonts: {
      total: 100,   // KB - Web fonts
    }
  },
  
  // Optimization Settings
  optimization: {
    // Enable compression
    compression: true,
    
    // Image optimization
    images: {
      formats: ['webp', 'avif'],
      quality: 80,
      progressive: true,
    },
    
    // Code splitting
    codeSplitting: {
      chunks: 'async',
      minSize: 20000,
      maxSize: 244000,
    },
    
    // Tree shaking
    treeShaking: true,
    
    // Minification
    minification: {
      removeComments: true,
      removeRedundantAttributes: true,
      minifyCSS: true,
      minifyJS: true,
    }
  },
  
  // Monitoring
  monitoring: {
    // Real User Monitoring
    rum: {
      enabled: process.env.NODE_ENV === 'production',
      sampleRate: 0.1, // 10% of users
    },
    
    // Performance API
    performanceAPI: true,
    
    // Core Web Vitals reporting
    webVitalsReporting: true,
  }
};