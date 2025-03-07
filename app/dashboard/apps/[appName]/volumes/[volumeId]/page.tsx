'use client';

import React from 'react';
import { useQuery } from 'react-query';
import { useApi } from '../../../../../../lib/api-context';
import flyApi from '../../../../../../lib/api-client';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Volume } from '../../../../../../types/api';
import { TimeAgo } from "@/components/ui/time-ago";
import { CopyableCode } from '@/components/ui/copyable-code';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function VolumeDetailsPage() {
  const params = useParams();
  const appName = params.appName as string;
  const volumeId = params.volumeId as string;
  const { isAuthenticated } = useApi();
  const router = useRouter();

  // Get volume details
  const { data: volume, isLoading: isVolumeLoading, error } = useQuery(
    ['volume', appName, volumeId],
    () => flyApi.getVolume(appName, volumeId),
    {
      enabled: isAuthenticated && !!appName && !!volumeId,
      refetchOnWindowFocus: false,
    }
  );

  if (isVolumeLoading) {
    return (
      <div className="animate-pulse p-8 bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-1/3"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-6 w-2/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !volume) {
    return (
      <div className="p-8 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Volume Not Found</h1>
        <p className="text-red-600 dark:text-red-400 mb-4">
          Could not retrieve details for volume "{volumeId}".
        </p>
        <Link
          href={`/dashboard/apps/${appName}/volumes`}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          Back to Volumes
        </Link>
      </div>
    );
  }

  const isAttached = !!volume.attached_machine_id;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">
                Dashboard
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard/apps">
                Apps
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/dashboard/apps/${appName}`}>
                {appName}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/dashboard/apps/${appName}/volumes`}>
                Volumes
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{volume?.name || volumeId}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {volume.name}
            </h1>
            <span className={`ml-3 px-2 py-0.5 text-xs font-medium rounded-full ${isAttached ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'}`}>
              {isAttached ? 'Attached' : 'Detached'}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Volume details and configuration
          </p>
        </div>
        <div className="flex space-x-2">
          <Link
            href={`/dashboard/apps/${appName}/volumes`}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Back to Volumes
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Basic Information
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Volume ID</p>
              <p className="mt-1 text-sm text-gray-900 dark:text-white font-mono flex items-center">
                <CopyableCode value={volume.id}>{volume.id}</CopyableCode>
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</p>
              <p className="mt-1 text-sm text-gray-900 dark:text-white flex items-center">
                <CopyableCode value={volume.name}>{volume.name}</CopyableCode>
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Size</p>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">{volume.size_gb} GB</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</p>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                <TimeAgo date={volume.created_at} />
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Location & Status
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Region</p>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">{volume.region}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Zone</p>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">{volume.zone}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Encryption</p>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                {volume.encrypted ? 'Enabled' : 'Disabled'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Snapshot Retention</p>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                {volume.snapshot_retention} days
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Attachment Status
        </h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</p>
            <p className="mt-1 text-sm text-gray-900 dark:text-white">
              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${isAttached ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'}`}>
                {isAttached ? 'Attached' : 'Detached'}
              </span>
            </p>
          </div>
          
          {isAttached && (
            <>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Attached to Machine</p>
                <p className="mt-1 text-sm text-gray-900 dark:text-white font-mono flex items-center">
                  <Link 
                    href={`/dashboard/apps/${appName}/machines/${volume.attached_machine_id}`}
                    className="text-blue-600 hover:text-blue-900 flex items-center"
                  >
                    <CopyableCode value={volume.attached_machine_id || ''}>
                      {volume.attached_machine_id}
                    </CopyableCode>
                  </Link>
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Attached to App</p>
                <p className="mt-1 text-sm text-gray-900 dark:text-white flex items-center">
                  <Link 
                    href={`/dashboard/apps/${volume.attached_app_id}`}
                    className="text-blue-600 hover:text-blue-900 flex items-center"
                  >
                    <CopyableCode value={volume.attached_app_id || ''}>
                      {volume.attached_app_id}
                    </CopyableCode>
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 