import React, { useState, useMemo, useEffect, Suspense, lazy } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "./components/ui/toaster";
import { ThemeProvider } from "./contexts/ThemeContext";
import { usePostHog } from 'posthog-js/react';
import { Analytics } from "@vercel/analytics/react";
import CarbonHeader from "./components/CarbonHeader";
import ErrorBoundary from "./components/ErrorBoundary";
import EnhancedErrorBoundary from "./components/EnhancedErrorBoundary";
import { IconGridSkeleton, CategorySkeleton, DetailsPanelSkeleton } from './components/LoadingStates';
import { useDebouncedSearch } from './hooks/useDebounce';
import { useBundlePerformance } from './hooks/usePerformance';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useScreenReader } from './hooks/useAccessibility';
import { useSwipeGestures } from './hooks/useMobileGestures';
import { useWebVitals, useCustomMetrics } from './hooks/useWebVitals';
import { useAnalytics } from './hooks/useAnalytics';

// Lazy load heavy components
const CarbonSidebar = lazy(() => import("./components/CarbonSidebar"));
const CarbonIconGrid = lazy(() => import("./components/CarbonIconGrid"));
const CarbonDetailsPanel = lazy(() => import("./components/CarbonDetailsPanel"));
const DynamicOGMeta = lazy(() => import("./components/DynamicOGMeta"));
import { iconAPI, categoryAPI } from "./services/api";

const Home = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedIcon, setSelectedIcon] = useState(null);
  const [icons, setIcons] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentLimit, setCurrentLimit] = useState(100);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobileDetailsOpen, setIsMobileDetailsOpen] = useState(false);
  const posthog = usePostHog();

  // Use debounced search to reduce API calls
  const { debouncedSearchTerm, isSearching } = useDebouncedSearch(searchTerm, 300);

  // Track bundle performance metrics
  const bundleMetrics = useBundlePerformance();

  // Screen reader announcements
  const { announce } = useScreenReader();

  // Enhanced analytics and web vitals
  useWebVitals(process.env.NODE_ENV === 'production'); // Only in production for performance
  const { trackEvent, trackError, trackFeatureUsage } = useAnalytics();
  const { trackCustomMetric, trackSearchPerformance, trackIconInteraction } = useCustomMetrics();

  // Swipe gestures for mobile navigation
  const swipeHandlers = useSwipeGestures({
    onSwipeLeft: () => {
      // Close mobile sidebar if open
      if (isMobileSidebarOpen) {
        setIsMobileSidebarOpen(false);
        announce('Menu closed');
      }
      // Close mobile details if open
      else if (isMobileDetailsOpen) {
        setIsMobileDetailsOpen(false);
        announce('Details closed');
      }
    },
    onSwipeRight: () => {
      // Open mobile sidebar if closed
      if (!isMobileSidebarOpen && !isMobileDetailsOpen) {
        setIsMobileSidebarOpen(true);
        announce('Menu opened');
      }
    }
  });

  // Global keyboard shortcuts
  useKeyboardShortcuts({
    'escape': () => {
      if (isMobileDetailsOpen) {
        setIsMobileDetailsOpen(false);
        announce('Details closed');
      } else if (isMobileSidebarOpen) {
        setIsMobileSidebarOpen(false);
        announce('Menu closed');
      }
    },
    '?': () => {
      announce('Keyboard shortcuts: Escape to close panels, Slash or Cmd+K for search, Arrow keys to navigate icons');
    },
    'h': () => {
      announce('Welcome to IconBoard. Use Cmd+K to search, arrow keys to navigate icons, and Enter to select.');
    }
  }, [isMobileDetailsOpen, isMobileSidebarOpen]);

  // Log performance metrics in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && bundleMetrics.loadTime > 0) {
      console.log('📊 Bundle Performance Metrics:', bundleMetrics);
      
      // Warn about slow loading
      if (bundleMetrics.loadTime > 3000) {
        console.warn('🐌 Slow page load detected:', bundleMetrics.loadTime + 'ms');
      }
    }
  }, [bundleMetrics]);

  // Track page view
  useEffect(() => {
    if (posthog) {
      posthog.capture('page_view', {
        page: 'home',
        timestamp: new Date().toISOString(),
      });
    }
  }, [posthog]);

  // Load categories on component mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoriesData = await categoryAPI.getCategories();
        setCategories(categoriesData);
      } catch (err) {
        console.error('Failed to load categories:', err);
        setError('Failed to load categories');
      }
    };
    loadCategories();
  }, []);

  // Load icons when category or debounced search changes
  useEffect(() => {
    const loadIcons = async () => {
      try {
        setLoading(true);
        // Don't clear icons immediately - keep showing current icons while loading
        setCurrentLimit(100); // Reset limit
        setHasMore(true); // Reset hasMore flag
        
        const params = {
          limit: 100 // Optimized initial load for better performance
        };
        
        if (selectedCategory !== 'all') {
          params.category = selectedCategory;
        }
        
        if (debouncedSearchTerm) {
          params.search = debouncedSearchTerm;
        }
        
        // Track search/load performance
        const startTime = performance.now();
        const iconsData = await iconAPI.getIcons(params);
        const endTime = performance.now();
        const loadTime = endTime - startTime;
        
        
        setIcons(iconsData);

        // Track performance metrics
        if (debouncedSearchTerm) {
          trackSearchPerformance(debouncedSearchTerm, iconsData.length, loadTime, 'search');
        } else {
          trackCustomMetric('icon_load_time', loadTime, {
            category: params.category || 'all',
            result_count: iconsData.length,
            load_type: 'initial'
          });
        }
        
        // Check if we have fewer icons than the limit, meaning no more to load
        if (iconsData.length < 100) {
          setHasMore(false);
        }
      } catch (err) {
        console.error('Failed to load icons:', err);
        setError('Failed to load icons');
        setIcons([]);
      } finally {
        setLoading(false);
      }
    };

    loadIcons();
  }, [selectedCategory, debouncedSearchTerm]);

  // Function to load more icons
  const loadMoreIcons = async () => {
    if (loadingMore || !hasMore) return;
    
    try {
      setLoadingMore(true);
      const newLimit = currentLimit + 100;
      
      const params = {
        limit: newLimit
      };
      
      if (selectedCategory !== 'all') {
        params.category = selectedCategory;
      }
      
      if (debouncedSearchTerm) {
        params.search = debouncedSearchTerm;
      }
      
      const iconsData = await iconAPI.getIcons(params);
      setIcons(iconsData);
      setCurrentLimit(newLimit);
      
      // Check if we have fewer new icons than expected, meaning no more to load
      if (iconsData.length < newLimit) {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Failed to load more icons:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    setSelectedIcon(null); // Clear selection when searching
    
    // Track search event
    if (posthog && term) {
      posthog.capture('search_performed', {
        query: term,
        timestamp: new Date().toISOString(),
      });
    }
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setSelectedIcon(null); // Clear selection when changing category
    setIsMobileSidebarOpen(false); // Close mobile sidebar when category is selected
    
    // Track category selection
    if (posthog) {
      posthog.capture('category_selected', {
        category: category,
        timestamp: new Date().toISOString(),
      });
    }
  };

  const handleIconSelect = (icon) => {
    setSelectedIcon(icon);
    setIsMobileDetailsOpen(true); // Open mobile details panel when icon is selected
    
    // Track icon selection
    if (posthog && icon) {
      posthog.capture('icon_selected', {
        icon_name: icon.name,
        icon_category: icon.category,
        icon_filename: icon.filename,
        timestamp: new Date().toISOString(),
      });
    }
  };

  const handleCloseMobileDetails = () => {
    setIsMobileDetailsOpen(false);
    // Keep selectedIcon so desktop view still shows the selection
  };

  const getCategoryTitle = (category) => {
    if (category === 'all') return 'All Icons';
    return category.charAt(0).toUpperCase() + category.slice(1) + ' Icons';
  };

  const getPageTitle = () => {
    let title = 'IconBoard - Free SVG Icon Library';
    
    if (selectedCategory !== 'all') {
      title = `${getCategoryTitle(selectedCategory)} - IconBoard`;
    }
    
    if (searchTerm) {
      title = `Search: ${searchTerm} - IconBoard`;
    }
    
    return title;
  };

  const handleToggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md px-8">
          <div className="w-16 h-16 mx-auto mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Something went wrong</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white text-sm font-medium border-0 transition-colors duration-200"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900" {...swipeHandlers}>
      {/* Dynamic OG Meta Tags */}
      <Suspense fallback={null}>
        <DynamicOGMeta 
          title={getPageTitle()}
          category={selectedCategory}
          iconCount={icons.length}
        />
      </Suspense>
      
      <EnhancedErrorBoundary componentName="CarbonHeader" fallbackMessage="Failed to load header. Please refresh the page.">
        <CarbonHeader
          onSearch={handleSearch}
          searchTerm={searchTerm}
          onToggleMobileSidebar={handleToggleMobileSidebar}
          isMobileSidebarOpen={isMobileSidebarOpen}
          icons={icons}
        />
      </EnhancedErrorBoundary>
      
      <div className="flex h-[calc(100vh-3rem)] relative" role="main">
        {/* Mobile Sidebar Overlay */}
        {isMobileSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}
        
        {/* Sidebar */}
        <div className={`${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 fixed md:relative z-50 md:z-0 transition-transform duration-300 ease-in-out`}>
          <EnhancedErrorBoundary componentName="CarbonSidebar" fallbackMessage="Failed to load categories. Please refresh to try again.">
            <Suspense fallback={<CategorySkeleton />}>
              <CarbonSidebar
                selectedCategory={selectedCategory}
                onCategorySelect={handleCategorySelect}
                categories={categories}
              />
            </Suspense>
          </EnhancedErrorBoundary>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 flex">
          <EnhancedErrorBoundary componentName="CarbonIconGrid" fallbackMessage="Failed to load icons. Please try refreshing or selecting a different category.">
            <Suspense fallback={<IconGridSkeleton count={16} />}>
              <CarbonIconGrid
                icons={icons}
                onIconSelect={handleIconSelect}
                selectedIcon={selectedIcon}
                searchTerm={searchTerm}
                category={selectedCategory}
                loading={loading}
                loadingMore={loadingMore}
                hasMore={hasMore}
                onLoadMore={loadMoreIcons}
                isSearching={isSearching}
              />
            </Suspense>
          </EnhancedErrorBoundary>
          
          {/* Desktop Details Panel */}
          <div className="hidden md:block">
            <EnhancedErrorBoundary componentName="CarbonDetailsPanel" fallbackMessage="Failed to load icon details.">
              <Suspense fallback={<DetailsPanelSkeleton />}>
                <CarbonDetailsPanel
                  selectedIcon={selectedIcon}
                />
              </Suspense>
            </EnhancedErrorBoundary>
          </div>
        </div>
        
        {/* Mobile Details Panel Overlay */}
        {isMobileDetailsOpen && selectedIcon && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden"
            onClick={handleCloseMobileDetails}
          />
        )}
        
        {/* Mobile Details Panel */}
        <div className={`${
          isMobileDetailsOpen && selectedIcon ? 'translate-x-0' : 'translate-x-full'
        } md:hidden fixed right-0 top-0 bottom-0 w-full max-w-sm bg-white dark:bg-gray-800 z-50 transition-transform duration-300 ease-in-out shadow-2xl`}>
          <EnhancedErrorBoundary componentName="MobileCarbonDetailsPanel" fallbackMessage="Failed to load icon details.">
            <Suspense fallback={<DetailsPanelSkeleton />}>
              <CarbonDetailsPanel
                selectedIcon={selectedIcon}
                onClose={handleCloseMobileDetails}
                isMobile={true}
              />
            </Suspense>
          </EnhancedErrorBoundary>
        </div>
      </div>
      
      <Toaster />
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <div className="App">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />}>
              <Route index element={<Home />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <Analytics />
      </div>
    </ThemeProvider>
  );
}

export default App;