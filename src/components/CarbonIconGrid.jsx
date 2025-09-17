import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Search, Grid as GridIcon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { IconGridSkeleton, SearchLoadingState, LoadMoreSkeleton } from './LoadingStates';
import { useHapticFeedback } from '../hooks/useHapticFeedback';
import { useScreenReader } from '../hooks/useAccessibility';

// Simple Icon Cell Component
const IconCell = React.memo(({ icon, onIconSelect, selectedIcon, isDark, haptics, announce }) => {
  const isSelected = selectedIcon?.id === icon.id;

  const handleIconSelect = useCallback(() => {
    haptics.select();
    onIconSelect(icon);
    announce(`Selected ${icon.name} icon from ${icon.category} category`);
  }, [icon, onIconSelect, haptics, announce]);

  return (
    <button
      onClick={handleIconSelect}
      onFocus={() => announce(`${icon.name} icon`)}
      className={`
        group relative w-full h-24 border transition-all duration-200 
        flex items-center justify-center rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2
        ${isSelected 
          ? isDark 
            ? 'border-blue-400 bg-blue-900/50 shadow-lg ring-2 ring-blue-400/30 focus:ring-blue-400' 
            : 'border-blue-600 bg-blue-50 shadow-lg ring-2 ring-blue-600/30 focus:ring-blue-500'
          : isDark
            ? 'border-gray-600 bg-gray-800 hover:border-gray-500 hover:bg-gray-700 hover:shadow-md focus:ring-blue-400'
            : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md hover:bg-gray-50 focus:ring-blue-500'
        }
      `}
      style={{
        // DOM optimization - prevent rendering slowdown with large icon counts
        contentVisibility: 'auto',
        containIntrinsicSize: '96px 96px', // Reserve space for 24h (h-24) container
        contain: 'layout style paint'
      }}
      title={`${icon.name} - ${icon.category} category`}
      aria-label={`Select ${icon.name} icon`}
    >
      <div 
        className={`w-8 h-8 transition-all duration-200 overflow-hidden flex items-center justify-center ${
          isSelected 
            ? isDark 
              ? 'text-blue-300' 
              : 'text-blue-700'
            : isDark
              ? 'text-gray-300 group-hover:text-white'
              : 'text-gray-700 group-hover:text-gray-900'
        }`}
      >
        {icon.svgContent ? (
          <div 
            className="w-full h-full"
            style={{ maxWidth: '32px', maxHeight: '32px' }}
            dangerouslySetInnerHTML={{ 
              __html: (() => {
                try {
                  let svgContent = icon.svgContent;
                  if (!svgContent.includes('<svg')) {
                    throw new Error('Invalid SVG content');
                  }
                  
                  svgContent = svgContent.replace('<svg', '<svg style="width: 100%; height: 100%; max-width: 32px; max-height: 32px;"');
                  
                  if (isDark) {
                    svgContent = svgContent
                      .replace(/fill="#000000"/g, 'fill="currentColor"')
                      .replace(/fill="#000"/g, 'fill="currentColor"')
                      .replace(/fill="black"/g, 'fill="currentColor"');
                  }
                  
                  return svgContent;
                } catch (error) {
                  console.warn('Invalid SVG content for icon:', icon.name, error);
                  return '<div style="width: 32px; height: 32px; background: #f0f0f0; border-radius: 4px;"></div>';
                }
              })()
            }} 
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center border-2 border-dashed rounded ${
            isDark ? 'border-gray-600 text-gray-500' : 'border-gray-300 text-gray-400'
          }`} style={{fontSize: '8px'}}>
            {icon.name ? icon.name.substring(0, 3) : '?'}
          </div>
        )}
      </div>
      
      {/* Selection indicator */}
      {isSelected && (
        <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
          isDark ? 'bg-blue-400 ring-2 ring-gray-800' : 'bg-blue-600 ring-2 ring-white'
        }`} />
      )}
    </button>
  );
});

IconCell.displayName = 'IconCell';


const CarbonIconGrid = ({ 
  icons = [], 
  onIconSelect, 
  selectedIcon, 
  searchTerm, 
  category, 
  loading, 
  loadingMore, 
  hasMore, 
  onLoadMore, 
  isSearching = false 
}) => {
  const { isDark } = useTheme();
  const haptics = useHapticFeedback();
  const screenReader = useScreenReader();
  const announce = screenReader?.announce || (() => {});

  // Enhanced icon selection with haptic feedback
  const handleIconSelect = useCallback((icon) => {
    haptics.select();
    onIconSelect(icon);
    announce(`Selected ${icon.name} icon from ${icon.category} category`);
  }, [onIconSelect, haptics, announce]);

  
  // Infinite scroll implementation
  const gridContainerRef = useRef(null);
  const hasTriggeredRef = useRef(false);
  
  useEffect(() => {
    const container = gridContainerRef.current;
    if (!container || !hasMore || loadingMore || loading) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
      
      if (scrollPercentage > 0.8 && !hasTriggeredRef.current) {
        hasTriggeredRef.current = true;
        onLoadMore();
      } else if (scrollPercentage <= 0.8) {
        hasTriggeredRef.current = false;
      }
    };

    // Throttle scroll events to improve performance
    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    container.addEventListener('scroll', throttledScroll, { passive: true });
    return () => container.removeEventListener('scroll', throttledScroll);
  }, [hasMore, loadingMore, onLoadMore]);

  if (icons.length === 0 && !loading && !isSearching) {
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
              <GridIcon className={`w-4 h-4 ${
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

      {/* Content Area */}
      <div ref={gridContainerRef} className="flex-1 overflow-y-auto">
        <div className="p-6">
          {/* Show search loading state */}
          {isSearching && <SearchLoadingState />}
          
          {/* Show skeleton loading for initial load */}
          {loading && !isSearching && <IconGridSkeleton count={20} />}
          
          {/* Icons Grid with CSS Grid (Non-Virtualized) */}
          {!loading && icons.length > 0 && (
            <>
              <div className="grid gap-3 auto-fill-grid">
                {icons.filter(Boolean).map((icon, index) => (
                  <IconCell
                    key={`${icon.id}-${index}`}
                    icon={icon}
                    onIconSelect={handleIconSelect}
                    selectedIcon={selectedIcon}
                    isDark={isDark}
                    haptics={haptics}
                    announce={announce}
                  />
                ))}
              </div>
              
              
              {/* Loading indicator */}
              {loadingMore && (
                <div className="flex items-center justify-center mt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Loading more icons...
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CarbonIconGrid;