import React, { useState } from 'react';
import { Copy, Code, Download, Check, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { useTheme } from '../contexts/ThemeContext';
import { useClipboard } from '../hooks/useClipboard';

const IconCodeGenerator = ({ icon, onClose }) => {
  const { isDark } = useTheme();
  const { copyToClipboard, copied, error } = useClipboard();
  const [selectedFormat, setSelectedFormat] = useState('component');
  const [selectedFramework, setSelectedFramework] = useState('react');

  if (!icon) return null;

  // Generate code based on selected format and framework
  const generateCode = () => {
    if (!icon.svgContent) return '';
    const iconName = icon.name.replace(/[^a-zA-Z0-9]/g, '');
    const PascalCaseName = iconName.charAt(0).toUpperCase() + iconName.slice(1);
    
    switch (selectedFramework) {
      case 'react':
        if (selectedFormat === 'component') {
          return `import React from 'react';

const ${PascalCaseName}Icon = ({ size = 24, color = "currentColor", ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    ${icon.svgContent.replace(/<svg[^>]*>|<\/svg>/g, '').trim()}
  </svg>
);

export default ${PascalCaseName}Icon;`;
        } else {
          return `<svg
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>
  ${icon.svgContent.replace(/<svg[^>]*>|<\/svg>/g, '').trim()}
</svg>`;
        }
        
      case 'vue':
        if (selectedFormat === 'component') {
          return `<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    v-bind="$attrs"
  >
    ${icon.svgContent.replace(/<svg[^>]*>|<\/svg>/g, '').trim()}
  </svg>
</template>

<script>
export default {
  name: '${PascalCaseName}Icon',
  props: {
    size: {
      type: [Number, String],
      default: 24
    }
  }
}
</script>`;
        } else {
          return icon.svgContent;
        }
        
      case 'html':
        return icon.svgContent;
        
      case 'css':
        const encodedSvg = encodeURIComponent(icon.svgContent);
        return `.icon-${icon.name.toLowerCase().replace(/[^a-z0-9]/g, '-')} {
  background-image: url("data:image/svg+xml,${encodedSvg}");
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  width: 24px;
  height: 24px;
  display: inline-block;
}`;
        
      default:
        return icon.svgContent || '';
    }
  };

  const handleCopy = async () => {
    const code = generateCode();
    await copyToClipboard(code, {
      iconId: icon.id,
      iconName: icon.name,
      codeType: selectedFramework,
      format: selectedFormat
    });
  };

  const handleDownload = () => {
    const code = generateCode();
    let extension = 'svg';
    
    switch (selectedFramework) {
      case 'react':
        extension = 'jsx';
        break;
      case 'vue':
        extension = 'vue';
        break;
      case 'css':
        extension = 'css';
        break;
      case 'html':
        extension = 'html';
        break;
      default:
        extension = 'svg';
    }
    
    const filename = `${icon.name.replace(/[^a-zA-Z0-9]/g, '-')}.${extension}`;
    
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formats = [
    { id: 'svg', label: 'SVG Code', frameworks: ['html', 'css'] },
    { id: 'component', label: 'Component', frameworks: ['react', 'vue'] }
  ];

  const frameworks = [
    { id: 'react', label: 'React', description: 'JSX component' },
    { id: 'vue', label: 'Vue', description: 'Vue component' },
    { id: 'html', label: 'HTML', description: 'Raw SVG' },
    { id: 'css', label: 'CSS', description: 'Background image' }
  ];

  const availableFormats = formats.filter(format => 
    format.frameworks.includes(selectedFramework)
  );

  return (
    <div className={`p-6 max-w-2xl w-full ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <div 
            dangerouslySetInnerHTML={{ __html: icon.svgContent }}
            className="w-6 h-6"
          />
        </div>
        <div>
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {icon.name}
          </h3>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Generate code for your project
          </p>
        </div>
      </div>

      {/* Framework Selection */}
      <div className="mb-4">
        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          Framework
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {frameworks.map(framework => (
            <button
              key={framework.id}
              onClick={() => {
                setSelectedFramework(framework.id);
                // Reset format if not compatible
                const compatibleFormats = formats.filter(f => f.frameworks.includes(framework.id));
                if (!compatibleFormats.find(f => f.id === selectedFormat)) {
                  setSelectedFormat(compatibleFormats[0]?.id || 'svg');
                }
              }}
              className={`p-3 text-left rounded-lg border transition-colors ${
                selectedFramework === framework.id
                  ? isDark
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                    : 'border-blue-500 bg-blue-50 text-blue-600'
                  : isDark
                    ? 'border-gray-600 hover:border-gray-500 text-gray-300'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <div className="font-medium">{framework.label}</div>
              <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {framework.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Format Selection */}
      {availableFormats.length > 1 && (
        <div className="mb-4">
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Format
          </label>
          <div className="flex gap-2">
            {availableFormats.map(format => (
              <button
                key={format.id}
                onClick={() => setSelectedFormat(format.id)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedFormat === format.id
                    ? isDark
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-600 text-white'
                    : isDark
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {format.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Code Preview */}
      <div className="mb-4">
        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          Generated Code
        </label>
        <div className={`relative rounded-lg border ${isDark ? 'border-gray-600 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
          <pre className={`p-4 text-sm overflow-x-auto ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
            <code>{generateCode()}</code>
          </pre>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button
          onClick={handleCopy}
          className={`flex items-center gap-2 ${
            copied ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
          } text-white`}
          disabled={copied}
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied!' : 'Copy Code'}
        </Button>
        
        <Button
          onClick={handleDownload}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Download
        </Button>

        {error && (
          <div className="flex items-center gap-2 text-red-500">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default IconCodeGenerator;