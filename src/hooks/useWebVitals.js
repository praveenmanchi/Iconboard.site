import { useEffect } from 'react';
import { onCLS, onINP, onFCP, onLCP, onTTFB } from 'web-vitals';
import { usePostHog } from 'posthog-js/react';

/**
 * Hook for tracking Core Web Vitals and sending to analytics
 * @param {boolean} enabled - Whether to track web vitals (default: production only)
 */
export function useWebVitals(enabled = process.env.NODE_ENV === 'production') {
  const posthog = usePostHog();

  useEffect(() => {
    if (!enabled) return;

    const sendToAnalytics = (metric) => {
      const { name, value, rating, delta } = metric;
      
      // Log in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`📊 Web Vital [${name}]:`, {
          value: `${Math.round(value)}ms`,
          rating,
          delta: `${Math.round(delta)}ms`
        });
      }

      // Send to PostHog if available
      if (posthog) {
        posthog.capture('web_vital_measured', {
          metric_name: name,
          value: Math.round(value),
          rating,
          delta: Math.round(delta),
          url: window.location.pathname,
          timestamp: new Date().toISOString()
        });
      }

      // Send to Performance Observer API if available
      if (window.gtag) {
        window.gtag('event', name, {
          value: Math.round(value),
          metric_rating: rating,
          custom_parameter: delta
        });
      }
    };

    // Track all Core Web Vitals
    onCLS(sendToAnalytics);  // Cumulative Layout Shift
    onINP(sendToAnalytics);  // Interaction to Next Paint (replaces FID)
    onFCP(sendToAnalytics);  // First Contentful Paint
    onLCP(sendToAnalytics);  // Largest Contentful Paint
    onTTFB(sendToAnalytics); // Time to First Byte

  }, [enabled, posthog]);
}

/**
 * Hook for tracking custom performance metrics
 */
export function useCustomMetrics() {
  const posthog = usePostHog();

  const trackCustomMetric = (name, value, metadata = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🎯 Custom Metric [${name}]:`, { value, ...metadata });
    }

    if (posthog) {
      posthog.capture('custom_metric', {
        metric_name: name,
        value,
        ...metadata,
        url: window.location.pathname,
        timestamp: new Date().toISOString()
      });
    }
  };

  const trackUserAction = (action, element, metadata = {}) => {
    if (posthog) {
      posthog.capture('user_action', {
        action,
        element,
        ...metadata,
        url: window.location.pathname,
        timestamp: new Date().toISOString()
      });
    }
  };

  const trackSearchPerformance = (searchTerm, resultCount, searchTime, source = 'input') => {
    if (posthog) {
      posthog.capture('search_performance', {
        search_term: searchTerm,
        result_count: resultCount,
        search_time_ms: Math.round(searchTime),
        search_source: source,
        url: window.location.pathname,
        timestamp: new Date().toISOString()
      });
    }
  };

  const trackIconInteraction = (iconId, iconName, action, metadata = {}) => {
    if (posthog) {
      posthog.capture('icon_interaction', {
        icon_id: iconId,
        icon_name: iconName,
        action, // 'view', 'copy', 'download', 'favorite'
        ...metadata,
        url: window.location.pathname,
        timestamp: new Date().toISOString()
      });
    }
  };

  return {
    trackCustomMetric,
    trackUserAction,
    trackSearchPerformance,
    trackIconInteraction
  };
}