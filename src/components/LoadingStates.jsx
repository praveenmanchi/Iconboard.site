import React from 'react';
import { Skeleton } from './ui/skeleton';

// Icon Grid Skeleton
export const IconGridSkeleton = ({ count = 12 }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 p-4">
      {Array.from({ length: count }).map((_, index) => (
        <IconCardSkeleton key={index} />
      ))}
    </div>
  );
};

// Individual Icon Card Skeleton
export const IconCardSkeleton = () => {
  return (
    <div className="flex flex-col items-center p-4 rounded-lg border bg-white dark:bg-gray-800 dark:border-gray-700">
      {/* Icon placeholder */}
      <Skeleton className="h-12 w-12 mb-3" />
      
      {/* Name placeholder */}
      <Skeleton className="h-3 w-16 mb-1" />
      
      {/* Category placeholder */}
      <Skeleton className="h-2 w-12" />
    </div>
  );
};

// Category Sidebar Skeleton
export const CategorySkeleton = ({ count = 8 }) => {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex items-center justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-8" />
        </div>
      ))}
    </div>
  );
};

// Details Panel Skeleton
export const DetailsPanelSkeleton = () => {
  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-24" />
      </div>
      
      {/* Icon display */}
      <div className="flex justify-center mb-6">
        <Skeleton className="h-16 w-16" />
      </div>
      
      {/* Icon info */}
      <div className="space-y-3">
        <div>
          <Skeleton className="h-3 w-16 mb-1" />
          <Skeleton className="h-8 w-full" />
        </div>
        
        <div>
          <Skeleton className="h-3 w-20 mb-1" />
          <Skeleton className="h-6 w-24" />
        </div>
        
        <div>
          <Skeleton className="h-3 w-12 mb-1" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-12" />
          </div>
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="space-y-2 pt-4">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
      </div>
    </div>
  );
};

// Search Loading State
export const SearchLoadingState = () => {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="flex items-center gap-2">
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
        <span className="text-sm text-gray-600 dark:text-gray-400">Searching icons...</span>
      </div>
    </div>
  );
};

// Load More Button Loading State
export const LoadMoreSkeleton = () => {
  return (
    <div className="flex justify-center py-6">
      <Skeleton className="h-10 w-32" />
    </div>
  );
};