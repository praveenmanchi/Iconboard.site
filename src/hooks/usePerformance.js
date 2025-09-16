import { useEffect, useRef, useState } from 'react';

/**
 * Performance monitoring hook
 * Tracks component render times and provides performance metrics
 */
export function usePerformance(componentName) {
  const renderCount = useRef(0);
  const startTime = useRef(Date.now());
  const [metrics, setMetrics] = useState({
    renderCount: 0,
    averageRenderTime: 0,
    lastRenderTime: 0
  });

  useEffect(() => {
    renderCount.current += 1;
    const renderTime = Date.now() - startTime.current;
    
    setMetrics(prev => {
      const newRenderCount = renderCount.current;
      const newAverageRenderTime = prev.averageRenderTime === 0 
        ? renderTime 
        : (prev.averageRenderTime * (newRenderCount - 1) + renderTime) / newRenderCount;
      
      return {
        renderCount: newRenderCount,
        averageRenderTime: newAverageRenderTime,
        lastRenderTime: renderTime
      };
    });

    // Log performance in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 Performance [${componentName}]:`, {
        renderTime: `${renderTime}ms`,
        renderCount: renderCount.current,
        averageTime: `${Math.round(metrics.averageRenderTime)}ms`
      });
    }
    
    startTime.current = Date.now();
  });

  return metrics;
}

/**
 * Hook to measure and track API call performance
 */
export function useApiPerformance() {
  const [apiMetrics, setApiMetrics] = useState({
    calls: [],
    averageResponseTime: 0,
    slowestCall: null,
    fastestCall: null
  });

  const trackApiCall = (endpoint, startTime, endTime, success = true) => {
    const responseTime = endTime - startTime;
    
    const callData = {
      endpoint,
      responseTime,
      timestamp: new Date().toISOString(),
      success
    };

    setApiMetrics(prev => {
      const newCalls = [...prev.calls, callData].slice(-50); // Keep last 50 calls
      const avgResponseTime = newCalls.reduce((sum, call) => sum + call.responseTime, 0) / newCalls.length;
      
      const slowest = newCalls.reduce((slowest, call) => 
        !slowest || call.responseTime > slowest.responseTime ? call : slowest, null);
      
      const fastest = newCalls.reduce((fastest, call) => 
        !fastest || call.responseTime < fastest.responseTime ? call : fastest, null);

      // Log slow API calls
      if (responseTime > 2000) {
        console.warn(`🐌 Slow API call: ${endpoint} took ${responseTime}ms`);
      }

      return {
        calls: newCalls,
        averageResponseTime: avgResponseTime,
        slowestCall: slowest,
        fastestCall: fastest
      };
    });
  };

  return { apiMetrics, trackApiCall };
}

/**
 * Hook to track bundle loading performance
 */
export function useBundlePerformance() {
  const [bundleMetrics, setBundleMetrics] = useState({
    loadTime: 0,
    domContentLoaded: 0,
    firstContentfulPaint: 0,
    largestContentfulPaint: 0
  });

  useEffect(() => {
    // Measure initial load performance
    const measurePerformance = () => {
      if (window.performance && window.performance.timing) {
        const timing = window.performance.timing;
        const loadTime = timing.loadEventEnd - timing.navigationStart;
        const domContentLoaded = timing.domContentLoadedEventEnd - timing.navigationStart;

        setBundleMetrics(prev => ({
          ...prev,
          loadTime,
          domContentLoaded
        }));
      }

      // Measure paint metrics if available
      if (window.performance && window.performance.getEntriesByType) {
        const paintEntries = window.performance.getEntriesByType('paint');
        
        paintEntries.forEach(entry => {
          if (entry.name === 'first-contentful-paint') {
            setBundleMetrics(prev => ({
              ...prev,
              firstContentfulPaint: entry.startTime
            }));
          }
        });

        // Largest Contentful Paint
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          setBundleMetrics(prev => ({
            ...prev,
            largestContentfulPaint: lastEntry.startTime
          }));
        });

        try {
          observer.observe({ entryTypes: ['largest-contentful-paint'] });
        } catch (e) {
          // LCP not supported in all browsers
        }

        return () => {
          try {
            observer.disconnect();
          } catch (e) {
            // Ignore disconnect errors
          }
        };
      }
    };

    // Measure after load
    if (document.readyState === 'complete') {
      measurePerformance();
    } else {
      window.addEventListener('load', measurePerformance);
      return () => window.removeEventListener('load', measurePerformance);
    }
  }, []);

  return bundleMetrics;
}