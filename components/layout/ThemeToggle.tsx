'use client';

import React from 'react';
import { useTheme } from '../../lib/theme-context';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  
  return (
    <button
      onClick={toggleTheme}
      className="flex items-center justify-between w-full px-4 py-3 text-sm text-left transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
      aria-label="Toggle dark mode"
    >
      <div className="flex items-center">
        {isDark ? (
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 20 20" 
            fill="currentColor" 
            className="w-5 h-5 mr-3 text-blue-400"
          >
            <path fillRule="evenodd" d="M7.455 2.004a.75.75 0 01.26.77 7 7 0 009.958 7.967.75.75 0 011.067.853A8.5 8.5 0 116.647 1.921a.75.75 0 01.808.083z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 20 20" 
            fill="currentColor" 
            className="w-5 h-5 mr-3 text-amber-500"
          >
            <path d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zM10 15a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zM10 7a3 3 0 100 6 3 3 0 000-6zM15.657 5.404a.75.75 0 10-1.06-1.06l-1.061 1.06a.75.75 0 001.06 1.06l1.06-1.06zM6.464 14.596a.75.75 0 10-1.06-1.06l-1.06 1.06a.75.75 0 001.06 1.06l1.06-1.06zM18 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 0118 10zM5 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 015 10zM14.596 15.657a.75.75 0 001.06-1.06l-1.06-1.061a.75.75 0 10-1.06 1.06l1.06 1.06zM5.404 6.464a.75.75 0 001.06-1.06l-1.06-1.06a.75.75 0 10-1.061 1.06l1.06 1.06z" />
          </svg>
        )}
        <span className="font-medium text-gray-700 dark:text-gray-200">
          {isDark ? 'Dark Mode' : 'Light Mode'}
        </span>
      </div>
      
      <div className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none bg-gray-200 dark:bg-gray-700">
        <span className="sr-only">Toggle theme</span>
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition-transform ${
            isDark ? 'translate-x-5' : 'translate-x-1'
          }`}
        />
      </div>
    </button>
  );
} 