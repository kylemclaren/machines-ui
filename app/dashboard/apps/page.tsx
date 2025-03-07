'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { useApi } from '../../../lib/api-context';
import flyApi from '../../../lib/api-client';
import Link from 'next/link';
import { App } from '../../../types/api';
import { TimeAgo } from "@/components/ui/time-ago";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export default function AppsPage() {
  const { orgSlug, isAuthenticated } = useApi();
  const [searchTerm, setSearchTerm] = useState('');
  const [appStatuses, setAppStatuses] = useState<Record<string, string>>({});
  const [loadingStatuses, setLoadingStatuses] = useState<Record<string, boolean>>({});
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Fetch the list of apps
  const { data: apps, isLoading } = useQuery(
    ['apps', orgSlug],
    () => flyApi.listApps(orgSlug),
    {
      enabled: isAuthenticated,
    }
  );
  
  // Load statuses asynchronously for each app
  useEffect(() => {
    if (!apps || apps.length === 0) return;
    
    // Initialize loading state for all apps
    const initialLoadingState: Record<string, boolean> = {};
    apps.forEach(app => {
      initialLoadingState[app.name] = true;
    });
    setLoadingStatuses(initialLoadingState);
    
    // Fetch status for each app individually
    apps.forEach(async (app) => {
      try {
        const appDetails = await flyApi.getApp(app.name);
        if (appDetails) {
          setAppStatuses(prev => ({
            ...prev,
            [app.name]: appDetails.status || 'unknown'
          }));
        }
      } catch (error) {
        console.error(`Error fetching status for app ${app.name}:`, error);
      } finally {
        setLoadingStatuses(prev => ({
          ...prev,
          [app.name]: false
        }));
      }
    });
  }, [apps]);

  // Filter apps based on search term
  const filteredApps = apps?.filter((app) =>
    app.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const totalItems = filteredApps?.length || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Calculate the current page items
  const currentItems = filteredApps?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always show first page
      pageNumbers.push(1);
      
      if (currentPage > 3) {
        pageNumbers.push(null); // Add ellipsis
      }
      
      // Show pages around current page
      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
      
      if (currentPage < totalPages - 2) {
        pageNumbers.push(null); // Add ellipsis
      }
      
      // Always show last page
      if (totalPages > 1) {
        pageNumbers.push(totalPages);
      }
    }
    
    return pageNumbers;
  };

  const handleCreateApp = () => {
    // To be implemented: Modal for creating a new app
    console.log('Create app clicked');
  };

  // Get appropriate color for the status
  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      deployed: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100',
      running: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100',
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100',
      failed: 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100',
      suspended: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    };
    return statusColors[status.toLowerCase()] || 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Applications</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your Fly.io applications
          </p>
        </div>
        <button
          onClick={handleCreateApp}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Create App
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-400 dark:text-gray-500"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:text-white"
                  placeholder="Search apps"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Organization
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Status
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex justify-center items-center space-x-2">
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading applications...</span>
                    </div>
                  </td>
                </tr>
              ) : currentItems && currentItems.length > 0 ? (
                currentItems.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/dashboard/apps/${app.name}`}
                        className="block"
                      >
                        <div className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400">
                          {app.name}
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">{app.organization?.slug || 'unknown'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {loadingStatuses[app.name] ? (
                        <div className="flex items-center">
                          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">Loading status...</span>
                        </div>
                      ) : (
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(appStatuses[app.name] || 'unknown')}`}>
                          {appStatuses[app.name] || 'unknown'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/dashboard/apps/${app.name}/machines`}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                      >
                        Machines
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    {searchTerm ? 'No matching applications found.' : 'No applications found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 1) setCurrentPage(currentPage - 1);
                    }}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                
                {getPageNumbers().map((pageNumber, index) => (
                  <PaginationItem key={`page-${index}`}>
                    {pageNumber === null ? (
                      <PaginationEllipsis />
                    ) : (
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(pageNumber as number);
                        }}
                        isActive={pageNumber === currentPage}
                        className="cursor-pointer"
                      >
                        {pageNumber}
                      </PaginationLink>
                    )}
                  </PaginationItem>
                ))}
                
                <PaginationItem>
                  <PaginationNext 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                    }}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
            
            <div className="mt-2 text-sm text-center text-gray-500 dark:text-gray-400">
              Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} applications
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 