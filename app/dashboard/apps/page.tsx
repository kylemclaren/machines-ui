'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { useRouter } from 'next/navigation';
import { useApi } from '../../../lib/api-context';
import flyApi from '../../../lib/api-client';
import Link from 'next/link';
import { App } from '../../../types/api';
import { TimeAgo } from "@/components/ui/time-ago";
import toast from 'react-hot-toast';
import { AppCreateForm, AppFormValues } from '@/components/ui/app-create-form';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export default function AppsPage() {
  const router = useRouter();
  const { orgSlug, isAuthenticated } = useApi();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [appStatuses, setAppStatuses] = useState<Record<string, string>>({});
  const [loadingStatuses, setLoadingStatuses] = useState<Record<string, boolean>>({});
  const [createAppOpen, setCreateAppOpen] = useState(false);
  const [isCreatingApp, setIsCreatingApp] = useState(false);
  const queryClient = useQueryClient();
  
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

  // Reset to page 1 when search term or status filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // Get unique available statuses for filter options
  const getAvailableStatuses = () => {
    const statuses = new Set(Object.values(appStatuses));
    return Array.from(statuses).sort();
  };

  // Filter apps based on search term and status
  const filteredApps = apps?.filter((app) => {
    const nameMatch = app.name.toLowerCase().includes(searchTerm.toLowerCase());
    const status = appStatuses[app.name] || 'unknown';
    const statusMatch = statusFilter === 'all' || status.toLowerCase() === statusFilter.toLowerCase();
    return nameMatch && statusMatch;
  }).sort((a, b) => a.name.localeCompare(b.name));

  // Pagination logic
  const totalItems = filteredApps?.length || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
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
    setCreateAppOpen(true);
  };

  const handleSubmitApp = async (values: AppFormValues) => {
    setIsCreatingApp(true);
    const toastId = toast.loading('Creating a new app...');

    try {
      // Prepare app creation data
      const createAppData = {
        app_name: values.app_name,
        org_slug: values.org_slug
      };
      
      // Add optional fields if provided
      if (values.network) {
        // @ts-ignore - The API client expects CreateAppRequest type but doesn't have network field
        createAppData.network = values.network;
      }
      
      if (values.enable_subdomains) {
        // @ts-ignore - Same reason
        createAppData.enable_subdomains = values.enable_subdomains;
      }

      // Call API to create app
      const newApp = await flyApi.createApp(createAppData);
      
      if (newApp) {
        toast.success(`App "${values.app_name}" created successfully!`, { id: toastId });
        setCreateAppOpen(false);
        
        // Refresh the apps list
        await queryClient.invalidateQueries(['apps', orgSlug]);
        
        // Redirect to the new app's details page
        router.push(`/dashboard/apps/${values.app_name}`);
      } else {
        toast.error('Failed to create app. Please try again.', { id: toastId });
      }
    } catch (error) {
      console.error('Error creating app:', error);
      toast.error('An error occurred while creating the app. Please try again.', { id: toastId });
    } finally {
      setIsCreatingApp(false);
    }
  };

  // Get appropriate color for the status
  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      deployed: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100',
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100',
      failed: 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100',
      suspended: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    };
    return statusColors[status.toLowerCase()] || 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100';
  };

  // Get appropriate variant for the status badge
  const getStatusVariant = (status: string): "default" | "destructive" | "outline" | "secondary" | null => {
    const statusVariants: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
      deployed: 'default', // Green
      pending: 'outline', // Yellow
      failed: 'destructive', // Red
      suspended: 'secondary', // Gray
    };
    return statusVariants[status.toLowerCase()] || 'secondary';
  };
  
  // Get custom class for status badge
  const getStatusClass = (status: string): string => {
    const statusClasses: Record<string, string> = {
      deployed: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 border-green-200 dark:border-green-700',
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100 border-yellow-200 dark:border-yellow-700',
      failed: 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100 border-red-200 dark:border-red-700',
      suspended: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600',
    };
    return statusClasses[status.toLowerCase()] || 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100 border-blue-200 dark:border-blue-700';
  };

  return (
    <div>
      {/* App creation form */}
      <AppCreateForm
        open={createAppOpen}
        onOpenChange={setCreateAppOpen}
        onSubmit={handleSubmitApp}
        isLoading={isCreatingApp}
        organizations={[{ slug: orgSlug, name: orgSlug }]}
      />

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Apps</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your Fly.io Apps
          </p>
        </div>
        <button
          onClick={handleCreateApp}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer"
        >
          Create App
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="flex-1">
              <div className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                Search
              </div>
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
                  className="block w-full pl-10 pr-3 py-2 h-10 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:text-white"
                  placeholder="Search apps"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="md:w-64">
              <div className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                Filter by Status
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white h-10">
                    {statusFilter === 'all' ? 'All Statuses' : (
                      <div className="flex items-center">
                        <span className={`w-2 h-2 rounded-full mr-2 ${getStatusClass(statusFilter)}`}></span>
                        {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                      </div>
                    )}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="ml-2 h-4 w-4"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuLabel>App Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup value={statusFilter} onValueChange={setStatusFilter}>
                    <DropdownMenuRadioItem value="all">
                      All Statuses
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="deployed">
                      <div className="flex items-center">
                        <span className="w-2 h-2 rounded-full mr-2 bg-green-500"></span>
                        Deployed
                      </div>
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="pending">
                      <div className="flex items-center">
                        <span className="w-2 h-2 rounded-full mr-2 bg-yellow-500"></span>
                        Pending
                      </div>
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="failed">
                      <div className="flex items-center">
                        <span className="w-2 h-2 rounded-full mr-2 bg-red-500"></span>
                        Failed
                      </div>
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="suspended">
                      <div className="flex items-center">
                        <span className="w-2 h-2 rounded-full mr-2 bg-gray-500"></span>
                        Suspended
                      </div>
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="unknown">
                      <div className="flex items-center">
                        <span className="w-2 h-2 rounded-full mr-2 bg-gray-500"></span>
                        Unknown
                      </div>
                    </DropdownMenuRadioItem>
                    {getAvailableStatuses().map(status => (
                      !['deployed', 'pending', 'failed', 'suspended', 'unknown'].includes(status.toLowerCase()) && (
                        <DropdownMenuRadioItem key={status} value={status.toLowerCase()}>
                          <div className="flex items-center">
                            <span className="w-2 h-2 rounded-full mr-2 bg-blue-500"></span>
                            {status}
                          </div>
                        </DropdownMenuRadioItem>
                      )
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
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
                        <Badge className={`rounded-full ${getStatusClass(appStatuses[app.name] || 'unknown')}`}>
                          {appStatuses[app.name] || 'unknown'}
                        </Badge>
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