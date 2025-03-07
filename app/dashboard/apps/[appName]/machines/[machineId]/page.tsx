'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { useApi } from '../../../../../../lib/api-context';
import flyApi from '../../../../../../lib/api-client';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Machine, MachineEvent } from '../../../../../../types/api';
import { TimeAgo } from "@/components/ui/time-ago";
import toast from 'react-hot-toast';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { getRegionFlag, formatMemory, capitalizeMachineState } from '@/lib/utils';

export default function MachineDetailsPage() {
  const params = useParams();
  const appName = params.appName as string;
  const machineId = params.machineId as string;
  const { isAuthenticated } = useApi();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'start' | 'stop' | 'restart' | 'delete' | null>(null);

  // Get machine details
  const { data: machine, isLoading: isMachineLoading, error } = useQuery(
    ['machine', appName, machineId],
    () => flyApi.getMachine(appName, machineId),
    {
      enabled: isAuthenticated && !!appName && !!machineId,
      refetchOnWindowFocus: false,
    }
  );

  // Get machine events
  const { data: events = [] } = useQuery(
    ['machine-events', appName, machineId],
    () => flyApi.getMachineEvents(appName, machineId),
    {
      enabled: isAuthenticated && !!appName && !!machineId,
    }
  );

  const openConfirmation = (action: 'start' | 'stop' | 'restart' | 'delete') => {
    setConfirmAction(action);
    setConfirmationOpen(true);
  };

  const closeConfirmation = () => {
    setConfirmationOpen(false);
  };

  const getConfirmationMessage = () => {
    if (!confirmAction) return { title: '', description: '' };
    
    return {
      title: `${confirmAction.charAt(0).toUpperCase() + confirmAction.slice(1)} Machine?`,
      description: confirmAction === 'delete' 
        ? 'This action cannot be undone. This will permanently delete this machine and all associated data.'
        : `Are you sure you want to ${confirmAction} this machine?`
    };
  };

  const handleMachineAction = async (action: 'start' | 'stop' | 'restart' | 'delete') => {
    const toastId = toast.loading(`${action.charAt(0).toUpperCase() + action.slice(1)}ing machine...`);
    setIsLoading(true);

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
        case 'delete':
          success = await flyApi.deleteMachine(appName, machineId);
          if (success) {
            toast.success(`Machine deleted successfully`, { id: toastId });
            router.push(`/dashboard/apps/${appName}/machines`);
            return;
          }
          break;
      }

      if (success) {
        toast.success(`Machine ${action}ed successfully`, { id: toastId });
        // Refetch machine data to get the updated state
        queryClient.invalidateQueries(['machine', appName, machineId]);
        queryClient.invalidateQueries(['machine-events', appName, machineId]);
      } else {
        toast.error(`Failed to ${action} machine`, { id: toastId });
      }
    } catch (error) {
      console.error(`Error ${action}ing machine:`, error);
      toast.error(`Error ${action}ing machine. Please try again later.`, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  if (isMachineLoading) {
    return (
      <div className="animate-pulse p-8 bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-1/3"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-6 w-2/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
        <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (error || !machine) {
    return (
      <div className="p-8 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Machine Not Found</h1>
        <p className="text-red-600 dark:text-red-400 mb-4">
          Could not retrieve details for machine "{machineId}".
        </p>
        <Link
          href={`/dashboard/apps/${appName}/machines`}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Back to Machines
        </Link>
      </div>
    );
  }

  // Get the color for machine state
  const getStateColor = (state: string) => {
    const stateColors: Record<string, string> = {
      started: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100',
      stopped: 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100',
      created: 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100',
      suspended: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100',
    };
    return stateColors[state] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {machine.name || 'Unnamed Machine'}
            </h1>
            <span className="ml-2 text-2xl" title={machine.region || 'Unknown region'}>
              {getRegionFlag(machine.region)}
            </span>
            <span className={`ml-3 px-2 py-0.5 text-xs font-medium rounded-full ${getStateColor(machine.state)}`}>
              {capitalizeMachineState(machine.state)}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Machine details and configuration
          </p>
        </div>
        <div className="flex space-x-2">
          <Link
            href={`/dashboard/apps/${appName}/machines`}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Back to Machines
          </Link>
          <div className="flex space-x-2">
            {machine.state !== 'started' && (
              <button
                onClick={() => openConfirmation('start')}
                disabled={isLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                Start
              </button>
            )}
            {machine.state === 'started' && (
              <button
                onClick={() => openConfirmation('stop')}
                disabled={isLoading}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50"
              >
                Stop
              </button>
            )}
            <button
              onClick={() => openConfirmation('restart')}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Restart
            </button>
            <button
              onClick={() => openConfirmation('delete')}
              disabled={isLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Basic Information
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Machine ID</p>
              <p className="mt-1 text-sm text-gray-900 dark:text-white font-mono">{machine.id}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Region</p>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                <span className="mr-2">{getRegionFlag(machine.region)}</span>
                {machine.region || 'Unknown'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</p>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                <TimeAgo date={machine.created_at} />
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</p>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                <TimeAgo date={machine.updated_at} />
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Image</p>
              <p className="mt-1 text-sm text-gray-900 dark:text-white font-mono">
                {machine.config.image}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Resources
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">CPU</p>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                {machine.config.guest.cpus} CPUs ({machine.config.guest.cpu_kind})
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Memory</p>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                {formatMemory(machine.config.guest.memory_mb)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Restart Policy</p>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                {machine.config.restart?.policy || 'Unknown'}
              </p>
            </div>
            {machine.config.services && machine.config.services.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Services</p>
                <div className="mt-1 space-y-2">
                  {machine.config.services.map((service, index) => (
                    <div key={index} className="text-sm text-gray-900 dark:text-white">
                      {service.protocol.toUpperCase()}: Port {service.internal_port}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-2">Image</h3>
            <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md">
              <p className="text-sm text-gray-700 dark:text-gray-300 font-mono break-all">
                {machine.config.image}
              </p>
            </div>
          </div>
          <div>
            <h3 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-2">Restart Policy</h3>
            <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {machine.config.restart.policy}
              </p>
            </div>
          </div>
        </div>
        
        {machine.config.env && Object.keys(machine.config.env).length > 0 && (
          <div className="mt-6">
            <h3 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-2">Environment Variables</h3>
            <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md overflow-auto max-h-60">
              <pre className="text-sm text-gray-700 dark:text-gray-300 font-mono">
                {JSON.stringify(machine.config.env, null, 2)}
              </pre>
            </div>
          </div>
        )}
        
        {machine.config.services && machine.config.services.length > 0 && (
          <div className="mt-6">
            <h3 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-2">Services</h3>
            <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md overflow-auto max-h-60">
              <pre className="text-sm text-gray-700 dark:text-gray-300 font-mono">
                {JSON.stringify(machine.config.services, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Events
          <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
            ({events.length})
          </span>
        </h2>
        
        {events.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-6">No events found for this machine</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Time
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {events.map((event) => (
                  <EventRow key={event.id} event={event} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmationOpen}
        onClose={closeConfirmation}
        onConfirm={() => {
          closeConfirmation();
          if (confirmAction) {
            handleMachineAction(confirmAction);
          }
        }}
        title={getConfirmationMessage().title}
        description={getConfirmationMessage().description}
        confirmText={confirmAction === 'delete' ? 'Delete' : 'Confirm'}
        destructive={confirmAction === 'delete'}
      />
    </div>
  );
}

interface EventRowProps {
  event: MachineEvent;
}

function EventRow({ event }: EventRowProps) {
  const statusColors: Record<string, string> = {
    success: 'text-green-600 dark:text-green-400',
    failure: 'text-red-600 dark:text-red-400',
    pending: 'text-yellow-600 dark:text-yellow-400',
  };

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        <TimeAgo date={event.timestamp} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full">
          {event.type}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`text-sm font-medium ${statusColors[event.status] || 'text-gray-600 dark:text-gray-400'}`}>
          {event.status}
        </span>
      </td>
    </tr>
  );
} 