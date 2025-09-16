import React, { useState, useRef, useEffect } from 'react';
import { Search, Sun, Moon, Menu, X, Keyboard } from 'lucide-react';
import { Input } from './ui/input';
import { useTheme } from '../contexts/ThemeContext';
import { usePostHog } from 'posthog-js/react';
import { useSearchShortcuts } from '../hooks/useKeyboardShortcuts';
import { useHapticFeedback } from '../hooks/useHapticFeedback';
import { useScreenReader } from '../hooks/useAccessibility';
import SearchDropdown from './SearchDropdown';
import { useRecentSearches } from '../hooks/useRecentSearches';

const CarbonHeader = ({ onSearch, searchTerm, onToggleMobileSidebar, isMobileSidebarOpen, icons = [] }) => {
  const { isDark, toggleTheme } = useTheme();
  const posthog = usePostHog();
  const searchInputRef = useRef(null);
  const [showShortcutHint, setShowShortcutHint] = useState(false);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  
  // Hooks
  const haptics = useHapticFeedback();
  const { announce } = useScreenReader();
  const { addRecentSearch } = useRecentSearches();

  // Clear search and handle shortcuts
  const handleClearSearch = () => {
    onSearch('');
    announce('Search cleared');
  };

  // Setup search shortcuts
  useSearchShortcuts(searchInputRef, handleClearSearch);

  // Show keyboard shortcut hint on first visit
  useEffect(() => {
    const hasSeenHint = localStorage.getItem('hasSeenKeyboardHint');
    if (!hasSeenHint) {
      setShowShortcutHint(true);
      setTimeout(() => {
        setShowShortcutHint(false);
        localStorage.setItem('hasSeenKeyboardHint', 'true');
      }, 3000);
    }
  }, []);

  const handleThemeToggle = () => {
    toggleTheme();
    haptics.select();
    announce(`Switched to ${!isDark ? 'dark' : 'light'} theme`);
    
    if (posthog) {
      posthog.capture('theme_toggled', {
        new_theme: !isDark ? 'dark' : 'light',
        timestamp: new Date().toISOString(),
      });
    }
  };

  const handleMobileMenuToggle = () => {
    onToggleMobileSidebar();
    haptics.select();
    announce(isMobileSidebarOpen ? 'Menu closed' : 'Menu opened');
  };

  const handleSearchChange = (e) => {
    onSearch(e.target.value);
    if (e.target.value.length > 0) {
      announce(`Searching for ${e.target.value}`);
    }
    
    // Open dropdown when typing
    if (!isSearchDropdownOpen) {
      setIsSearchDropdownOpen(true);
    }
  };

  const handleSearchSubmit = (searchValue) => {
    if (searchValue && searchValue.trim()) {
      addRecentSearch(searchValue);
      onSearch(searchValue);
      announce(`Searching for ${searchValue}`);
    }
  };

  const handleSearchFocus = () => {
    setIsSearchDropdownOpen(true);
  };

  const handleSearchBlur = () => {
    // Delay to allow click on dropdown items
    setTimeout(() => {
      setIsSearchDropdownOpen(false);
    }, 200);
  };

  const handleCloseDropdown = () => {
    setIsSearchDropdownOpen(false);
  };

  return (
    <header className={`border-b h-12 flex items-center px-4 sticky top-0 z-50 ${
      isDark 
        ? 'bg-gray-900 border-gray-700' 
        : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center justify-between w-full max-w-screen-2xl mx-auto">
        {/* Mobile Menu Button */}
        <button
          onClick={handleMobileMenuToggle}
          className={`md:hidden w-10 h-10 flex items-center justify-center rounded-lg transition-colors duration-200 ${
            isDark 
              ? 'text-gray-300 hover:bg-gray-800 hover:text-white' 
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          aria-expanded={isMobileSidebarOpen}
          aria-label={isMobileSidebarOpen ? 'Close menu' : 'Open menu'}
          aria-controls="mobile-sidebar"
        >
          {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Logo */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <img 
                src="/logo.svg" 
                alt="IconBoard Logo" 
                className="h-6 md:h-8 w-auto"
                style={{ filter: isDark ? 'none' : 'invert(1)' }}
              />
              <span className={`hidden sm:inline text-xs px-2 py-0.5 rounded ${
                isDark 
                  ? 'text-gray-400 bg-gray-800' 
                  : 'text-gray-500 bg-gray-100'
              }`}>
                V2.03
              </span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-md mx-4 md:mx-8 relative">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none ${
              isDark ? 'text-gray-400' : 'text-gray-400'
            }`} />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Search icons..."
              value={searchTerm}
              onChange={handleSearchChange}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isSearchDropdownOpen) {
                  e.preventDefault();
                  handleSearchSubmit(searchTerm);
                }
              }}
              className={`pl-10 pr-20 h-9 transition-all duration-200 ${
                isDark 
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-blue-400/20' 
                  : 'bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20'
              }`}
              aria-label="Search icons"
              aria-describedby="search-hint"
              role="searchbox"
              aria-expanded={isSearchDropdownOpen}
              aria-autocomplete="list"
            />
            
            {/* Keyboard shortcut hint */}
            <div className={`absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1 pointer-events-none ${
              isDark ? 'text-gray-500' : 'text-gray-400'
            }`}>
              <Keyboard className="w-3 h-3" />
              <span className="text-xs font-mono">⌘K</span>
            </div>
            
            {/* Clear button when there's text */}
            {searchTerm && (
              <button
                onClick={handleClearSearch}
                className={`absolute right-8 top-1/2 transform -translate-y-1/2 w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                  isDark 
                    ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' 
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'
                }`}
                aria-label="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          
          {/* Enhanced Search Dropdown */}
          <SearchDropdown
            searchTerm={searchTerm}
            onSearch={handleSearchSubmit}
            icons={icons}
            isOpen={isSearchDropdownOpen}
            onClose={handleCloseDropdown}
            inputRef={searchInputRef}
          />
          
          {/* Keyboard shortcut tooltip */}
          {showShortcutHint && (
            <div className={`absolute top-full left-0 right-0 mt-2 p-2 rounded-lg shadow-lg border text-xs text-center transition-opacity duration-500 ${
              isDark 
                ? 'bg-gray-800 border-gray-700 text-gray-300' 
                : 'bg-white border-gray-200 text-gray-600'
            }`}>
              💡 Press <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">⌘K</kbd> or <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">/</kbd> to focus search
            </div>
          )}
          
          {/* Screen reader only search description */}
          <div id="search-hint" className="sr-only">
            Use Cmd+K or forward slash to focus search. Type to search through 13,000+ icons.
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button
            onClick={handleThemeToggle}
            className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors duration-200 ${
              isDark 
                ? 'text-gray-300 hover:bg-gray-800 hover:text-yellow-400' 
                : 'text-gray-700 hover:bg-gray-100 hover:text-yellow-600'
            }`}
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
            title={`Switch to ${isDark ? 'light' : 'dark'} theme`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default CarbonHeader;