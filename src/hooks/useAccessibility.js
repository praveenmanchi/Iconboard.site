import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * Hook for managing focus and accessibility
 */
export function useFocusManagement() {
  const focusableElementsSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  
  const trapFocus = useCallback((containerRef) => {
    if (!containerRef.current) return;

    const focusableElements = containerRef.current.querySelectorAll(focusableElementsSelector);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const focusFirst = useCallback((containerRef) => {
    if (!containerRef.current) return;
    
    const firstFocusable = containerRef.current.querySelector(focusableElementsSelector);
    if (firstFocusable) {
      firstFocusable.focus();
    }
  }, []);

  const restoreFocus = useCallback(() => {
    const lastActiveElement = document.querySelector('[data-focus-restore]');
    if (lastActiveElement) {
      lastActiveElement.focus();
      lastActiveElement.removeAttribute('data-focus-restore');
    }
  }, []);

  const saveFocus = useCallback(() => {
    if (document.activeElement) {
      document.activeElement.setAttribute('data-focus-restore', 'true');
    }
  }, []);

  return {
    trapFocus,
    focusFirst,
    restoreFocus,
    saveFocus
  };
}

/**
 * Hook for screen reader announcements
 */
export function useScreenReader() {
  const announcementRef = useRef(null);

  useEffect(() => {
    // Create screen reader announcement element
    if (!announcementRef.current) {
      const element = document.createElement('div');
      element.setAttribute('aria-live', 'polite');
      element.setAttribute('aria-atomic', 'true');
      element.setAttribute('class', 'sr-only');
      element.style.cssText = `
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      `;
      document.body.appendChild(element);
      announcementRef.current = element;
    }

    return () => {
      if (announcementRef.current && announcementRef.current.parentNode) {
        try {
          announcementRef.current.parentNode.removeChild(announcementRef.current);
        } catch (error) {
          // Element was already removed or not a child - ignore
        }
        announcementRef.current = null;
      }
    };
  }, []);

  const announce = useCallback((message, priority = 'polite') => {
    if (!announcementRef.current) return;

    announcementRef.current.setAttribute('aria-live', priority);
    announcementRef.current.textContent = message;

    // Clear after announcement
    setTimeout(() => {
      if (announcementRef.current) {
        announcementRef.current.textContent = '';
      }
    }, 1000);
  }, []);

  return { announce };
}

/**
 * Hook for keyboard navigation within a component
 */
export function useKeyboardNavigation(items, onSelect, options = {}) {
  const {
    orientation = 'vertical', // 'vertical', 'horizontal', 'grid'
    loop = true,
    gridColumns = 1
  } = options;

  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef(null);

  const moveFocus = useCallback((direction) => {
    if (!items || items.length === 0) return;

    let newIndex = focusedIndex;

    switch (orientation) {
      case 'horizontal':
        if (direction === 'ArrowRight') {
          newIndex = loop ? (focusedIndex + 1) % items.length : Math.min(focusedIndex + 1, items.length - 1);
        } else if (direction === 'ArrowLeft') {
          newIndex = loop ? (focusedIndex - 1 + items.length) % items.length : Math.max(focusedIndex - 1, 0);
        }
        break;

      case 'vertical':
        if (direction === 'ArrowDown') {
          newIndex = loop ? (focusedIndex + 1) % items.length : Math.min(focusedIndex + 1, items.length - 1);
        } else if (direction === 'ArrowUp') {
          newIndex = loop ? (focusedIndex - 1 + items.length) % items.length : Math.max(focusedIndex - 1, 0);
        }
        break;

      case 'grid':
        if (direction === 'ArrowRight') {
          newIndex = loop ? (focusedIndex + 1) % items.length : Math.min(focusedIndex + 1, items.length - 1);
        } else if (direction === 'ArrowLeft') {
          newIndex = loop ? (focusedIndex - 1 + items.length) % items.length : Math.max(focusedIndex - 1, 0);
        } else if (direction === 'ArrowDown') {
          newIndex = Math.min(focusedIndex + gridColumns, items.length - 1);
        } else if (direction === 'ArrowUp') {
          newIndex = Math.max(focusedIndex - gridColumns, 0);
        }
        break;
    }

    if (newIndex !== focusedIndex) {
      setFocusedIndex(newIndex);
      if (onSelect) {
        onSelect(items[newIndex], newIndex);
      }
    }
  }, [focusedIndex, items, onSelect, orientation, loop, gridColumns]);

  const handleKeyDown = useCallback((event) => {
    const { key } = event;
    
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
      event.preventDefault();
      moveFocus(key);
    } else if (key === 'Home') {
      event.preventDefault();
      setFocusedIndex(0);
      if (onSelect) onSelect(items[0], 0);
    } else if (key === 'End') {
      event.preventDefault();
      const lastIndex = items.length - 1;
      setFocusedIndex(lastIndex);
      if (onSelect) onSelect(items[lastIndex], lastIndex);
    }
  }, [moveFocus, items, onSelect]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('keydown', handleKeyDown);
      return () => container.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown]);

  return {
    containerRef,
    focusedIndex,
    setFocusedIndex,
    handleKeyDown
  };
}

/**
 * Hook for ARIA attributes and descriptions
 */
export function useAriaAttributes(description, options = {}) {
  const {
    role = 'button',
    expanded = null,
    hasPopup = false,
    controls = null,
    describedBy = null
  } = options;

  const ariaProps = {
    role,
    'aria-label': description,
    ...(expanded !== null && { 'aria-expanded': expanded }),
    ...(hasPopup && { 'aria-haspopup': true }),
    ...(controls && { 'aria-controls': controls }),
    ...(describedBy && { 'aria-describedby': describedBy })
  };

  return ariaProps;
}

/**
 * Hook for reduced motion preferences
 */
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (event) => setPrefersReducedMotion(event.matches);
    mediaQuery.addEventListener('change', handler);
    
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
}