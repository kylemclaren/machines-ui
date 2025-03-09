import React, { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApi } from '../../lib/api-context';
import ThemeToggle from './ThemeToggle';
import { ExternalLink, Menu, X, Book, Search } from 'lucide-react';
import StatusIndicator from '@/components/ui/status-indicator';
import { CommandMenu } from './CommandMenu';

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { isAuthenticated, clearToken, orgSlug } = useApi();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const navItems: NavItem[] = [
    {
      href: '/dashboard',
      label: 'Overview',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="7" height="9" x="3" y="3" rx="1" />
          <rect width="7" height="5" x="14" y="3" rx="1" />
          <rect width="7" height="9" x="14" y="12" rx="1" />
          <rect width="7" height="5" x="3" y="16" rx="1" />
        </svg>
      ),
    },
    {
      href: '/dashboard/apps',
      label: 'Apps',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      href: '/dashboard/machines',
      label: 'Machines',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="16" height="16" x="4" y="4" rx="2" />
          <rect width="6" height="6" x="9" y="9" />
          <path d="M15 2v2" />
          <path d="M15 20v2" />
          <path d="M2 15h2" />
          <path d="M20 15h2" />
        </svg>
      ),
    },
    {
      href: '/dashboard/volumes',
      label: 'Volumes',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5z" />
          <path d="M9 5v14" />
          <path d="M5 9h14" />
        </svg>
      ),
    },
  ];

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="mb-4">Please authenticate to access the dashboard.</p>
          <Link href="/auth" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-gray-800 bg-opacity-50 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-transform duration-300 ease-in-out z-30 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static lg:z-0`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
            <Link href="/dashboard" className="flex items-center">
              {/* Light mode logo (visible in light mode) */}
              <img 
                src="https://fly.io/static/images/brand/logo-landscape-dark.svg" 
                alt="Fly.io" 
                className="h-8 block dark:hidden" 
              />
              {/* Dark mode logo (visible in dark mode) */}
              <img 
                src="https://fly.io/static/images/brand/logo-landscape-light.svg" 
                alt="Fly.io" 
                className="h-8 hidden dark:block" 
              />
            </Link>
            <button 
              className="p-2 rounded-md text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden"
              onClick={toggleSidebar}
            >
              <X size={24} />
            </button>
          </div>
          
          <nav className="flex flex-col flex-1 px-2 pt-4 pb-4 overflow-y-auto">
            <div className="space-y-1">
              {navItems.map((item) => {
                const isActive = item.href === '/dashboard' 
                  ? pathname === '/dashboard'
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center px-2 py-2 text-sm rounded-md ${
                      isActive 
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' 
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                    }`}
                    onClick={() => {
                      // Close sidebar on mobile when item is clicked
                      if (window.innerWidth < 1024) {
                        setSidebarOpen(false);
                      }
                    }}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
            
            {/* Border separator between navigation and search */}
            <div className="mt-6 pt-2 border-t border-gray-200 dark:border-gray-700"></div>
            
            {/* Search button with border */}
            <div className="mt-3 px-2">
              <button
                className="flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={() => {
                  document.dispatchEvent(new KeyboardEvent('keydown', {
                    key: 'k',
                    metaKey: true
                  }));
                }}
              >
                <Search size={16} className="mr-2 text-gray-500 dark:text-gray-400" />
                <span>Search</span>
                <kbd className="ml-auto px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-gray-500 dark:text-gray-400 text-xs">⌘K</kbd>
              </button>
            </div>
            
            {/* Use the full theme toggle component */}
            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
              <ThemeToggle />
            </div>
            
            <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="px-2 py-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                Organization: {orgSlug}
              </div>
              <button
                onClick={clearToken}
                className="flex items-center w-full px-2 py-2 text-sm text-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
            
            <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
              <a 
                href="https://fly.io/docs/machines/api/working-with-machines-api/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors group"
              >
                <Book size={16} className="mr-2 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                <span className="group-hover:text-blue-600 dark:group-hover:text-blue-400">Machines API Docs</span>
              </a>
              <a 
                href="https://github.com/kylemclaren/machines-ui/issues/new"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors group"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="mr-2 w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                </svg>
                <span className="group-hover:text-blue-600 dark:group-hover:text-blue-400">Submit an Issue</span>
              </a>
            </div>
            
            {/* Status Indicator - at bottom of sidebar */}
            <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
              <StatusIndicator />
            </div>
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header with hamburger menu */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 lg:hidden">
          <div className="flex items-center justify-between h-16 px-4">
            <div className="flex items-center">
              <button 
                className="p-2 rounded-md text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                onClick={toggleSidebar}
              >
                <Menu size={24} />
              </button>
              <Link href="/dashboard" className="flex items-center ml-2">
                <img 
                  src="https://fly.io/static/images/brand/logo-landscape-dark.svg" 
                  alt="Fly.io" 
                  className="h-8 block dark:hidden" 
                />
                <img 
                  src="https://fly.io/static/images/brand/logo-landscape-light.svg" 
                  alt="Fly.io" 
                  className="h-8 hidden dark:block" 
                />
              </Link>
            </div>

            {/* Mobile header with hamburger menu */}
            <div className="flex items-center space-x-2">
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <div className="py-6 mx-auto px-4 sm:px-6 md:px-8">
            {children}
          </div>
        </main>
        
        {/* Add the CommandMenu component */}
        <CommandMenu />
      </div>
    </div>
  );
} 