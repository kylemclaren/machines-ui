'use client';

import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { useApi } from '../../../lib/api-context';
import flyApi from '../../../lib/api-client';
import Link from 'next/link';
import { Volume } from '../../../types/api';
import { TimeAgo } from "@/components/ui/time-ago";

export default function VolumesPage() {
  const { orgSlug, isAuthenticated } = useApi();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApp, setSelectedApp] = useState<string | null>(null);

  // Get all apps
  const { data: apps, isLoading: isLoadingApps } = useQuery(
    ['apps', orgSlug],
    () => flyApi.listApps(orgSlug),
    {
      enabled: isAuthenticated,
    }
  );

  // Get volumes for the selected app
  const { data: volumes, isLoading: isLoadingVolumes } = useQuery(
    ['volumes', selectedApp],
    () => selectedApp ? flyApi.listVolumes(selectedApp) : Promise.resolve([]),
    {
      enabled: isAuthenticated && !!selectedApp,
    }
  );

  const filteredVolumes = volumes?.filter((volume) =>
    volume.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    volume.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    volume.region.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Volumes</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your Fly.io storage volumes
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden mb-6">
        <div className="p-4 border-b dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="sm:w-1/2">
              <label htmlFor="app-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Select App
              </label>
              <select
                id="app-select"
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={selectedApp || ''}
                onChange={(e) => setSelectedApp(e.target.value || null)}
              >
                <option value="">Select an app</option>
                {isLoadingApps ? (
                  <option disabled>Loading apps...</option>
                ) : (
                  apps?.map((app) => (
                    <option key={app.id} value={app.name}>
                      {app.name}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div className="sm:w-1/2">
              <label htmlFor="search-volumes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <input
                  id="search-volumes"
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:text-white"
                  placeholder="Search volumes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={!selectedApp}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {!selectedApp ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center text-gray-500 dark:text-gray-400">
          Please select an app to view its volumes
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Name / ID
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Region / Zone
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Size
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Created
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {isLoadingVolumes ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      Loading volumes...
                    </td>
                  </tr>
                ) : filteredVolumes && filteredVolumes.length > 0 ? (
                  filteredVolumes.map((volume) => (
                    <VolumeRow key={volume.id} volume={volume} appName={selectedApp} />
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      {searchTerm
                        ? 'No volumes found matching your search'
                        : 'No volumes found for this app'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

interface VolumeRowProps {
  volume: Volume;
  appName: string;
}

function VolumeRow({ volume, appName }: VolumeRowProps) {
  const isAttached = !!volume.attached_machine_id;

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900 dark:text-white">{volume.name}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">{volume.id}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-500 dark:text-gray-400">{volume.region}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">{volume.zone}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        {volume.size_gb} GB
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${isAttached ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'}`}>
          {isAttached ? 'Attached' : 'Detached'}
        </span>
        {isAttached && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Machine: {volume.attached_machine_id}
          </div>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        <TimeAgo date={volume.created_at} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <Link
          href={`/dashboard/apps/${appName}/volumes/${volume.id}`}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
        >
          Details
        </Link>
      </td>
    </tr>
  );
} 