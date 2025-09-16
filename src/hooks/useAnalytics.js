import { useEffect, useRef } from 'react';
import { usePostHog } from 'posthog-js/react';

/**
 * Hook for comprehensive user behavior analytics
 */
export function useAnalytics() {
  const posthog = usePostHog();
  const scrollDepthRef = useRef(0);
  const pageStartTime = useRef(Date.now());
  const interactionCount = useRef(0);

  useEffect(() => {
    if (!posthog) return;

    // Track page view with enhanced metadata
    const trackPageView = () => {
      posthog.capture('page_view', {
        url: window.location.pathname,
        referrer: document.referrer,
        user_agent: navigator.userAgent,
        viewport_width: window.innerWidth,
        viewport_height: window.innerHeight,
        screen_width: window.screen.width,
        screen_height: window.screen.height,
        timestamp: new Date().toISOString()
      });
    };

    // Track scroll depth
    const trackScrollDepth = () => {
      const scrolled = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
      const previousDepth = scrollDepthRef.current;
      
      if (scrolled > previousDepth) {
        // Track scroll milestones
        if (previousDepth < 25 && scrolled >= 25) {
          posthog.capture('scroll_depth', { depth: 25, url: window.location.pathname });
        } else if (previousDepth < 50 && scrolled >= 50) {
          posthog.capture('scroll_depth', { depth: 50, url: window.location.pathname });
        } else if (previousDepth < 75 && scrolled >= 75) {
          posthog.capture('scroll_depth', { depth: 75, url: window.location.pathname });
        } else if (previousDepth < 90 && scrolled >= 90) {
          posthog.capture('scroll_depth', { depth: 90, url: window.location.pathname });
        }
        
        // Update after checking milestones
        scrollDepthRef.current = scrolled;
      }
    };

    // Track time on page
    const trackTimeOnPage = () => {
      const timeSpent = Date.now() - pageStartTime.current;
      
      if (timeSpent > 10000) { // Only track if user spent more than 10 seconds
        posthog.capture('time_on_page', {
          duration_ms: timeSpent,
          duration_seconds: Math.round(timeSpent / 1000),
          interactions: interactionCount.current,
          scroll_depth: scrollDepthRef.current,
          url: window.location.pathname
        });
      }
    };

    // Track user interactions
    const trackInteraction = (event) => {
      interactionCount.current += 1;
      
      // Track specific interactions
      if (event.target.closest('[data-track]')) {
        const trackingData = event.target.closest('[data-track]').dataset.track;
        posthog.capture('ui_interaction', {
          element: trackingData,
          interaction_type: event.type,
          url: window.location.pathname,
          timestamp: new Date().toISOString()
        });
      }
    };

    // Track performance issues
    const trackPerformanceIssue = (entry) => {
      if (entry.duration > 100) { // Long tasks
        posthog.capture('performance_issue', {
          type: 'long_task',
          duration: Math.round(entry.duration),
          start_time: Math.round(entry.startTime),
          url: window.location.pathname
        });
      }
    };

    // Set up event listeners
    trackPageView();
    
    window.addEventListener('scroll', trackScrollDepth, { passive: true });
    window.addEventListener('beforeunload', trackTimeOnPage);
    document.addEventListener('click', trackInteraction);
    document.addEventListener('keydown', trackInteraction);

    // Performance observer for long tasks
    let observer = null;
    if ('PerformanceObserver' in window) {
      try {
        observer = new PerformanceObserver((list) => {
          list.getEntries().forEach(trackPerformanceIssue);
        });
        observer.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        console.warn('Performance Observer not supported');
      }
    }

    // Always return cleanup function
    return () => {
      if (observer) {
        observer.disconnect();
      }
      window.removeEventListener('scroll', trackScrollDepth);
      window.removeEventListener('beforeunload', trackTimeOnPage);
      document.removeEventListener('click', trackInteraction);
      document.removeEventListener('keydown', trackInteraction);
    };
  }, [posthog]);

  // Return tracking functions for manual use
  return {
    trackEvent: (eventName, properties = {}) => {
      if (posthog) {
        posthog.capture(eventName, {
          ...properties,
          url: window.location.pathname,
          timestamp: new Date().toISOString()
        });
      }
    },
    
    trackError: (error, context = {}) => {
      if (posthog) {
        posthog.capture('error_occurred', {
          error_message: error.message,
          error_stack: error.stack,
          error_name: error.name,
          context,
          url: window.location.pathname,
          timestamp: new Date().toISOString()
        });
      }
      
      // Also log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.error('📊 Tracked Error:', error, context);
      }
    },

    trackFeatureUsage: (feature, action, metadata = {}) => {
      if (posthog) {
        posthog.capture('feature_usage', {
          feature,
          action,
          ...metadata,
          url: window.location.pathname,
          timestamp: new Date().toISOString()
        });
      }
    }
  };
}