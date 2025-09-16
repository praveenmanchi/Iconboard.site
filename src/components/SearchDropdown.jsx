import React, { useState, useRef, useEffect } from 'react';
import { Search, Clock, X, TrendingUp } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAutocomplete } from '../hooks/useAutocomplete';
import { useRecentSearches } from '../hooks/useRecentSearches';

const SearchDropdown = ({ 
  searchTerm, 
  onSearch, 
  icons = [], 
  isOpen, 
  onClose,
  inputRef 
}) => {
  const { isDark } = useTheme();
  const dropdownRef = useRef(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const { suggestions, isLoading } = useAutocomplete(searchTerm, icons);
  const { recentSearches, addRecentSearch, removeRecentSearch } = useRecentSearches();

  // Determine what to show
  const showRecent = !searchTerm && recentSearches.length > 0;
  const showSuggestions = searchTerm.length >= 2 && suggestions.length > 0;
  const showContent = showRecent || showSuggestions;

  const items = showRecent ? recentSearches : suggestions;

  // Handle keyboard navigation
  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen || !showContent) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, items.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (items[selectedIndex]) {
            handleSelectItem(items[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showContent, items, selectedIndex, onClose]);

  // Handle clicking outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose, inputRef]);

  const handleSelectItem = (item) => {
    onSearch(item);
    addRecentSearch(item);
    onClose();
    
    // Focus back to input
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleRemoveRecent = (e, item) => {
    e.stopPropagation();
    removeRecentSearch(item);
  };

  if (!isOpen || !showContent) {
    return null;
  }

  return (
    <div
      ref={dropdownRef}
      className={`absolute top-full left-0 right-0 mt-1 z-50 rounded-lg border shadow-lg max-h-64 overflow-y-auto ${
        isDark 
          ? 'bg-gray-800 border-gray-600' 
          : 'bg-white border-gray-200'
      }`}
      role="listbox"
      aria-label={showRecent ? 'Recent searches' : 'Search suggestions'}
    >
      {/* Header */}
      <div className={`px-3 py-2 border-b text-xs font-medium flex items-center gap-2 ${
        isDark 
          ? 'text-gray-400 border-gray-600' 
          : 'text-gray-500 border-gray-200'
      }`}>
        {showRecent ? (
          <>
            <Clock className="w-3 h-3" />
            Recent searches
          </>
        ) : (
          <>
            <TrendingUp className="w-3 h-3" />
            Suggestions
          </>
        )}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="px-3 py-4 text-center">
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-500 border-t-transparent"></div>
            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Finding suggestions...
            </span>
          </div>
        </div>
      )}

      {/* Items */}
      {!isLoading && items.map((item, index) => (
        <div
          key={item}
          onClick={() => handleSelectItem(item)}
          className={`group px-3 py-2 cursor-pointer flex items-center justify-between transition-colors ${
            index === selectedIndex
              ? isDark 
                ? 'bg-gray-700' 
                : 'bg-gray-50'
              : isDark
                ? 'hover:bg-gray-700'
                : 'hover:bg-gray-50'
          }`}
          role="option"
          aria-selected={index === selectedIndex}
        >
          <div className="flex items-center gap-2 flex-1">
            {showRecent ? (
              <Clock className={`w-3 h-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            ) : (
              <Search className={`w-3 h-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            )}
            <span className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              {item}
            </span>
          </div>
          
          {showRecent && (
            <button
              onClick={(e) => handleRemoveRecent(e, item)}
              className={`w-4 h-4 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${
                isDark 
                  ? 'text-gray-500 hover:text-gray-300 hover:bg-gray-600' 
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'
              }`}
              aria-label={`Remove ${item} from recent searches`}
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      ))}

      {/* No results */}
      {!isLoading && items.length === 0 && showSuggestions && (
        <div className={`px-3 py-4 text-center text-sm ${
          isDark ? 'text-gray-400' : 'text-gray-500'
        }`}>
          No suggestions found
        </div>
      )}
    </div>
  );
};

export default SearchDropdown;