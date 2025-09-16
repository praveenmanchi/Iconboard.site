import React, { useEffect, useRef, useCallback } from 'react';
import { ScrollArea } from './ui/scroll-area';
import { Search, Grid, Keyboard } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { IconGridSkeleton, SearchLoadingState, LoadMoreSkeleton } from './LoadingStates';
import { useIconNavigation } from '../hooks/useKeyboardShortcuts';
import { useHapticFeedback } from '../hooks/useHapticFeedback';
import { useScreenReader } from '../hooks/useAccessibility';
import { useSwipeGestures } from '../hooks/useMobileGestures';

const CarbonIconGrid = ({ icons, onIconSelect, selectedIcon, searchTerm, category, loading, loadingMore, hasMore, onLoadMore, isSearching = false }) => {
  const { isDark } = useTheme();
  
  
  const scrollAreaRef = useRef(null);
  const loadingRef = useRef(null);
  
  // Enhanced UX hooks
  const haptics = useHapticFeedback();
  const { announce } = useScreenReader();
  
  // Keyboard navigation for icons
  const { navigateIcon } = useIconNavigation(icons, selectedIcon, onIconSelect, 8);
  
  // Swipe gestures for mobile - temporarily disabled for debugging
  const swipeHandlers = {}; // Empty object when gestures disabled
  // const swipeHandlers = useSwipeGestures({
  //   onSwipeLeft: () => {
  //     if (selectedIcon) {
  //       haptics.light();
  //       // Could navigate to next category or dismiss details
  //     }
  //   },
  //   onSwipeRight: () => {
  //     if (selectedIcon) {
  //       haptics.light();
  //       // Could navigate to previous category or show details
  //     }
  //   }
  // });

  // Enhanced icon selection with haptic feedback
  const handleIconSelect = useCallback((icon) => {
    haptics.select();
    onIconSelect(icon);
    announce(`Selected ${icon.name} icon from ${icon.category} category`);
  }, [onIconSelect, haptics, announce]);

  // Infinite scroll implementation
  const handleScroll = useCallback((event) => {
    const { scrollTop, scrollHeight, clientHeight } = event.target;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 200; // Load when 200px from bottom
    
    if (isNearBottom && hasMore && !loadingMore) {
      onLoadMore();
    }
  }, [hasMore, loadingMore, onLoadMore]);

  // Set up scroll listener
  useEffect(() => {
    const scrollElement = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll);
      return () => scrollElement.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // Also add a manual trigger for testing
  useEffect(() => {
    if (icons.length === 100 && hasMore && !loadingMore) {
      // Auto-trigger first batch after a short delay for better UX
      const timer = setTimeout(() => {
        onLoadMore();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [icons.length, hasMore, loadingMore, onLoadMore]);

  // Remove early return - show icons even while loading to prevent search results from being hidden

  if (icons.length === 0) {
    return (
      <div className={`flex-1 flex items-center justify-center ${
        isDark ? 'bg-gray-900' : 'bg-white'
      }`}>
        <div className="text-center max-w-sm px-4">
          <div className={`w-16 h-16 mx-auto mb-6 rounded-lg flex items-center justify-center ${
            isDark ? 'bg-gray-800' : 'bg-gray-100'
          }`}>
            <Search className={`w-8 h-8 ${
              isDark ? 'text-gray-500' : 'text-gray-400'
            }`} />
          </div>
          <h3 className={`text-sm font-semibold mb-2 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            No icons found
          </h3>
          <p className={`text-sm leading-relaxed ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {searchTerm 
              ? `No icons match "${searchTerm}". Try different keywords.`
              : `No icons available in the ${category} category.`
            }
          </p>
        </div>
      </div>
    );
  }

  const getCategoryTitle = (category) => {
    switch (category) {
      case 'all':
        return 'All icons';
      default:
        return category.charAt(0).toUpperCase() + category.slice(1);
    }
  };

  return (
    <div className={`flex-1 flex flex-col ${
      isDark ? 'bg-gray-900' : 'bg-white'
    }`}>
      {/* Header */}
      <div className={`px-6 py-4 border-b ${
        isDark ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-6 h-6 rounded flex items-center justify-center ${
              isDark ? 'bg-gray-800' : 'bg-gray-100'
            }`}>
              <Grid className={`w-4 h-4 ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`} />
            </div>
            <div>
              <h1 className={`text-lg font-semibold ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {getCategoryTitle(category)}
              </h1>
              {searchTerm && (
                <p className={`text-sm mt-0.5 ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Results for "{searchTerm}"
                </p>
              )}
            </div>
          </div>
          <div className={`text-sm ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {icons.length} {icons.length === 1 ? 'icon' : 'icons'}
          </div>
        </div>
      </div>

      {/* Icons Grid */}
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="p-6">
          {/* Show search loading state */}
          {isSearching && (
            <SearchLoadingState />
          )}
          
          {/* Show skeleton loading for initial load */}
          {loading && !isSearching && (
            <IconGridSkeleton count={20} />
          )}
          
          {/* Show icons grid when loaded */}
          {!loading && (
            <div 
              className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-5 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12 gap-2 sm:gap-3"
              {...swipeHandlers}
              role="grid"
              aria-label={`Icon grid showing ${icons.length} icons`}
            >
              {icons.map((icon, index) => (
                <button
                  key={icon.id}
                  data-icon-id={icon.id}
                  onClick={() => handleIconSelect(icon)}
                  onFocus={() => announce(`${icon.name} icon`)}
                  className={`
                    group relative w-12 h-12 sm:w-16 sm:h-16 border transition-all duration-200 
                    flex items-center justify-center rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2
                    ${selectedIcon?.id === icon.id 
                      ? isDark 
                        ? 'border-blue-400 bg-blue-900/50 shadow-lg ring-2 ring-blue-400/30 focus:ring-blue-400' 
                        : 'border-blue-600 bg-blue-50 shadow-lg ring-2 ring-blue-600/30 focus:ring-blue-500'
                      : isDark
                        ? 'border-gray-600 bg-gray-800 hover:border-gray-500 hover:bg-gray-700 hover:shadow-md focus:ring-blue-400'
                        : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md hover:bg-gray-50 focus:ring-blue-500'
                    }
                  `}
                  title={`${icon.name} - ${icon.category} category`}
                  aria-label={`Select ${icon.name} icon`}
                  role="gridcell"
                  tabIndex={selectedIcon?.id === icon.id ? 0 : -1}
                >
                  <div 
                    className={`w-6 h-6 sm:w-8 sm:h-8 transition-all duration-200 overflow-hidden flex items-center justify-center ${
                      selectedIcon?.id === icon.id 
                        ? isDark 
                          ? 'text-blue-300' 
                          : 'text-blue-700'
                        : isDark
                          ? 'text-gray-300 group-hover:text-white'
                          : 'text-gray-700 group-hover:text-gray-900'
                    } ${isDark ? 'dark-theme-icon' : ''}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                  <div 
                    className="w-full h-full"
                    style={{
                      maxWidth: '32px',
                      maxHeight: '32px',
                      overflow: 'hidden'
                    }}
                  >
                    {icon.svgContent ? (
                      <div dangerouslySetInnerHTML={{ 
                        __html: icon.svgContent
                          .replace('<svg', '<svg style="width: 100%; height: 100%; max-width: 32px; max-height: 32px;"')
                          .replace(/fill="#000000"/g, isDark ? 'fill="currentColor"' : 'fill="#000000"')
                          .replace(/fill="#000"/g, isDark ? 'fill="currentColor"' : 'fill="#000"')
                          .replace(/fill="black"/g, isDark ? 'fill="currentColor"' : 'fill="black"')
                      }} />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center border-2 border-dashed rounded ${
                        isDark ? 'border-gray-600 text-gray-500' : 'border-gray-300 text-gray-400'
                      }`} style={{fontSize: '8px'}}>
                        {icon.name?.substring(0, 3) || '?'}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Selection indicator - larger and more prominent */}
                {selectedIcon?.id === icon.id && (
                  <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
                    isDark ? 'bg-blue-400 ring-2 ring-gray-800' : 'bg-blue-600 ring-2 ring-white'
                  }`}></div>
                )}
              </button>
              ))}
            </div>
          )}
          
          {/* Load More Loading indicator */}
          {loadingMore && (
            <LoadMoreSkeleton />
          )}
          
          {/* No more icons message */}
          {!hasMore && icons.length > 0 && !loading && !isSearching && (
            <div className="flex justify-center mt-8">
              <p className={`text-sm ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                All icons loaded • {icons.length} total
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default CarbonIconGrid;