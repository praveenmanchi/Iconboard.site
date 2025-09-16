import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'iconboard_recent_searches';
const MAX_RECENT_SEARCHES = 10;

/**
 * Hook for managing recent search terms with localStorage persistence
 * @returns {object} { recentSearches, addRecentSearch, removeRecentSearch, clearRecentSearches }
 */
export function useRecentSearches() {
  const [recentSearches, setRecentSearches] = useState([]);

  // Load recent searches from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setRecentSearches(Array.isArray(parsed) ? parsed : []);
      }
    } catch (error) {
      console.warn('Failed to load recent searches:', error);
      setRecentSearches([]);
    }
  }, []);

  // Save to localStorage whenever recentSearches changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recentSearches));
    } catch (error) {
      console.warn('Failed to save recent searches:', error);
    }
  }, [recentSearches]);

  const addRecentSearch = useCallback((searchTerm) => {
    if (!searchTerm || typeof searchTerm !== 'string' || searchTerm.trim().length < 2) {
      return; // Don't save very short searches
    }

    const trimmedTerm = searchTerm.trim();
    
    setRecentSearches(prev => {
      // Remove if it already exists
      const filtered = prev.filter(term => term.toLowerCase() !== trimmedTerm.toLowerCase());
      
      // Add to beginning and limit length
      const updated = [trimmedTerm, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      return updated;
    });
  }, []);

  const removeRecentSearch = useCallback((searchTerm) => {
    setRecentSearches(prev => prev.filter(term => term !== searchTerm));
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
  }, []);

  return {
    recentSearches,
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches
  };
}