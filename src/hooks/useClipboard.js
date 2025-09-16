import { useState, useCallback } from 'react';
import { useCustomMetrics } from './useWebVitals';
import { useScreenReader } from './useAccessibility';

/**
 * Hook for copying text to clipboard with feedback and analytics
 * @returns {object} { copyToClipboard, copied, error, clearState }
 */
export function useClipboard() {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);
  const { trackIconInteraction } = useCustomMetrics();
  const { announce } = useScreenReader();

  const copyToClipboard = useCallback(async (text, metadata = {}) => {
    try {
      setError(null);
      
      if (navigator.clipboard && window.isSecureContext) {
        // Use modern Clipboard API
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers or non-HTTPS
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (!successful) {
          throw new Error('Fallback copy method failed');
        }
      }

      setCopied(true);
      announce('Copied to clipboard');
      
      // Track copy action
      if (metadata.iconId && metadata.iconName) {
        trackIconInteraction(metadata.iconId, metadata.iconName, 'copy', {
          code_type: metadata.codeType || 'svg',
          format: metadata.format || 'raw'
        });
      }

      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
      
      return true;
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      setError('Failed to copy to clipboard');
      announce('Failed to copy to clipboard');
      
      // Reset error after 3 seconds
      setTimeout(() => setError(null), 3000);
      
      return false;
    }
  }, [trackIconInteraction, announce]);

  const clearState = useCallback(() => {
    setCopied(false);
    setError(null);
  }, []);

  return {
    copyToClipboard,
    copied,
    error,
    clearState
  };
}