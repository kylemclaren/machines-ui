'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { useApi } from '../../../../../lib/api-context';
import flyApi from '../../../../../lib/api-client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Machine } from '../../../../../types/api';
import { TimeAgo } from "@/components/ui/time-ago";
import toast from 'react-hot-toast';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { getRegionFlag, formatMemory, capitalizeMachineState } from '@/lib/utils';
import { Play, Square, RotateCw, ExternalLink } from 'lucide-react';

export default function AppMachinesPage() {
  const params = useParams();
  const appName = params.appName as string;
  const { isAuthenticated } = useApi();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState<string | null>(null);
  const queryClient = useQueryClient();
  
  // Confirmation dialog state
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'action' | 'create', action?: 'start' | 'stop' | 'restart', machineId?: string } | null>(null);

  // Get app details
  const { data: app, isLoading: isLoadingApp } = useQuery(
    ['app', appName],
    () => flyApi.getApp(appName),
    {
      enabled: isAuthenticated && !!appName,
    }
  );

  // Get machines for this app
  const { data: machines, isLoading: isLoadingMachines } = useQuery(
    ['machines', appName, filterState],
    () => flyApi.listMachines(appName, { state: filterState || undefined }),
    {
      enabled: isAuthenticated && !!appName,
    }
  );

  const filteredMachines = machines?.filter((machine) =>
    machine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    machine.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    machine.region.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Machine states for filtering
  const machineStates = ['started', 'stopped', 'created', 'suspended'];

  const openConfirmation = (type: 'action' | 'create', action?: 'start' | 'stop' | 'restart', machineId?: string) => {
    setConfirmAction({ type, action, machineId });
    setConfirmationOpen(true);
  };

  const closeConfirmation = () => {
    setConfirmationOpen(false);
  };

  const getConfirmationMessage = () => {
    if (!confirmAction) return { title: '', description: '' };
    
    if (confirmAction.type === 'create') {
      return {
        title: 'Create New Machine?',
        description: 'This will create a new machine with default settings. You can adjust the settings later.'
      };
    } else if (confirmAction.action && confirmAction.machineId) {
      return {
        title: `${confirmAction.action.charAt(0).toUpperCase() + confirmAction.action.slice(1)} Machine?`,
        description: `Are you sure you want to ${confirmAction.action} this machine?`
      };
    }
    
    return { title: '', description: '' };
  };

  const handleMachineAction = async (machineId: string, action: 'start' | 'stop' | 'restart') => {
    const toastId = toast.loading(`${action.charAt(0).toUpperCase() + action.slice(1)}ing machine...`);

    try {
      let success = false;

      switch (action) {
        case 'start':
          success = await flyApi.startMachine(appName, machineId);
          break;
        case 'stop':
          success = await flyApi.stopMachine(appName, machineId);
          break;
        case 'restart':
          success = await flyApi.restartMachine(appName, machineId);
          break;
      }

      if (success) {
        toast.success(`Machine ${action}ed successfully`, { id: toastId });
        // Refetch machines to update the list
        await queryClient.invalidateQueries(['machines', appName]);
      } else {
        toast.error(`Failed to ${action} machine`, { id: toastId });
      }
    } catch (error) {
      console.error(`Error ${action}ing machine:`, error);
      toast.error(`Error ${action}ing machine. Please try again later.`, { id: toastId });
    }
  };

  const handleCreateMachine = async () => {
    toast.loading('Creating a new machine...', { id: 'creating-machine' });
    
    try {
      // Here we would normally have a form or modal for configuration
      // For now, we'll just create a simple machine with default settings
      const defaultConfig = {
        name: `${appName}-${Date.now()}`,
        region: 'sjc',
        config: {
          env: {
            APP_ENV: 'production',
          },
          init: {
            exec: ["/bin/bash"],
            tty: true
          },
          image: 'flyio/ubuntu:22.04',
          services: [],
          guest: {
            cpu_kind: 'shared',
            cpus: 1,
            memory_mb: 256
          },
          restart: {
            policy: 'always'
          }
        }
      };
      
      const newMachine = await flyApi.createMachine(appName, defaultConfig);
      
      if (newMachine) {
        toast.success('Machine created successfully!', { id: 'creating-machine' });
        // Refetch machines to update the list
        await queryClient.invalidateQueries(['machines', appName]);
      } else {
        toast.error('Failed to create machine', { id: 'creating-machine' });
      }
    } catch (error) {
      console.error('Error creating machine:', error);
      toast.error('Error creating machine. Please try again later.', { id: 'creating-machine' });
    }
  };

  const handleConfirmAction = () => {
    closeConfirmation();
    if (confirmAction) {
      if (confirmAction.type === 'create') {
        handleCreateMachine();
      } else if (confirmAction.action && confirmAction.machineId) {
        handleMachineAction(confirmAction.machineId, confirmAction.action);
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Machines for {app?.name || appName}
            </h1>
            {isLoadingApp && (
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage virtual machines for this application
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => openConfirmation('create')}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Create Machine
          </button>
          <Link
            href={`/dashboard/apps/${appName}`}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to App Details
          </Link>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmationOpen}
        onClose={closeConfirmation}
        onConfirm={handleConfirmAction}
        title={getConfirmationMessage().title}
        description={getConfirmationMessage().description}
        confirmText={confirmAction?.type === 'create' ? 'Create' : 'Confirm'}
        destructive={false}
      />

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="sm:w-1/3">
              <label htmlFor="state-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Filter by State
              </label>
              <select
                id="state-filter"
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:text-white"
                value={filterState || ''}
                onChange={(e) => setFilterState(e.target.value || null)}
              >
                <option value="">All states</option>
                {machineStates.map((state) => (
                  <option key={state} value={state}>
                    {state.charAt(0).toUpperCase() + state.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:w-2/3">
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
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
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
                  Resources
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
                  <MachineRow 
                    key={machine.id} 
                    machine={machine} 
                    appName={appName} 
                    onAction={openConfirmation}
                  />
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
    </div>
  );
}

interface MachineRowProps {
  machine: Machine;
  appName: string;
  onAction: (type: 'action' | 'create', action?: 'start' | 'stop' | 'restart', machineId?: string) => void;
}

function MachineRow({ machine, appName, onAction }: MachineRowProps) {
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
        <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">{machine.id}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <span className="text-xl mr-2" title={machine.region || 'Unknown region'}>
            {getRegionFlag(machine.region)}
          </span>
          <div className="text-sm text-gray-500 dark:text-gray-400">{machine.region}</div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${stateColors[machine.state] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
          {capitalizeMachineState(machine.state)}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {machine.config.guest.cpus} CPUs / {formatMemory(machine.config.guest.memory_mb)}
        </div>
        <div className="text-xs text-gray-400 dark:text-gray-500">
          {machine.config.guest.cpu_kind}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        <TimeAgo date={machine.created_at} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex justify-end space-x-3">
          {machine.state !== 'started' && (
            <button
              onClick={() => onAction('action', 'start', machine.id)}
              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
              title="Start Machine"
            >
              <Play size={18} />
              <span className="sr-only">Start</span>
            </button>
          )}
          {machine.state === 'started' && (
            <button
              onClick={() => onAction('action', 'stop', machine.id)}
              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
              title="Stop Machine"
            >
              <Square size={18} />
              <span className="sr-only">Stop</span>
            </button>
          )}
          <button
            onClick={() => onAction('action', 'restart', machine.id)}
            className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300"
            title="Restart Machine"
          >
            <RotateCw size={18} />
            <span className="sr-only">Restart</span>
          </button>
          <Link
            href={`/dashboard/apps/${appName}/machines/${machine.id}`}
            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
            title="View Machine Details"
          >
            <ExternalLink size={18} />
            <span className="sr-only">View</span>
          </Link>
        </div>
      </td>
    </tr>
  );
} 