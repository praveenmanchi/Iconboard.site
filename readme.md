# IconBoard - SVG Icon Library

## Overview

IconBoard is a comprehensive SVG icon library application that provides users with access to thousands of free icons for web and mobile projects. The application features a modern React-based frontend with dark mode support, real-time search functionality, and category-based browsing. Users can preview, copy, and download icons instantly with a focus on performance and accessibility.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 19 with Create React App as the foundation
- **Build System**: CRACO (Create React App Configuration Override) for custom webpack configurations
- **Routing**: React Router DOM v7 for client-side navigation
- **UI Components**: Comprehensive design system built on Radix UI primitives with shadcn/ui styling
- **Styling**: Tailwind CSS with custom design tokens and CSS variables for theming
- **State Management**: React hooks and context for local state management

### Component Design Patterns
- **Lazy Loading**: Critical components are lazy-loaded to improve initial bundle size
- **Error Boundaries**: Multiple layers of error handling with enhanced error boundaries
- **Performance Optimization**: Debounced search, virtualization, and chunk-based icon loading
- **Accessibility**: Screen reader support, keyboard navigation, and ARIA compliance
- **Mobile-First**: Responsive design with touch gestures and mobile-specific interactions

### Data Architecture
- **Icon Storage**: Static JSON files with chunked loading for performance (50 icons per chunk)
- **Category System**: Hierarchical categorization with dynamic filtering
- **Search Implementation**: Client-side search with debouncing and performance optimization
- **Caching Strategy**: Browser caching for static assets and API responses

### Backend Integration
- **API Design**: RESTful endpoints for icons, categories, and health checks
- **Static File Serving**: Pre-generated JSON chunks for optimal performance
- **Environment Configuration**: Dynamic backend URL configuration for different environments

### Performance Optimizations
- **Bundle Splitting**: Lazy loading of heavy components and libraries
- **Image Optimization**: SVG content served as strings with optimized rendering
- **Virtualization**: Efficient rendering of large icon collections
- **Web Vitals Tracking**: Performance monitoring and optimization

### Development Workflow
- **Hot Reload**: Configurable hot module replacement for development
- **Build Process**: Optimized production builds with asset optimization
- **Environment Management**: Multi-environment support with dynamic configuration

## External Dependencies

### UI and Design System
- **Radix UI**: Complete set of accessible, unstyled UI primitives for dialog, toast, navigation, and form components
- **Tailwind CSS**: Utility-first CSS framework with custom configuration
- **Lucide React**: Icon library for UI elements and interface icons
- **Next Themes**: Theme management for dark/light mode switching

### Data and Backend Services
- **Supabase**: Backend-as-a-Service for authentication, database, and file storage
- **Axios**: HTTP client for API requests and data fetching

### Development and Build Tools
- **CRACO**: Create React App configuration override for custom webpack settings
- **PostCSS**: CSS processing with Autoprefixer for cross-browser compatibility
- **ESLint**: Code linting with React-specific rules and accessibility checks

### Analytics and Monitoring
- **PostHog**: Product analytics, feature flags, and user behavior tracking
- **Web Vitals**: Performance monitoring and optimization metrics

### Form and Interaction Libraries
- **React Hook Form**: Form state management with validation
- **Embla Carousel**: Carousel component for icon browsing
- **React Resizable Panels**: Resizable layout panels for desktop interface

### Utility Libraries
- **Class Variance Authority**: Type-safe CSS class composition
- **clsx**: Conditional className utility
- **date-fns**: Date manipulation and formatting
- **Sonner**: Toast notification system