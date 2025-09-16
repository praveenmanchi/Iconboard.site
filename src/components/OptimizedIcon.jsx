import React, { memo, useState, useCallback } from 'react';
import { Badge } from './ui/badge';

/**
 * Optimized Icon Component with React.memo for performance
 * Only re-renders when props actually change
 */
const OptimizedIcon = memo(({
  icon,
  onSelect,
  isSelected = false,
  showCategory = true,
  size = 'default' // 'sm', 'default', 'lg'
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleSelect = useCallback(() => {
    onSelect?.(icon);
  }, [onSelect, icon]);

  const handleImageLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleImageError = useCallback(() => {
    setIsLoading(false);
    setImageError(true);
  }, []);

  const sizeClasses = {
    sm: {
      container: 'p-2',
      icon: 'h-8 w-8',
      text: 'text-xs',
      badge: 'text-xs'
    },
    default: {
      container: 'p-3',
      icon: 'h-12 w-12',
      text: 'text-sm',
      badge: 'text-xs'
    },
    lg: {
      container: 'p-4',
      icon: 'h-16 w-16',
      text: 'text-base',
      badge: 'text-sm'
    }
  };

  const classes = sizeClasses[size];

  return (
    <div
      className={`
        ${classes.container}
        flex flex-col items-center cursor-pointer rounded-lg border transition-all duration-200 hover:shadow-md group
        ${isSelected 
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400' 
          : 'border-gray-200 bg-white hover:border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:hover:border-gray-600'
        }
      `}
      onClick={handleSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleSelect()}
      aria-label={`Select ${icon.name} icon`}
    >
      {/* Icon Display */}
      <div className={`${classes.icon} mb-2 flex items-center justify-center relative`}>
        {isLoading && (
          <div className="absolute inset-0 animate-pulse bg-gray-200 dark:bg-gray-700 rounded" />
        )}
        
        {imageError ? (
          // Fallback icon if SVG fails to load
          <div className={`${classes.icon} bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center`}>
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        ) : (
          // SVG Content
          <div
            className={`${classes.icon} flex items-center justify-center text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors`}
            dangerouslySetInnerHTML={{ __html: icon.svgContent }}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        )}
      </div>

      {/* Icon Name */}
      <h3 className={`${classes.text} font-medium text-center text-gray-900 dark:text-white truncate w-full mb-1`}>
        {icon.name}
      </h3>

      {/* Category Badge */}
      {showCategory && icon.category && (
        <Badge 
          variant="secondary" 
          className={`${classes.badge} px-2 py-0 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300`}
        >
          {icon.category}
        </Badge>
      )}

      {/* Featured indicator */}
      {icon.featured && (
        <div className="absolute top-1 right-1 w-2 h-2 bg-yellow-500 rounded-full" />
      )}
    </div>
  );
});

OptimizedIcon.displayName = 'OptimizedIcon';

export default OptimizedIcon;