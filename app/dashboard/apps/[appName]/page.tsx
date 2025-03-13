'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { useApi } from '../../../../lib/api-context';
import flyApi from '../../../../lib/api-client';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { TimeAgo } from "@/components/ui/time-ago";
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import toast from 'react-hot-toast';
import { CopyableCode } from '@/components/ui/copyable-code';
import { Trash2, ExternalLink } from 'lucide-react';
import axios from 'axios';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from '@/components/ui/badge';
import { WarningDialog } from '@/components/ui/warning-dialog';

export default function AppDetailsPage() {
  const { isAuthenticated } = useApi();
  const params = useParams();
  const appName = params?.appName as string;
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [warningDeleteOpen, setWarningDeleteOpen] = useState(false);
  const [isAppAccessible, setIsAppAccessible] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(false);
  const appUrl = `https://${appName}.fly.dev`;

  const { data: app, isLoading, error } = useQuery(
    ['app', appName],
    () => flyApi.getApp(appName),
    {
      enabled: isAuthenticated && !!appName,
      refetchOnWindowFocus: false,
    }
  );

  // Check if the app is publicly accessible
  useEffect(() => {
    if (app && appName) {
      setIsCheckingAccess(true);
      // Use our API proxy to avoid CORS issues
      fetch(`/api/check-site?url=${encodeURIComponent(appUrl)}`)
        .then(response => response.json())
        .then(data => {
          setIsAppAccessible(data.isAccessible);
        })
        .catch(error => {
          console.error("Error checking app accessibility:", error);
          setIsAppAccessible(false);
        })
        .finally(() => {
          setIsCheckingAccess(false);
        });
    }
  }, [app, appName, appUrl]);

  // Also fetch machines for this app to show count
  const { data: machines = [] } = useQuery(
    ['machines', appName],
    () => flyApi.listMachines(appName),
    {
      enabled: isAuthenticated && !!appName,
    }
  );

  // Also fetch volumes for this app to show count
  const { data: volumes = [] } = useQuery(
    ['volumes', appName],
    () => flyApi.listVolumes(appName),
    {
      enabled: isAuthenticated && !!appName,
    }
  );

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

  // Get custom class for status badge
  const getStatusClass = (status: string): string => {
    const statusClasses: Record<string, string> = {
      deployed: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 border-green-200 dark:border-green-700',
      running: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 border-green-200 dark:border-green-700',
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100 border-yellow-200 dark:border-yellow-700',
      failed: 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100 border-red-200 dark:border-red-700',
      suspended: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600',
    };
    return statusClasses[status.toLowerCase()] || 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100 border-blue-200 dark:border-blue-700';
  };

  const openDeleteWarning = () => {
    setWarningDeleteOpen(true);
  };

  const closeDeleteWarning = () => {
    setWarningDeleteOpen(false);
  };

  const openDeleteConfirm = () => {
    setWarningDeleteOpen(false);
    setConfirmDeleteOpen(true);
  };

  const closeDeleteConfirm = () => {
    setConfirmDeleteOpen(false);
  };

  const handleDeleteApp = async () => {
    setIsDeleting(true);
    const toastId = toast.loading(`Deleting app ${appName}...`);

    try {
      const success = await flyApi.deleteApp(appName);
      if (success) {
        toast.success(`App ${appName} deleted successfully`, { id: toastId });
        router.push('/dashboard/apps');
      } else {
        toast.error(`Failed to delete app ${appName}`, { id: toastId });
      }
    } catch (error) {
      console.error('Error deleting app:', error);
      toast.error(`Error deleting app. Please try again later.`, { id: toastId });
    } finally {
      setIsDeleting(false);
      setConfirmDeleteOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse p-8 bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-1/3"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-6 w-2/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="relative flex flex-col items-center justify-center min-h-[500px] p-8 md:p-12 bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {/* Background decoration - subtle and non-distracting */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-[300px] h-[300px] rounded-full bg-red-100/50 dark:bg-red-900/10 blur-3xl -top-20 -right-20 opacity-70"></div>
          <div className="absolute w-[250px] h-[250px] rounded-full bg-gray-100/70 dark:bg-gray-700/20 blur-3xl -bottom-20 -left-20 opacity-70"></div>
        </div>
        
        <div className="relative z-10 flex flex-col items-center text-center max-w-md mx-auto">
          
          {/* Main heading */}
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white mb-3">
            App Not Found
          </h1>
          
          {/* Detailed message */}
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            We couldn't find an app with name <span className="font-mono text-sm bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{appName}</span>
          </p>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            The app may have been deleted or you might have followed an outdated link.
          </p>
          
          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
            <Link
              href="/dashboard/apps"
              className="flex-1 inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <span>View All Apps</span>
            </Link>
            
            <button 
              onClick={() => window.history.back()}
              className="flex-1 inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
              </svg>
              <span>Go Back</span>
            </button>
          </div>
          
          {/* Helpful tip/suggestion */}
          <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-700 w-full">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Looking for something else? <Link href="/dashboard" className="text-blue-600 dark:text-blue-400 hover:underline">Go to Dashboard</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
        <div>
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{app.name}</h1>
            {isAppAccessible && (
              <TooltipProvider>
                <Tooltip delayDuration={200}>
                  <TooltipTrigger asChild>
                    <a 
                      href={appUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200"
                    >
                      <ExternalLink size={20} className="hover:scale-110 transition-transform duration-200" />
                    </a>
                  </TooltipTrigger>
                  <TooltipContent 
                    side="top" 
                    align="center" 
                    sideOffset={5} 
                    className="bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-3 py-1.5 text-xs font-medium rounded-md shadow-lg border border-gray-800 dark:border-gray-200"
                  >
                    Visit {app.name}.fly.dev
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            App details and resources
          </p>
        </div>
        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-3 mt-4 md:mt-0 w-full md:w-auto">
          <Link
            href={`/dashboard/apps/${appName}/machines`}
            className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center"
          >
            View Machines
          </Link>
          <a
            href={`https://fly-metrics.net/d/fly-app/fly-app?var-app=${app.name}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full md:w-auto px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center transition-colors"
          >
            <img 
              src="/grafana.svg" 
              alt="Grafana" 
              className="w-4 h-4 mr-2" 
            />
            Grafana Metrics
          </a>
          <button
            onClick={openDeleteWarning}
            className="flex items-center justify-center px-4 py-2 border border-red-300 dark:border-red-600 bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 cursor-pointer transition-colors"
            disabled={isDeleting}
          >
            <Trash2 size={18} className="mr-2" />
            {isDeleting ? 'Deleting...' : 'Delete App'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Status</h2>
          <div className="flex items-center">
            <Badge className={`rounded-full ${getStatusClass(app.status || 'unknown')} mr-2`}>
              {app.status || 'unknown'}
            </Badge>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Machines</h2>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{machines.length}</span>
            <Link
              href={`/dashboard/apps/${appName}/machines`}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              View all →
            </Link>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Volumes</h2>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{volumes.length}</span>
            <Link
              href={`/dashboard/apps/${appName}/volumes`}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              View all →
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">App Details</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">App ID</p>
            <p className="text-sm text-gray-900 dark:text-white font-mono flex items-center">
              <CopyableCode value={app.id || 'N/A'}>{app.id || 'N/A'}</CopyableCode>
            </p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</p>
            <p className="text-sm text-gray-900 dark:text-white font-mono flex items-center">
              <CopyableCode value={app.name}>{app.name}</CopyableCode>
            </p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Organization Slug</p>
            <p className="text-sm text-gray-900 dark:text-white font-mono flex items-center">
              <CopyableCode value={app.organization?.slug || 'unknown'}>
                {app.organization?.slug || 'unknown'}
              </CopyableCode>
            </p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</p>
            <p className="text-sm text-gray-900 dark:text-white">
              {app.status || 'unknown'}
            </p>
          </div>
        </div>
      </div>

      {/* Warning Dialog */}
      <WarningDialog
        isOpen={warningDeleteOpen}
        onClose={closeDeleteWarning}
        onConfirm={openDeleteConfirm}
        title="Delete App"
        description={`Please review the consequences of deleting ${appName}.`}
        warningPoints={[
          `This will permanently delete the app ${appName} and all associated resources.`,
          "All machines in this app will be permanently deleted.",
          "All volumes attached to these machines will be permanently deleted.",
          "This action cannot be undone."
        ]}
        confirmText="I understand"
      />

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmDeleteOpen}
        onClose={closeDeleteConfirm}
        onConfirm={handleDeleteApp}
        title={`Delete ${appName}?`}
        description="This action cannot be undone. This will permanently delete this app and all associated resources."
        confirmText="Delete"
        destructive={true}
        requireValidation={true}
        validationText={appName}
        validationLabel={`To confirm deletion, please type "${appName}"`}
      />
    </div>
  );
} 