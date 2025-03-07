'use client';

import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { useApi } from '../../../../lib/api-context';
import flyApi from '../../../../lib/api-client';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { TimeAgo } from "@/components/ui/time-ago";
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import toast from 'react-hot-toast';
import { CopyableCode } from '@/components/ui/copyable-code';
import { Trash2 } from 'lucide-react';

export default function AppDetailsPage() {
  const params = useParams();
  const appName = params.appName as string;
  const { isAuthenticated } = useApi();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const { data: app, isLoading, error } = useQuery(
    ['app', appName],
    () => flyApi.getApp(appName),
    {
      enabled: isAuthenticated && !!appName,
      refetchOnWindowFocus: false,
    }
  );

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

  // Add a function to get appropriate color for the status
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

  const openDeleteConfirm = () => {
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
      <div className="p-8 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">App Not Found</h1>
        <p className="text-red-600 dark:text-red-400 mb-4">
          Could not retrieve details for app "{appName}".
        </p>
        <Link
          href="/dashboard/apps"
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          Back to Apps
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{app.name}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            App details and resources
          </p>
        </div>
        <div className="flex space-x-3">
          <Link
            href={`/dashboard/apps/${appName}/machines`}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            View Machines
          </Link>
          <button
            onClick={openDeleteConfirm}
            disabled={isDeleting}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isDeleting ? 'Deleting...' : 'Delete App'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Status</h2>
          <div className="flex items-center">
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(app.status || 'unknown')} mr-2`}>
              {app.status || 'unknown'}
            </span>
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

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmDeleteOpen}
        onClose={closeDeleteConfirm}
        onConfirm={handleDeleteApp}
        title={`Delete ${appName}?`}
        description="This action cannot be undone. This will permanently delete this app and all associated resources."
        confirmText="Delete"
        destructive={true}
      />
    </div>
  );
} 