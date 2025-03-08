'use client';

import { useTheme } from 'next-themes';
import { Toaster, ToasterProps } from 'react-hot-toast';
import { useEffect, useState } from 'react';

export function ThemeAwareToaster(props: ToasterProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Only render the toaster after mounting to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDarkTheme = theme === 'dark';

  const defaultStyle = {
    background: isDarkTheme ? '#1f2937' : '#fff',
    color: isDarkTheme ? '#f3f4f6' : '#333',
    border: `1px solid ${isDarkTheme ? '#374151' : '#e2e8f0'}`,
    boxShadow: isDarkTheme 
      ? '0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1)'
      : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  };

  const successStyle = {
    background: isDarkTheme ? '#064e3b' : '#f0fff4',
    color: isDarkTheme ? '#d1fae5' : '#22543d',
    border: `1px solid ${isDarkTheme ? '#047857' : '#c6f6d5'}`,
  };

  const errorStyle = {
    background: isDarkTheme ? '#7f1d1d' : '#fff5f5',
    color: isDarkTheme ? '#fecaca' : '#c53030',
    border: `1px solid ${isDarkTheme ? '#b91c1c' : '#fed7d7'}`,
  };

  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: defaultStyle,
        success: {
          style: successStyle,
          iconTheme: {
            primary: isDarkTheme ? '#10b981' : '#38a169',
            secondary: '#fff',
          },
        },
        error: {
          style: errorStyle,
          iconTheme: {
            primary: isDarkTheme ? '#ef4444' : '#e53e3e',
            secondary: '#fff',
          },
        },
      }}
      {...props}
    />
  );
} 