'use client';

import React, { useState, useEffect } from 'react';
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
import { Play, Square, RotateCw, ExternalLink, PauseCircle, StopCircle, Trash, Server, Plus, MoreHorizontal, Pause } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { MachineCreateForm, MachineFormValues } from "@/components/ui/machine-create-form";
import { Badge } from '@/components/ui/badge';

export default function AppMachinesPage() {
  const params = useParams();
  const appName = params.appName as string;
  const { isAuthenticated } = useApi();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState<string | null>(null);
  const queryClient = useQueryClient();
  
  // Confirmation dialog state
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'action' | 'create', action?: 'start' | 'stop' | 'restart' | 'suspend', machineId?: string } | null>(null);
  
  // Machine creation form state
  const [createFormOpen, setCreateFormOpen] = useState(false);
  const [isCreatingMachine, setIsCreatingMachine] = useState(false);
  
  // Additional state to track the current image at form open time
  const [currentImageForForm, setCurrentImageForForm] = useState<string | null>(null);

  // Get app details
  const { data: app, isLoading: isLoadingApp } = useQuery(
    ['app', appName],
    () => flyApi.getApp(appName),
    {
      enabled: isAuthenticated && !!appName,
    }
  );

  // Get machines for this app
  const { data: machines, isLoading: isLoadingMachines, refetch: refetchMachines } = useQuery(
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

  // Direct function to get the latest machine's image 
  // This fetches directly from API, bypassing any cache issues
  const getLatestMachineImage = async () => {
    try {
      console.log("Fetching latest machines directly from API for image data");
      
      // Directly fetch latest machines from API
      const freshMachines = await flyApi.listMachines(appName, {});
      
      if (!freshMachines || freshMachines.length === 0) {
        console.log("No machines found from direct API call");
        return null;
      }
      
      // Sort machines by creation date (newest first)
      const sortedMachines = [...freshMachines].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      // Get the most recent machine
      const latestMachine = sortedMachines[0];
      console.log("Latest machine from API call:", latestMachine.id);
      
      // Try to get image from the config
      if (latestMachine.config && latestMachine.config.image) {
        const imageToUse = latestMachine.config.image;
        console.log("Using image from direct API call:", imageToUse);
        return imageToUse;
      }
      
      console.log("No image found in latest machine from API");
      return null;
    } catch (error) {
      console.error("Error fetching machine data for image:", error);
      return null;
    }
  };

  // Handle opening the create machine form
  const handleOpenCreateForm = async () => {
    setCreateFormOpen(true);
  };

  const openConfirmation = (type: 'action' | 'create', action?: 'start' | 'stop' | 'restart' | 'suspend', machineId?: string) => {
    // If it's a create action, open the form instead of confirmation dialog
    if (type === 'create') {
      handleOpenCreateForm();
      return;
    }
    
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

  const handleMachineAction = async (machineId: string, action: 'start' | 'stop' | 'restart' | 'suspend') => {
    const actionText = action === 'suspend' ? 'suspending' : `${action}ing`;
    const toastId = toast.loading(`${actionText.charAt(0).toUpperCase() + actionText.slice(1)} machine...`);

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
        case 'suspend':
          success = await flyApi.suspendMachine(appName, machineId);
          break;
      }

      if (success) {
        const pastTense = action === 'suspend' ? 'suspended' : `${action}${action === 'stop' ? 'p' : ''}ed`;
        toast.success(`Machine ${pastTense} successfully`, { id: toastId });
        // Refetch machines to update the list
        await queryClient.invalidateQueries(['machines', appName]);
      } else {
        toast.error(`Failed to ${action} machine`, { id: toastId });
      }
    } catch (error) {
      console.error(`Error ${actionText} machine:`, error);
      toast.error(`Error ${actionText} machine. Please try again later.`, { id: toastId });
    }
  };

  const handleCreateMachine = async (formValues: MachineFormValues) => {
    setIsCreatingMachine(true);
    toast.loading('Creating a new machine...', { id: 'creating-machine' });
    
    try {
      // Convert form values to the expected API format
      const machineConfig = {
        name: formValues.name || `${appName}-${Date.now()}`,
        region: formValues.region,
        config: {
          env: {
            APP_ENV: 'production',
          },
          init: {
            exec: ["/bin/bash"],
            tty: true
          },
          image: formValues.image,
          services: [] as any[],
          guest: {
            cpu_kind: formValues.cpuKind,
            cpus: formValues.cpus,
            memory_mb: formValues.memoryMb
          },
          restart: {
            policy: 'always'
          }
        }
      };

      // Add service configuration if autostart or autostop is enabled
      if (formValues.autostart || formValues.autostop) {
        machineConfig.config.services = [
          {
            ports: [
              {
                port: 80,
                handlers: ["http"]
              }
            ],
            protocol: "tcp",
            internal_port: 8080,
            autostart: formValues.autostart,
            autostop: formValues.autostop ? "stop" : "off"
          }
        ];
      }
      
      const newMachine = await flyApi.createMachine(appName, machineConfig);
      
      if (newMachine) {
        toast.success('Machine created successfully!', { id: 'creating-machine' });
        // Close the form
        setCreateFormOpen(false);
        // Refetch machines to update the list
        await queryClient.invalidateQueries(['machines', appName]);
      } else {
        toast.error('Failed to create machine', { id: 'creating-machine' });
      }
    } catch (error) {
      console.error('Error creating machine:', error);
      toast.error('Error creating machine. Please try again later.', { id: 'creating-machine' });
    } finally {
      setIsCreatingMachine(false);
    }
  };

  const handleConfirmAction = () => {
    closeConfirmation();
    if (confirmAction) {
      if (confirmAction.type === 'create') {
        handleOpenCreateForm();
      } else if (confirmAction.action && confirmAction.machineId) {
        handleMachineAction(confirmAction.machineId, confirmAction.action);
      }
    }
  };

  return (
    <div>
      {/* Machine creation form */}
      <MachineCreateForm
        open={createFormOpen}
        onOpenChange={setCreateFormOpen}
        onSubmit={handleCreateMachine}
        isLoading={isCreatingMachine}
        appName={appName}
        getImage={getLatestMachineImage}
      />

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
                {app?.name || appName}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Machines</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Machines for {app?.name || appName}
            </h1>
            {isLoadingApp && (
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 pb-6">
            Manage Machines for this application
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          <Link
            href={`/dashboard/apps/${appName}`}
            className="hidden md:inline-flex px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 items-center"
          >
            Back to App Details
          </Link>
          <button
            onClick={handleOpenCreateForm}
            className="w-full md:w-auto px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center cursor-pointer"
          >
            Create Machine
          </button>
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Filter by State
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                    {filterState ? filterState.charAt(0).toUpperCase() + filterState.slice(1) : "All states"}
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
                  <DropdownMenuLabel>Machine States</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup value={filterState || ""} onValueChange={(value) => setFilterState(value || null)}>
                    <DropdownMenuRadioItem value="">
                      All states
                    </DropdownMenuRadioItem>
                    {machineStates.map((state) => (
                      <DropdownMenuRadioItem key={state} value={state}>
                        {state.charAt(0).toUpperCase() + state.slice(1)}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
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
                  placeholder="Search Machines..."
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
                      <span>Loading Machines...</span>
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
                      ? 'No Machines found matching your filters'
                      : 'No Machines found for this app'}
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
  onAction: (type: 'action' | 'create', action?: 'start' | 'stop' | 'restart' | 'suspend', machineId?: string) => void;
}

function MachineRow({ machine, appName, onAction }: MachineRowProps) {
  // Get custom class for machine state badge
  const getStateClass = (state: string): string => {
    const stateClasses: Record<string, string> = {
      started: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 border-green-200 dark:border-green-700',
      stopped: 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100 border-red-200 dark:border-red-700',
      created: 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100 border-blue-200 dark:border-blue-700',
      suspended: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100 border-yellow-200 dark:border-yellow-700',
    };
    return stateClasses[state] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600';
  };

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
      <td className="px-6 py-4 whitespace-nowrap">
        <Link
          href={`/dashboard/apps/${appName}/machines/${machine.id}`}
          className="block"
        >
          <div className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400">{machine.name || 'Unnamed'}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">{machine.id}</div>
        </Link>
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
        <Badge className={`rounded-full ${getStateClass(machine.state)}`}>
          {capitalizeMachineState(machine.state)}
        </Badge>
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
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onAction('action', 'start', machine.id)}
                  className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 cursor-pointer"
                >
                  <Play size={18} />
                  <span className="sr-only">Start</span>
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Start Machine</p>
              </TooltipContent>
            </Tooltip>
          )}
          {machine.state === 'started' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onAction('action', 'stop', machine.id)}
                  className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 cursor-pointer"
                >
                  <Square size={18} />
                  <span className="sr-only">Stop</span>
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Stop Machine</p>
              </TooltipContent>
            </Tooltip>
          )}
          {machine.state === 'started' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onAction('action', 'suspend', machine.id)}
                  className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300 cursor-pointer"
                >
                  <Pause size={18} />
                  <span className="sr-only">Suspend</span>
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Suspend Machine</p>
              </TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onAction('action', 'restart', machine.id)}
                className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300 cursor-pointer"
              >
                <RotateCw size={18} />
                <span className="sr-only">Restart</span>
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Restart Machine</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </td>
    </tr>
  );
} 