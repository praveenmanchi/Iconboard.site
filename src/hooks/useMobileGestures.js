import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * Hook for swipe gestures
 */
export function useSwipeGestures(options = {}) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
    restraint = 100,
    allowedTime = 300
  } = options;

  const touchStartRef = useRef(null);
  const touchEndRef = useRef(null);

  const handleTouchStart = useCallback((e) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now()
    };
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!touchStartRef.current) return;
    
    touchEndRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (!touchStartRef.current || !touchEndRef.current) return;

    const deltaX = touchEndRef.current.x - touchStartRef.current.x;
    const deltaY = touchEndRef.current.y - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;

    // Check if swipe was fast enough
    if (deltaTime > allowedTime) return;

    // Determine swipe direction
    if (Math.abs(deltaX) >= threshold && Math.abs(deltaY) <= restraint) {
      // Horizontal swipe
      if (deltaX > 0) {
        onSwipeRight?.(e, { deltaX, deltaY, deltaTime });
      } else {
        onSwipeLeft?.(e, { deltaX, deltaY, deltaTime });
      }
    } else if (Math.abs(deltaY) >= threshold && Math.abs(deltaX) <= restraint) {
      // Vertical swipe
      if (deltaY > 0) {
        onSwipeDown?.(e, { deltaX, deltaY, deltaTime });
      } else {
        onSwipeUp?.(e, { deltaX, deltaY, deltaTime });
      }
    }

    // Reset
    touchStartRef.current = null;
    touchEndRef.current = null;
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold, restraint, allowedTime]);

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd
  };
}

/**
 * Hook for pull-to-refresh functionality
 */
export function usePullToRefresh(onRefresh, options = {}) {
  const {
    threshold = 80,
    resistance = 0.5,
    enabled = true
  } = options;

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const currentY = useRef(0);
  const containerRef = useRef(null);

  const handleTouchStart = useCallback((e) => {
    if (!enabled || isRefreshing) return;
    
    startY.current = e.touches[0].clientY;
  }, [enabled, isRefreshing]);

  const handleTouchMove = useCallback((e) => {
    if (!enabled || isRefreshing || !containerRef.current) return;

    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;

    // Only allow pull down at the top of the container
    if (diff > 0 && containerRef.current.scrollTop === 0) {
      e.preventDefault();
      const distance = diff * resistance;
      setPullDistance(distance);
    }
  }, [enabled, isRefreshing, resistance]);

  const handleTouchEnd = useCallback(async () => {
    if (!enabled || isRefreshing) return;

    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      try {
        await onRefresh?.();
      } finally {
        setIsRefreshing(false);
      }
    }
    
    setPullDistance(0);
  }, [enabled, isRefreshing, pullDistance, threshold, onRefresh]);

  const refreshGestures = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd
  };

  return {
    containerRef,
    isRefreshing,
    pullDistance,
    refreshGestures
  };
}

/**
 * Hook for long press detection
 */
export function useLongPress(onLongPress, options = {}) {
  const {
    threshold = 500,
    onStart,
    onFinish,
    onCancel
  } = options;

  const [action, setAction] = useState(null);
  const timerRef = useRef(null);
  const isLongPressRef = useRef(false);

  const start = useCallback((event) => {
    if (onStart) {
      onStart(event);
    }

    isLongPressRef.current = false;
    timerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      setAction('longpress');
      onLongPress(event);
    }, threshold);
  }, [onLongPress, threshold, onStart]);

  const cancel = useCallback((event) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    if (isLongPressRef.current) {
      if (onFinish) {
        onFinish(event);
      }
    } else {
      if (onCancel) {
        onCancel(event);
      }
    }

    setAction(null);
    isLongPressRef.current = false;
  }, [onFinish, onCancel]);

  const handlers = {
    onTouchStart: start,
    onTouchEnd: cancel,
    onTouchCancel: cancel,
    onMouseDown: start,
    onMouseUp: cancel,
    onMouseLeave: cancel
  };

  return {
    handlers,
    isLongPressing: action === 'longpress'
  };
}

/**
 * Hook for touch-friendly interactions
 */
export function useTouchFriendly() {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const checkTouch = () => {
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };

    checkTouch();
    window.addEventListener('touchstart', checkTouch, { once: true });
    
    return () => {
      window.removeEventListener('touchstart', checkTouch);
    };
  }, []);

  const getTouchStyles = useCallback((baseStyles = {}) => {
    if (isTouchDevice) {
      return {
        ...baseStyles,
        minHeight: '44px', // iOS HIG recommendation
        minWidth: '44px',
        padding: '12px',
        borderRadius: '8px'
      };
    }
    return baseStyles;
  }, [isTouchDevice]);

  return {
    isTouchDevice,
    getTouchStyles
  };
}

/**
 * Hook for pinch-to-zoom detection
 */
export function usePinchZoom(onPinch, options = {}) {
  const {
    threshold = 0.1,
    onZoomStart,
    onZoomEnd
  } = options;

  const [isZooming, setIsZooming] = useState(false);
  const initialDistance = useRef(0);
  const currentScale = useRef(1);

  const getDistance = useCallback((touches) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      initialDistance.current = getDistance(e.touches);
      setIsZooming(true);
      onZoomStart?.(e);
    }
  }, [getDistance, onZoomStart]);

  const handleTouchMove = useCallback((e) => {
    if (e.touches.length === 2 && isZooming) {
      e.preventDefault();
      
      const currentDistance = getDistance(e.touches);
      const scale = currentDistance / initialDistance.current;
      
      if (Math.abs(scale - currentScale.current) > threshold) {
        currentScale.current = scale;
        onPinch?.(scale, e);
      }
    }
  }, [getDistance, isZooming, threshold, onPinch]);

  const handleTouchEnd = useCallback((e) => {
    if (e.touches.length < 2) {
      setIsZooming(false);
      currentScale.current = 1;
      onZoomEnd?.(e);
    }
  }, [onZoomEnd]);

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    isZooming
  };
}