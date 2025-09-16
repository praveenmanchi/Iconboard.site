import { useCallback } from 'react';

/**
 * Haptic feedback patterns for different interactions
 */
const HAPTIC_PATTERNS = {
  // Light tap for general interactions
  light: [10],
  
  // Medium tap for selections
  medium: [30],
  
  // Strong tap for important actions
  strong: [50],
  
  // Double tap for confirmations
  double: [20, 50, 20],
  
  // Success pattern
  success: [10, 30, 10],
  
  // Error pattern
  error: [50, 100, 50],
  
  // Notification pattern
  notification: [30, 100, 30, 100]
};

/**
 * Hook for haptic feedback on mobile devices
 */
export function useHapticFeedback() {
  // Check if device supports vibration
  const isSupported = useCallback(() => {
    return 'vibrate' in navigator && typeof navigator.vibrate === 'function';
  }, []);

  // Check if device is likely mobile
  const isMobile = useCallback(() => {
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (window.innerWidth <= 768 && 'ontouchstart' in window);
  }, []);

  // Trigger haptic feedback
  const vibrate = useCallback((pattern = 'medium') => {
    // Only vibrate on supported mobile devices
    if (!isSupported() || !isMobile()) {
      return false;
    }

    try {
      let vibrationPattern;
      
      if (typeof pattern === 'string') {
        vibrationPattern = HAPTIC_PATTERNS[pattern] || HAPTIC_PATTERNS.medium;
      } else if (Array.isArray(pattern)) {
        vibrationPattern = pattern;
      } else if (typeof pattern === 'number') {
        vibrationPattern = [pattern];
      } else {
        vibrationPattern = HAPTIC_PATTERNS.medium;
      }

      // Limit vibration duration for user comfort (max 100ms per vibration)
      const safeDuration = vibrationPattern.map(duration => Math.min(duration, 100));
      
      navigator.vibrate(safeDuration);
      return true;
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
      return false;
    }
  }, [isSupported, isMobile]);

  // Specific haptic feedback functions
  const haptics = {
    // Light tap for hover/focus
    light: useCallback(() => vibrate('light'), [vibrate]),
    
    // Medium tap for selections/clicks
    select: useCallback(() => vibrate('medium'), [vibrate]),
    
    // Strong tap for important actions
    action: useCallback(() => vibrate('strong'), [vibrate]),
    
    // Success feedback
    success: useCallback(() => vibrate('success'), [vibrate]),
    
    // Error feedback
    error: useCallback(() => vibrate('error'), [vibrate]),
    
    // Notification feedback
    notification: useCallback(() => vibrate('notification'), [vibrate]),
    
    // Custom pattern
    custom: useCallback((pattern) => vibrate(pattern), [vibrate])
  };

  return {
    isSupported: isSupported(),
    isMobile: isMobile(),
    vibrate,
    ...haptics
  };
}

/**
 * Hook for enhanced touch interactions with haptic feedback
 */
export function useTouchInteractions() {
  const haptics = useHapticFeedback();

  const handleTouchStart = useCallback((callback, hapticType = 'light') => {
    return (event) => {
      if (haptics.isMobile) {
        haptics[hapticType]();
      }
      if (callback) {
        callback(event);
      }
    };
  }, [haptics]);

  const handleTouchEnd = useCallback((callback, hapticType = 'select') => {
    return (event) => {
      if (haptics.isMobile) {
        haptics[hapticType]();
      }
      if (callback) {
        callback(event);
      }
    };
  }, [haptics]);

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
    haptics
  };
}

/**
 * Hook for button interactions with haptic feedback
 */
export function useHapticButton(onClick, options = {}) {
  const {
    hapticType = 'select',
    preventDefault = false,
    disabled = false
  } = options;

  const haptics = useHapticFeedback();

  const handleClick = useCallback((event) => {
    if (disabled) return;
    
    if (preventDefault) {
      event.preventDefault();
    }

    // Provide haptic feedback
    if (haptics.isMobile) {
      haptics[hapticType]();
    }

    // Call the original onClick handler
    if (onClick) {
      onClick(event);
    }
  }, [onClick, hapticType, preventDefault, disabled, haptics]);

  return {
    onClick: handleClick,
    onTouchStart: haptics.isMobile ? () => haptics.light() : undefined
  };
}