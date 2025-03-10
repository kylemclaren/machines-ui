'use client';

import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { useApi } from '../../../../../../lib/api-context';
import flyApi from '../../../../../../lib/api-client';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  Volume as BaseVolume,
  // Include other imports...
} from '../../../../../../types/api';
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
import { ArrowLeft, Check, Code, FileHeart, X } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import { getRegionFlag } from '@/lib/utils';
import { Badge } from "@/components/ui/badge";

// Helper function to format storage sizes
const formatStorageSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const units = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  // If we're close to the next unit up, round up to avoid showing 1023.9 MB
  if (bytes / Math.pow(1024, i) > 1000 && i < units.length - 1) {
    return `1 ${units[i+1]}`;
  }
  
  return `${(bytes / Math.pow(1024, i)).toFixed(2).replace(/\.00$/, '')} ${units[i]}`;
};

// Extended Volume interface with additional properties from API schema, excluding legacy fields
interface ExtendedVolume extends BaseVolume {
  auto_backup_enabled?: boolean;
  block_size?: number;
  blocks?: number;
  blocks_avail?: number;
  blocks_free?: number;
  fstype?: string;
  host_status?: 'ok' | 'unknown' | 'unreachable';
  state?: string;
}

export default function VolumeDetailsPage() {
  const params = useParams();
  const appName = params?.appName as string;
  const volumeId = params?.volumeId as string;
  const { isAuthenticated } = useApi();
  const router = useRouter();
  
  // State to toggle between human-readable and raw block display
  const [showBlocks, setShowBlocks] = useState(false);

  // Get volume details
  const { data: volume, isLoading: isVolumeLoading, error } = useQuery(
    ['volume', appName, volumeId],
    () => flyApi.getVolume(appName, volumeId),
    {
      enabled: isAuthenticated && !!appName && !!volumeId,
      refetchOnWindowFocus: false,
    }
  ) as { data: ExtendedVolume | null, isLoading: boolean, error: any };

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
      <div className="relative flex flex-col items-center justify-center min-h-[500px] p-8 md:p-12 bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {/* Background decoration - subtle and non-distracting */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-[300px] h-[300px] rounded-full bg-red-100/50 dark:bg-red-900/10 blur-3xl -top-20 -right-20 opacity-70"></div>
          <div className="absolute w-[250px] h-[250px] rounded-full bg-gray-100/70 dark:bg-gray-700/20 blur-3xl -bottom-20 -left-20 opacity-70"></div>
        </div>
        
        <div className="relative z-10 flex flex-col items-center text-center max-w-md mx-auto">
          
          {/* Main heading */}
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white mb-3">
            Volume Not Found
          </h1>
          
          {/* Detailed message */}
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            We couldn't find a volume with ID <span className="font-mono text-sm bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{volumeId}</span>
          </p>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            The volume may have been deleted or you might have followed an outdated link.
          </p>
          
          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
            <Link
              href={`/dashboard/apps/${appName}/volumes`}
              className="flex-1 inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <span>View All Volumes</span>
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
              Looking for something else? <Link href={`/dashboard/apps/${appName}`} className="text-blue-600 dark:text-blue-400 hover:underline">Go to App Dashboard</Link>
            </p>
          </div>
        </div>
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
      
      <main className="flex-1 overflow-auto p-4 md:p-6">
        {/* Back to Volumes button at the top of the page */}
        <div className="mb-6">
          <Link
            href={`/dashboard/apps/${appName}/volumes`}
            className="inline-flex px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 items-center"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Volumes
          </Link>
        </div>

        {/* Content section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                {volume.name}
                <Badge 
                  className={`ml-3 rounded-full ${isAttached ? 
                    'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 border-green-200 dark:border-green-700' : 
                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100 border-yellow-200 dark:border-yellow-700'}`}
                >
                  {isAttached ? 'Attached' : 'Detached'}
                </Badge>
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Volume details and configuration
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            <div className="p-6 bg-white dark:bg-gray-800">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Basic Information
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Volume ID</p>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white font-mono">
                    <CopyableCode value={volume.id}>{volume.id}</CopyableCode>
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</p>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    <CopyableCode value={volume.name}>{volume.name}</CopyableCode>
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Size</p>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{volume.size_gb} GB</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">State</p>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    <Badge className={`rounded-full ${volume.state === 'available' ? 
                      'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 border-green-200 dark:border-green-700' : 
                      'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100 border-blue-200 dark:border-blue-700'}`}
                    >
                      {volume.state || 'Unknown'}
                    </Badge>
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</p>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    <TimeAgo date={volume.created_at} />
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white dark:bg-gray-800">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Location & Status
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Region</p>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white flex items-center">
                    <span className="mr-2 text-lg" title={volume.region || 'Unknown region'}>
                      {getRegionFlag(volume.region)}
                    </span>
                    {volume.region || 'Unknown'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Zone</p>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white flex items-center">
                    {volume.zone || 'Unknown'}
                    {volume.host_status && (
                      <Badge className={`ml-2 rounded-full 
                        ${volume.host_status === 'ok' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 border-green-200 dark:border-green-700' 
                          : volume.host_status === 'unknown'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100 border-yellow-200 dark:border-yellow-700'
                            : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100 border-red-200 dark:border-red-700'
                        }`}
                      >
                        {volume.host_status}
                      </Badge>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Encryption</p>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white flex items-center">
                    {volume.encrypted ? (
                      <>
                        <Check size={16} className="mr-1.5 text-green-600 dark:text-green-500" />
                        Enabled
                      </>
                    ) : (
                      <>
                        <X size={16} className="mr-1.5 text-red-600 dark:text-red-500" />
                        Disabled
                      </>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Auto Backup</p>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white flex items-center">
                    {volume.auto_backup_enabled === true ? (
                      <>
                        <Check size={16} className="mr-1.5 text-green-600 dark:text-green-500" />
                        Enabled
                      </>
                    ) : (
                      <>
                        <X size={16} className="mr-1.5 text-red-600 dark:text-red-500" />
                        Disabled
                      </>
                    )}
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

          {/* Add new Storage Details section with human-readable values */}
          {(volume.block_size !== undefined || volume.blocks !== undefined || volume.blocks_free !== undefined) && (
            <div className="mx-6 mb-6 p-6 bg-white dark:bg-gray-800">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Storage Details
                </h2>
                <Badge
                  className="text-sm px-4 py-1.5 cursor-pointer bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border-transparent"
                  onClick={() => setShowBlocks(!showBlocks)}
                  title={showBlocks ? "Show human-readable format" : "Show technical block details"}
                >
                  {showBlocks ? (
                    <>
                      <FileHeart size={16} />
                      Friendly Format
                    </>
                  ) : (
                    <>
                      <Code size={16} />
                      Show Blocks
                    </>
                  )}
                </Badge>
              </div>
              
              <div className="space-y-4">
                {/* Human-readable view */}
                {!showBlocks ? (
                  <>
                    {/* Calculate total storage size from blocks and block_size */}
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Storage</p>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {volume.blocks !== undefined && volume.block_size !== undefined 
                          ? formatStorageSize(volume.blocks * volume.block_size)
                          : `${volume.size_gb} GB`
                        }
                      </p>
                    </div>

                    {/* Calculate used storage */}
                    {volume.blocks !== undefined && volume.blocks_free !== undefined && volume.block_size !== undefined && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Used Storage</p>
                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                          {formatStorageSize((volume.blocks - volume.blocks_free) * volume.block_size)}
                        </p>
                      </div>
                    )}

                    {/* Calculate free storage */}
                    {volume.blocks_free !== undefined && volume.block_size !== undefined && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Free Space</p>
                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                          {formatStorageSize(volume.blocks_free * volume.block_size)}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* Technical block view */}
                    {volume.block_size !== undefined && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Block Size</p>
                        <p className="mt-1 text-sm text-gray-900 dark:text-white font-mono">
                          {volume.block_size.toLocaleString()} bytes
                        </p>
                      </div>
                    )}
                    {volume.blocks !== undefined && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Blocks</p>
                        <p className="mt-1 text-sm text-gray-900 dark:text-white font-mono">
                          {volume.blocks.toLocaleString()}
                        </p>
                      </div>
                    )}
                    {volume.blocks_avail !== undefined && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Available Blocks</p>
                        <p className="mt-1 text-sm text-gray-900 dark:text-white font-mono">
                          {volume.blocks_avail.toLocaleString()}
                        </p>
                      </div>
                    )}
                    {volume.blocks_free !== undefined && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Free Blocks</p>
                        <p className="mt-1 text-sm text-gray-900 dark:text-white font-mono">
                          {volume.blocks_free.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </>
                )}

                {/* Display disk usage with progress bar (shown in both views) */}
                {volume.blocks !== undefined && volume.blocks_free !== undefined && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Disk Usage</p>
                    <div className="mt-2 space-y-1">
                      {(() => {
                        const usagePercent = Math.max(0, Math.min(100, 100 * (1 - volume.blocks_free / volume.blocks)));
                        let colorClass = "h-2.5 [&>div]:bg-blue-600 dark:[&>div]:bg-blue-600";
                        
                        if (usagePercent >= 90) {
                          colorClass = "h-2.5 [&>div]:bg-red-600 dark:[&>div]:bg-red-600";
                        } else if (usagePercent >= 80) {
                          colorClass = "h-2.5 [&>div]:bg-yellow-600 dark:[&>div]:bg-yellow-500";
                        }
                        
                        return (
                          <Progress 
                            value={usagePercent} 
                            className={colorClass}
                          />
                        );
                      })()}
                      <p className="text-sm text-gray-900 dark:text-white">
                        {Math.round(100 * (1 - volume.blocks_free / volume.blocks))}% used
                        {showBlocks && ` (${(volume.blocks - volume.blocks_free).toLocaleString()} of ${volume.blocks.toLocaleString()} blocks)`}
                      </p>
                    </div>
                  </div>
                )}

                {/* Show file system type if available (shown in both views) */}
                {volume.fstype && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">File System Type</p>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {volume.fstype.toUpperCase()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mx-6 mb-6 p-6 bg-white dark:bg-gray-800">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Attachment Status
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</p>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  <Badge className={`rounded-full ${isAttached ? 
                    'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 border-green-200 dark:border-green-700' : 
                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100 border-yellow-200 dark:border-yellow-700'}`}
                  >
                    {isAttached ? 'Attached' : 'Detached'}
                  </Badge>
                </p>
              </div>
              
              {isAttached && (
                <>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Attached to Machine</p>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white font-mono">
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
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 