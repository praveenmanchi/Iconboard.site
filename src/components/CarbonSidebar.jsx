import React from 'react';
import { ScrollArea } from './ui/scroll-area';
import { ChevronRight } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const CarbonSidebar = ({ selectedCategory, onCategorySelect, categories }) => {
  const { isDark } = useTheme();
  const allIconsCount = categories.reduce((total, cat) => total + cat.count, 0);

  return (
    <div className={`w-64 border-r h-full flex flex-col ${
      isDark 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-gray-50 border-gray-200'
    }`}>
      {/* Header */}
      <div className={`p-4 border-b ${
        isDark ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <h2 className={`text-sm font-semibold mb-1 ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          Categories
        </h2>
        <p className={`text-xs ${
          isDark ? 'text-gray-400' : 'text-gray-600'
        }`}>
          {categories.length} collections
        </p>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {/* All Icons */}
          <button
            onClick={() => onCategorySelect('all')}
            className={`w-full group flex items-center justify-between px-3 py-2 text-sm transition-colors duration-200 ${
              selectedCategory === 'all'
                ? isDark
                  ? 'bg-blue-900/50 text-blue-300 border-r-2 border-blue-400'
                  : 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                : isDark
                  ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <span className="font-medium">All icons</span>
            <div className="flex items-center gap-2">
              <span className={`text-xs ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {allIconsCount}
              </span>
              <ChevronRight className={`w-3 h-3 transition-transform duration-200 ${
                selectedCategory === 'all' ? 'rotate-90' : 'group-hover:translate-x-0.5'
              }`} />
            </div>
          </button>

          {/* Categories */}
          <div className="mt-1 space-y-1">
            {categories.filter(category => category.id !== 'all').map((category) => (
              <button
                key={category.id}
                onClick={() => onCategorySelect(category.id)}
                className={`w-full group flex items-center justify-between px-3 py-2 text-sm transition-colors duration-200 ${
                  selectedCategory === category.id
                    ? isDark
                      ? 'bg-blue-900/50 text-blue-300 border-r-2 border-blue-400'
                      : 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                    : isDark
                      ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span className="capitalize">{category.name}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {category.count}
                  </span>
                  <ChevronRight className={`w-3 h-3 transition-transform duration-200 ${
                    selectedCategory === category.id ? 'rotate-90' : 'group-hover:translate-x-0.5'
                  }`} />
                </div>
              </button>
            ))}
          </div>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className={`p-4 border-t ${
  isDark ? 'border-gray-700' : 'border-gray-200'
}`}>
  <div className={`border rounded p-3 ${
    isDark 
      ? 'bg-gray-900 border-gray-600' 
      : 'bg-white border-gray-200'
  }`}>
    <div className="flex items-start gap-3">
      <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 mt-0.5 ${
        isDark ? 'bg-green-900' : 'bg-green-100'
      }`}>
        <div className={`w-2 h-2 rounded-full ${
          isDark ? 'bg-green-400' : 'bg-green-600'
        }`}></div>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className={`text-xs font-semibold ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          Open source
        </h3>
        <p className={`text-xs mt-1 leading-relaxed ${
          isDark ? 'text-gray-400' : 'text-gray-600'
        }`}>
          Please feel free to contribute to the project.
        </p>
        <a 
          href="https://github.com/praveenmanchi/Iconboard.site" 
          target="_blank" 
          rel="noopener noreferrer"
          className={`mt-2 inline-block text-xs font-medium ${
            isDark 
              ? 'text-blue-400 hover:text-blue-300' 
              : 'text-blue-600 hover:text-blue-700'
          }`}
        >
          Contribute →
        </a>
      </div>
    </div>
  </div>
</div>

    </div>
  );
};

export default CarbonSidebar;