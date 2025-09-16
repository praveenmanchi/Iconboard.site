import { useState, useEffect, useMemo } from 'react';

/**
 * Hook for providing autocomplete suggestions based on icon data
 * @param {string} searchTerm - Current search term
 * @param {Array} icons - Current icon data for suggestions
 * @returns {object} { suggestions, isLoading }
 */
export function useAutocomplete(searchTerm, icons = []) {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Generate suggestions from current icon data and common terms
  const generateSuggestions = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) {
      return [];
    }

    const term = searchTerm.toLowerCase().trim();
    const suggestionSet = new Set();
    
    // Extract common search patterns from icons
    icons.forEach(icon => {
      const iconName = icon.name.toLowerCase();
      const category = icon.category.toLowerCase();
      
      // Add exact matches first
      if (iconName.includes(term)) {
        suggestionSet.add(icon.name);
      }
      
      // Add category suggestions
      if (category.includes(term)) {
        suggestionSet.add(category);
      }
      
      // Add word-based suggestions
      const words = iconName.split(/[-_\s]+/);
      words.forEach(word => {
        if (word.toLowerCase().includes(term) && word.length > 2) {
          suggestionSet.add(word);
        }
      });
    });

    // Add common icon-related suggestions
    const commonTerms = [
      'arrow', 'icon', 'button', 'menu', 'close', 'search', 'home', 'user', 'settings',
      'edit', 'delete', 'add', 'plus', 'minus', 'heart', 'star', 'play', 'pause',
      'stop', 'forward', 'back', 'up', 'down', 'left', 'right', 'check', 'cross',
      'phone', 'email', 'mail', 'calendar', 'clock', 'time', 'location', 'map',
      'camera', 'video', 'image', 'file', 'folder', 'download', 'upload', 'share',
      'lock', 'unlock', 'eye', 'hide', 'show', 'visible', 'invisible'
    ];

    commonTerms.forEach(commonTerm => {
      if (commonTerm.includes(term) && !suggestionSet.has(commonTerm)) {
        suggestionSet.add(commonTerm);
      }
    });

    return Array.from(suggestionSet)
      .slice(0, 8) // Limit to 8 suggestions
      .sort((a, b) => {
        // Prioritize exact starts
        const aStartsWith = a.toLowerCase().startsWith(term);
        const bStartsWith = b.toLowerCase().startsWith(term);
        
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        
        // Then by length (shorter first)
        return a.length - b.length;
      });
  }, [searchTerm, icons]);

  useEffect(() => {
    if (searchTerm && searchTerm.length >= 2) {
      setIsLoading(true);
      
      // Simulate a small delay for better UX
      const timer = setTimeout(() => {
        setSuggestions(generateSuggestions);
        setIsLoading(false);
      }, 100);

      return () => clearTimeout(timer);
    } else {
      setSuggestions([]);
      setIsLoading(false);
    }
  }, [searchTerm, generateSuggestions]);

  return { suggestions, isLoading };
}