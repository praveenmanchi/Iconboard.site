import React, { useState, useEffect } from 'react';
import { Smartphone, Zap, Keyboard, TouchApp } from 'lucide-react';
import { Button } from './ui/button';
import { useTouchFriendly, useLongPress } from '../hooks/useMobileGestures';
import { useHapticFeedback } from '../hooks/useHapticFeedback';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Mobile-specific enhancement overlay
 * Shows tips and provides mobile-optimized interactions
 */
export const MobileEnhancementOverlay = ({ onDismiss }) => {
  const { isDark } = useTheme();
  const [currentTip, setCurrentTip] = useState(0);
  
  const tips = [
    {
      icon: TouchApp,
      title: "Touch to Select",
      description: "Tap any icon to view details and copy options"
    },
    {
      icon: Smartphone,
      title: "Swipe to Navigate", 
      description: "Swipe left/right to open/close menus"
    },
    {
      icon: Zap,
      title: "Haptic Feedback",
      description: "Feel vibrations for touch confirmations"
    },
    {
      icon: Keyboard,
      title: "Quick Search",
      description: "Type '/' to quickly focus the search bar"
    }
  ];

  const nextTip = () => {
    setCurrentTip((prev) => (prev + 1) % tips.length);
  };

  const prevTip = () => {
    setCurrentTip((prev) => (prev - 1 + tips.length) % tips.length);
  };

  const CurrentIcon = tips[currentTip].icon;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className={`w-full max-w-sm rounded-xl shadow-2xl border ${
        isDark 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="p-6">
          <div className="text-center mb-6">
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
              isDark ? 'bg-blue-900/20' : 'bg-blue-50'
            }`}>
              <CurrentIcon className={`w-8 h-8 ${
                isDark ? 'text-blue-400' : 'text-blue-600'
              }`} />
            </div>
            <h3 className={`text-lg font-semibold mb-2 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              {tips[currentTip].title}
            </h3>
            <p className={`text-sm ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>
              {tips[currentTip].description}
            </p>
          </div>

          <div className="flex items-center justify-between mb-6">
            <button
              onClick={prevTip}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                isDark 
                  ? 'hover:bg-gray-700 text-gray-400' 
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
              disabled={currentTip === 0}
            >
              ←
            </button>
            
            <div className="flex gap-2">
              {tips.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentTip
                      ? isDark ? 'bg-blue-400' : 'bg-blue-600'
                      : isDark ? 'bg-gray-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
            
            <button
              onClick={nextTip}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                isDark 
                  ? 'hover:bg-gray-700 text-gray-400' 
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
              disabled={currentTip === tips.length - 1}
            >
              →
            </button>
          </div>

          <Button
            onClick={onDismiss}
            className="w-full"
          >
            Got it!
          </Button>
        </div>
      </div>
    </div>
  );
};

/**
 * Mobile-optimized button component with haptic feedback
 */
export const MobileButton = ({ 
  children, 
  onClick, 
  hapticType = 'select',
  longPressAction,
  className = '',
  ...props 
}) => {
  const haptics = useHapticFeedback();
  const { isTouchDevice, getTouchStyles } = useTouchFriendly();
  
  const handleClick = (e) => {
    if (isTouchDevice) {
      haptics[hapticType]();
    }
    onClick?.(e);
  };

  const longPressHandlers = useLongPress(
    longPressAction || (() => {}),
    {
      threshold: 500,
      onStart: () => {
        if (isTouchDevice) {
          haptics.light();
        }
      }
    }
  );

  const touchStyles = getTouchStyles({
    minHeight: '44px',
    minWidth: '44px'
  });

  return (
    <button
      onClick={handleClick}
      className={`transition-all duration-200 ${className}`}
      style={touchStyles}
      {...(longPressAction ? longPressHandlers.handlers : {})}
      {...props}
    >
      {children}
    </button>
  );
};

/**
 * Mobile-optimized icon card with enhanced touch interactions
 */
export const MobileIconCard = ({ 
  icon, 
  isSelected, 
  onSelect, 
  onLongPress 
}) => {
  const { isDark } = useTheme();
  const haptics = useHapticFeedback();
  const { isTouchDevice } = useTouchFriendly();
  
  const handleSelect = () => {
    if (isTouchDevice) {
      haptics.select();
    }
    onSelect(icon);
  };

  const handleLongPress = () => {
    if (isTouchDevice) {
      haptics.action();
    }
    onLongPress?.(icon);
  };

  const longPressHandlers = useLongPress(handleLongPress, {
    threshold: 500,
    onStart: () => {
      if (isTouchDevice) {
        haptics.light();
      }
    }
  });

  return (
    <div
      className={`
        p-4 rounded-lg border transition-all duration-200 cursor-pointer
        ${isSelected 
          ? isDark 
            ? 'border-blue-400 bg-blue-900/20 shadow-lg' 
            : 'border-blue-500 bg-blue-50 shadow-lg'
          : isDark
            ? 'border-gray-700 bg-gray-800 hover:border-gray-600'
            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
        }
        ${isTouchDevice ? 'active:scale-95' : ''}
      `}
      onClick={handleSelect}
      {...longPressHandlers.handlers}
    >
      <div className="flex flex-col items-center text-center">
        <div 
          className={`w-12 h-12 mb-3 flex items-center justify-center ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}
          dangerouslySetInnerHTML={{ __html: icon.svgContent }}
        />
        <h3 className={`text-sm font-medium ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          {icon.name}
        </h3>
        <p className={`text-xs mt-1 ${
          isDark ? 'text-gray-400' : 'text-gray-500'
        }`}>
          {icon.category}
        </p>
      </div>
    </div>
  );
};

/**
 * Hook for showing mobile enhancement tips
 */
export const useMobileEnhancements = () => {
  const [showTips, setShowTips] = useState(false);
  const { isTouchDevice } = useTouchFriendly();

  useEffect(() => {
    // Show tips for first-time mobile users
    if (isTouchDevice) {
      const hasSeenTips = localStorage.getItem('hasSeenMobileTips');
      if (!hasSeenTips) {
        setShowTips(true);
      }
    }
  }, [isTouchDevice]);

  const dismissTips = () => {
    setShowTips(false);
    localStorage.setItem('hasSeenMobileTips', 'true');
  };

  const showTipsAgain = () => {
    setShowTips(true);
  };

  return {
    showTips,
    dismissTips,
    showTipsAgain,
    isTouchDevice
  };
};