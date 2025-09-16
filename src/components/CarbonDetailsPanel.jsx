import React, { useState } from 'react';
import { Download, Copy, Check, Code2, Tag, Folder, X, FileCode } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useToast } from '../hooks/use-toast';
import { useTheme } from '../contexts/ThemeContext';
import { usePostHog } from 'posthog-js/react';
import IconCodeGenerator from './IconCodeGenerator';

const CarbonDetailsPanel = ({ selectedIcon, onClose, isMobile = false }) => {
  const { isDark } = useTheme();
  const [copied, setCopied] = useState(false);
  const [showCodeGenerator, setShowCodeGenerator] = useState(false);
  const { toast } = useToast();
  const posthog = usePostHog();

  if (!selectedIcon) {
    return (
      <div className={`w-full md:w-80 border-l h-full ${
        isDark 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center px-6">
            <div className={`w-12 h-12 mx-auto mb-4 rounded-lg flex items-center justify-center ${
              isDark ? 'bg-gray-700' : 'bg-gray-200'
            }`}>
              <Code2 className={`w-6 h-6 ${
                isDark ? 'text-gray-500' : 'text-gray-400'
              }`} />
            </div>
            <h3 className={`text-sm font-semibold mb-2 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Select an icon
            </h3>
            <p className={`text-sm leading-relaxed ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Choose an icon to view details and download options
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleDownload = () => {
    if (!selectedIcon.svgContent) {
      toast({
        title: "Failed",
        description: "SVG content not available for download.",
        variant: "destructive",
      });
      return;
    }
    
    const blob = new Blob([selectedIcon.svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedIcon.name.toLowerCase().replace(/\s+/g, '-')}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Track download event
    if (posthog) {
      posthog.capture('icon_downloaded', {
        icon_name: selectedIcon.name,
        icon_category: selectedIcon.category,
        icon_filename: selectedIcon.filename,
        download_method: 'file',
        timestamp: new Date().toISOString(),
      });
    }

    toast({
      title: "Downloaded",
      description: `${selectedIcon.name} downloaded successfully.`,
    });
  };

  const handleCopy = async () => {
    if (!selectedIcon.svgContent) {
      toast({
        title: "Failed",
        description: "SVG content not available for copying.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await navigator.clipboard.writeText(selectedIcon.svgContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      // Track copy event
      if (posthog) {
        posthog.capture('icon_copied', {
          icon_name: selectedIcon.name,
          icon_category: selectedIcon.category,
          icon_filename: selectedIcon.filename,
          copy_method: 'clipboard',
          timestamp: new Date().toISOString(),
        });
      }
      
      toast({
        title: "Copied",
        description: "SVG code copied to clipboard.",
      });
    } catch (err) {
      toast({
        title: "Failed",
        description: "Failed to copy SVG code.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className={`w-full md:w-80 ${isMobile ? '' : 'border-l'} h-full flex flex-col ${
      isDark 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-gray-50 border-gray-200'
    }`}>
      {/* Header with close button for mobile */}
      <div className={`p-4 ${isMobile ? 'border-b' : 'border-b'} ${
        isDark ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Code2 className={`w-4 h-4 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`} />
            <h3 className={`text-sm font-semibold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              ICON DETAILS
            </h3>
          </div>
          {isMobile && onClose && (
            <button
              onClick={onClose}
              className={`p-1 rounded-lg transition-colors ${
                isDark 
                  ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                  : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        
        <div>
          <label className={`block text-xs font-medium mb-1 ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Filename
          </label>
          <div className={`p-2 border rounded text-xs font-mono ${
            isDark 
              ? 'bg-gray-900 border-gray-600 text-gray-200' 
              : 'bg-white border-gray-200 text-gray-900'
          }`}>
            {selectedIcon.filename}.svg
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className={`p-4 border-b ${
        isDark ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <label className={`block text-xs font-medium mb-2 ${
          isDark ? 'text-gray-300' : 'text-gray-700'
        }`}>
          Preview
        </label>
        <div className={`h-32 border rounded flex items-center justify-center ${
          isDark 
            ? 'bg-gray-900 border-gray-600' 
            : 'bg-white border-gray-200'
        }`}>
          <div 
            className={`w-16 h-16 flex items-center justify-center ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}
            style={{
              maxWidth: '64px',
              maxHeight: '64px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            dangerouslySetInnerHTML={{ 
              __html: (selectedIcon.svgContent || '')
                .replace('<svg', `<svg style="width: 64px; height: 64px; max-width: 64px; max-height: 64px; color: ${isDark ? '#ffffff' : '#000000'}; fill: currentColor;"`)
                .replace(/fill="#000000"/g, isDark ? 'fill="currentColor"' : 'fill="#000000"')
                .replace(/fill="#000"/g, isDark ? 'fill="currentColor"' : 'fill="#000"')
                .replace(/fill="black"/g, isDark ? 'fill="currentColor"' : 'fill="black"')
            }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className={`p-4 border-b ${
        isDark ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="space-y-2">
          <Button
            onClick={handleCopy}
            className={`w-full h-8 text-xs font-medium ${
              isDark 
                ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 mr-2" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 mr-2" />
                Copy SVG
              </>
            )}
          </Button>
          
          <Button
            onClick={handleDownload}
            variant="outline"
            className={`w-full h-8 text-xs font-medium ${
              isDark 
                ? 'border-gray-600 bg-gray-900 hover:bg-gray-700 text-gray-300 hover:text-white' 
                : 'border-gray-300 bg-white hover:bg-gray-50 text-gray-700'
            }`}
          >
            <Download className="w-3 h-3 mr-2" />
            Download
          </Button>
          
          <Button
            onClick={() => setShowCodeGenerator(true)}
            variant="outline"
            className={`w-full h-8 text-xs font-medium ${
              isDark 
                ? 'border-gray-600 bg-gray-900 hover:bg-gray-700 text-gray-300 hover:text-white' 
                : 'border-gray-300 bg-white hover:bg-gray-50 text-gray-700'
            }`}
          >
            <FileCode className="w-3 h-3 mr-2" />
            Get Code
          </Button>
        </div>
      </div>

      {/* Metadata */}
      <div className="flex-1 p-4 space-y-4">
        {/* Tags */}
        <div>
          <div className="flex items-center gap-1 mb-2">
            <Tag className={`w-3 h-3 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`} />
            <label className={`text-xs font-medium ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Tags
            </label>
          </div>
          <div className="flex flex-wrap gap-1">
            {selectedIcon.tags.slice(0, 6).map((tag) => (
              <Badge 
                key={tag} 
                variant="outline" 
                className={`text-xs px-2 py-0.5 ${
                  isDark 
                    ? 'bg-gray-900 border-gray-600 text-gray-300' 
                    : 'bg-white border-gray-200 text-gray-700'
                }`}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        {/* Category */}
        <div>
          <div className="flex items-center gap-1 mb-2">
            <Folder className={`w-3 h-3 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`} />
            <label className={`text-xs font-medium ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Category
            </label>
          </div>
          <Badge 
            variant="outline" 
            className={`text-xs px-2 py-0.5 capitalize ${
              isDark 
                ? 'bg-blue-900/50 border-blue-700 text-blue-300' 
                : 'bg-blue-50 border-blue-200 text-blue-700'
            }`}
          >
            {selectedIcon.category}
          </Badge>
        </div>

        {/* SVG Code */}
        <div>
          <div className="flex items-center gap-1 mb-2">
            <Code2 className={`w-3 h-3 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`} />
            <label className={`text-xs font-medium ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              SVG code
            </label>
          </div>
          <div className={`p-2 border rounded ${
            isDark 
              ? 'bg-gray-900 border-gray-600' 
              : 'bg-white border-gray-200'
          }`}>
            <pre className={`text-xs overflow-auto max-h-96 font-mono leading-relaxed ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              <code>{selectedIcon.svgContent}</code>
            </pre>
          </div>
        </div>
      </div>
      
      {/* Icon Code Generator Modal */}
      {showCodeGenerator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowCodeGenerator(false)}
          />
          
          {/* Modal Content */}
          <div className={`relative max-h-[90vh] overflow-y-auto rounded-lg shadow-2xl ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Generate Code
              </h2>
              <button
                onClick={() => setShowCodeGenerator(false)}
                className={`p-2 rounded-lg transition-colors ${
                  isDark 
                    ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                    : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <IconCodeGenerator
              icon={{
                id: selectedIcon.id,
                name: selectedIcon.name,
                svgContent: selectedIcon.svgContent
              }}
              onClose={() => setShowCodeGenerator(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CarbonDetailsPanel;