'use client';

import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { useApi } from '../../../lib/api-context';
import flyApi from '../../../lib/api-client';
import Link from 'next/link';
import { Machine } from '../../../types/api';
import { TimeAgo } from "@/components/ui/time-ago";

export default function MachinesPage() {
  const { orgSlug, isAuthenticated } = useApi();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [filterState, setFilterState] = useState<string | null>(null);

  // Get all apps
  const { data: apps, isLoading: isLoadingApps } = useQuery(
    ['apps', orgSlug],
    () => flyApi.listApps(orgSlug),
    {
      enabled: isAuthenticated,
    }
  );

  // Get machines for the selected app
  const { data: machines, isLoading: isLoadingMachines } = useQuery(
    ['machines', selectedApp, filterState],
    () => selectedApp ? flyApi.listMachines(selectedApp, { state: filterState || undefined }) : Promise.resolve([]),
    {
      enabled: isAuthenticated && !!selectedApp,
    }
  );

  const filteredMachines = machines?.filter((machine) =>
    machine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    machine.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    machine.region.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Machine states for filtering
  const machineStates = ['started', 'stopped', 'created', 'suspended'];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Machines</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your Fly.io virtual machines
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="sm:w-1/3">
              <label htmlFor="app-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Select App
              </label>
              <select
                id="app-select"
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:text-white"
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
            <div className="sm:w-1/3">
              <label htmlFor="state-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Filter by State
              </label>
              <select
                id="state-filter"
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:text-white"
                value={filterState || ''}
                onChange={(e) => setFilterState(e.target.value || null)}
                disabled={!selectedApp}
              >
                <option value="">All states</option>
                {machineStates.map((state) => (
                  <option key={state} value={state}>
                    {state.charAt(0).toUpperCase() + state.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:w-1/3">
              <label htmlFor="search-machines" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-400 dark:text-gray-500"
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
                  id="search-machines"
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:text-white"
                  placeholder="Search machines..."
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
          Please select an app to view its machines
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
                    Region
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    State
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
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {isLoadingMachines ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      <div className="flex justify-center items-center space-x-2">
                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <span>Loading machines...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredMachines && filteredMachines.length > 0 ? (
                  filteredMachines.map((machine) => (
                    <MachineRow key={machine.id} machine={machine} appName={selectedApp} />
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      {searchTerm || filterState
                        ? 'No machines found matching your filters'
                        : 'No machines found for this app'}
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

interface MachineRowProps {
  machine: Machine;
  appName: string;
}

function MachineRow({ machine, appName }: MachineRowProps) {
  const stateColors: Record<string, string> = {
    started: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100',
    stopped: 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100',
    created: 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100',
    suspended: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100',
  };

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900 dark:text-white">{machine.name || 'Unnamed'}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">{machine.id}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-500 dark:text-gray-400">{machine.region}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${stateColors[machine.state] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
          {machine.state}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        <TimeAgo date={machine.created_at} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <Link
          href={`/dashboard/apps/${appName}/machines/${machine.id}`}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
        >
          Details
        </Link>
      </td>
    </tr>
  );
} 