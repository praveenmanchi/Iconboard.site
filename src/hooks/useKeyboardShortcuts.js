import { useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for managing keyboard shortcuts
 * @param {Object} shortcuts - Object mapping key combinations to handlers
 * @param {Array} deps - Dependencies array for useCallback
 */
export function useKeyboardShortcuts(shortcuts, deps = []) {
  const handleKeyDown = useCallback((event) => {
    const key = event.key.toLowerCase();
    const ctrl = event.ctrlKey || event.metaKey; // Support both Ctrl and Cmd
    const shift = event.shiftKey;
    const alt = event.altKey;
    
    // Don't trigger shortcuts when typing in input fields
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
      // Allow specific shortcuts even in input fields
      if (key === 'escape' && shortcuts.escape) {
        event.preventDefault();
        shortcuts.escape(event);
        return;
      }
      return;
    }

    // Build key combination string
    let combination = '';
    if (ctrl) combination += 'ctrl+';
    if (shift) combination += 'shift+';
    if (alt) combination += 'alt+';
    combination += key;

    // Check for exact matches first
    if (shortcuts[combination]) {
      event.preventDefault();
      shortcuts[combination](event);
      return;
    }

    // Check for simple key matches
    if (shortcuts[key]) {
      event.preventDefault();
      shortcuts[key](event);
      return;
    }

    // Special case for search shortcut (common UX pattern)
    if ((key === 'k' && ctrl) || key === '/') {
      if (shortcuts.search || shortcuts['ctrl+k']) {
        event.preventDefault();
        (shortcuts.search || shortcuts['ctrl+k'])(event);
      }
    }
  }, deps);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

/**
 * Hook for icon grid navigation with arrow keys
 */
export function useIconNavigation(icons, selectedIcon, onIconSelect, gridColumns = 8) {
  const selectedIndexRef = useRef(-1);

  // Update selected index when selectedIcon changes
  useEffect(() => {
    if (selectedIcon && icons.length > 0) {
      const index = icons.findIndex(icon => icon.id === selectedIcon.id);
      selectedIndexRef.current = index;
    } else {
      selectedIndexRef.current = -1;
    }
  }, [selectedIcon, icons]);

  const navigateIcon = useCallback((direction) => {
    if (icons.length === 0) return;

    let newIndex = selectedIndexRef.current;

    switch (direction) {
      case 'right':
        newIndex = Math.min(newIndex + 1, icons.length - 1);
        break;
      case 'left':
        newIndex = Math.max(newIndex - 1, 0);
        break;
      case 'down':
        newIndex = Math.min(newIndex + gridColumns, icons.length - 1);
        break;
      case 'up':
        newIndex = Math.max(newIndex - gridColumns, 0);
        break;
      case 'first':
        newIndex = 0;
        break;
      case 'last':
        newIndex = icons.length - 1;
        break;
      default:
        return;
    }

    if (newIndex !== selectedIndexRef.current && icons[newIndex]) {
      selectedIndexRef.current = newIndex;
      onIconSelect(icons[newIndex]);
      
      // Scroll to the selected icon
      const iconElement = document.querySelector(`[data-icon-id="${icons[newIndex].id}"]`);
      if (iconElement) {
        iconElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [icons, onIconSelect, gridColumns]);

  const shortcuts = {
    'arrowright': () => navigateIcon('right'),
    'arrowleft': () => navigateIcon('left'),
    'arrowdown': () => navigateIcon('down'),
    'arrowup': () => navigateIcon('up'),
    'home': () => navigateIcon('first'),
    'end': () => navigateIcon('last'),
    'enter': () => {
      if (selectedIcon) {
        // Trigger copy action or open details
        const event = new CustomEvent('iconActivated', { detail: selectedIcon });
        document.dispatchEvent(event);
      }
    }
  };

  useKeyboardShortcuts(shortcuts, [navigateIcon, selectedIcon]);

  return { navigateIcon };
}

/**
 * Hook for search shortcuts
 */
export function useSearchShortcuts(searchInputRef, onClearSearch) {
  const shortcuts = {
    'ctrl+k': () => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
        searchInputRef.current.select();
      }
    },
    '/': () => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    },
    'escape': () => {
      if (searchInputRef.current && document.activeElement === searchInputRef.current) {
        searchInputRef.current.blur();
        if (onClearSearch) {
          onClearSearch();
        }
      }
    }
  };

  useKeyboardShortcuts(shortcuts, []);
}