'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { useApi } from '../../../../../../lib/api-context';
import flyApi from '../../../../../../lib/api-client';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Machine, MachineEvent, CreateMachineRequest } from '../../../../../../types/api';
import { TimeAgo } from "@/components/ui/time-ago";
import toast from 'react-hot-toast';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { getRegionFlag, formatMemory, capitalizeMachineState } from '@/lib/utils';
import { 
  Play, 
  Square, 
  RotateCw, 
  Trash2, 
  Menu, 
  Terminal, 
  Pause,
  ChevronRight,
  ChevronDown,
  Settings,
  ArrowLeft,
  Loader2,
  Cog,
  Copy
} from 'lucide-react';
import { CopyableCode } from '@/components/ui/copyable-code';
import { CopyableJson } from '@/components/ui/copyable-json';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { TerminalDialog } from '@/components/ui/terminal-dialog';
import { Badge } from '@/components/ui/badge';
import { MachineActionButtons } from '@/components/dashboard/MachineActionButtons';

export default function MachineDetailsPage() {
  const { isAuthenticated } = useApi();
  const params = useParams();
  const appName = params?.appName as string;
  const machineId = params?.machineId as string;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'start' | 'stop' | 'restart' | 'delete' | 'suspend' | null>(null);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [cloneConfirmOpen, setCloneConfirmOpen] = useState(false);
  const [newMachineName, setNewMachineName] = useState('');

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

  // Get machine metadata
  const { data: metadata, isLoading: isLoadingMetadata } = useQuery(
    ['machine-metadata', appName, machineId],
    () => flyApi.getMachineMetadata(appName, machineId),
    {
      enabled: isAuthenticated && !!appName && !!machineId,
    }
  );

  const openConfirmation = (action: 'start' | 'stop' | 'restart' | 'delete' | 'suspend') => {
    setConfirmAction(action);
    setConfirmationOpen(true);
  };

  const closeConfirmation = () => {
    setConfirmationOpen(false);
  };

  const openTerminal = () => {
    setTerminalOpen(true);
  };

  const closeTerminal = () => {
    setTerminalOpen(false);
  };

  const openCloneConfirmation = () => {
    if (machine) {
      // Generate a default name for the cloned machine
      const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').substring(0, 12);
      setNewMachineName(`${machine.name}-clone-${timestamp}`);
      setCloneConfirmOpen(true);
    }
  };

  const closeCloneConfirmation = () => {
    setCloneConfirmOpen(false);
  };

  const getConfirmationMessage = () => {
    if (!confirmAction) return { title: '', description: '' };
    
    const actionMap = {
      start: { title: 'Start Machine?', description: 'Are you sure you want to start this Machine?' },
      stop: { title: 'Stop Machine?', description: 'Are you sure you want to stop this Machine?' },
      restart: { title: 'Restart Machine?', description: 'Are you sure you want to restart this Machine?' },
      delete: { 
        title: 'Delete Machine?', 
        description: 'This action cannot be undone. This will permanently delete this Machine and all associated data.' 
      },
      suspend: {
        title: 'Suspend Machine?',
        description: 'This will pause the Machine and preserve its memory state. You can resume it later.'
      }
    };
    
    return actionMap[confirmAction];
  };

  const handleMachineAction = async (action: 'start' | 'stop' | 'restart' | 'delete' | 'suspend') => {
    let actionText = action === 'suspend' ? 'suspending' : `${action}ing`;
    const toastId = toast.loading(`${actionText.charAt(0).toUpperCase() + actionText.slice(1)} machine...`);
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
        case 'suspend':
          success = await flyApi.suspendMachine(appName, machineId);
          break;
      }

      if (success) {
        const pastTense = `${action}${action === 'stop' ? 'p' : ''}ed`;
        toast.success(`Machine ${pastTense} successfully`, { id: toastId });
        // Refetch machine to update UI
        await queryClient.invalidateQueries(['machine', appName, machineId]);
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

  const handleCloneMachine = async () => {
    if (!machine) return;
    
    const toastId = toast.loading(`Cloning machine...`);
    setIsLoading(true);
    
    try {
      // Prepare the request data
      const createMachineRequest: CreateMachineRequest = {
        name: newMachineName,
        config: machine.config,
        region: machine.region
      };
      
      console.log('Cloning machine with config:', createMachineRequest);
      
      // Create the new machine
      const newMachine = await flyApi.createMachine(appName, createMachineRequest);
      
      if (newMachine) {
        toast.success(`Machine cloned successfully`, { id: toastId });
        
        // Navigate to the new machine
        router.push(`/dashboard/apps/${appName}/machines/${newMachine.id}`);
      } else {
        toast.error(`Failed to clone machine`, { id: toastId });
      }
    } catch (error) {
      console.error('Error cloning machine:', error);
      toast.error(`Error cloning machine. Please try again later.`, { id: toastId });
    } finally {
      setIsLoading(false);
      closeCloneConfirmation();
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
      <div className="relative flex flex-col items-center justify-center min-h-[500px] p-8 md:p-12 bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {/* Background decoration - subtle and non-distracting */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-[300px] h-[300px] rounded-full bg-red-100/50 dark:bg-red-900/10 blur-3xl -top-20 -right-20 opacity-70"></div>
          <div className="absolute w-[250px] h-[250px] rounded-full bg-gray-100/70 dark:bg-gray-700/20 blur-3xl -bottom-20 -left-20 opacity-70"></div>
        </div>
        
        <div className="relative z-10 flex flex-col items-center text-center max-w-md mx-auto">
          
          {/* Main heading */}
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white mb-3">
            Machine Not Found
          </h1>
          
          {/* Detailed message */}
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            We couldn't find a machine with ID <span className="font-mono text-sm bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{machineId}</span>
          </p>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            The machine may have been deleted or you might have followed an outdated link.
          </p>
          
          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
            <Link
              href={`/dashboard/apps/${appName}/machines`}
              className="flex-1 inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <span>View All Machines</span>
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

  // Get the variant for machine state badge
  const getStateVariant = (state: string): "default" | "destructive" | "outline" | "secondary" | null => {
    const stateVariants: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
      started: 'default', // Green
      stopped: 'destructive', // Red
      created: 'secondary', // Gray
      suspended: 'outline', // Yellow/outline
    };
    return stateVariants[state] || 'secondary';
  };
  
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
              <BreadcrumbLink href={`/dashboard/apps/${appName}/machines`}>
                Machines
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{machine?.name || machineId}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      
      <main className="flex-1 overflow-auto p-4 md:p-6">
        {/* Add Back to Machines button and actions at the top of the page */}
        <div className="mb-6 flex justify-between items-center">
          <Link
            href={`/dashboard/apps/${appName}/machines`}
            className="inline-flex items-center justify-center px-4 py-2 h-10 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Machines
          </Link>
          
          {/* Action buttons */}
          {machine && (
            <>
              {/* Desktop view - Show expanded buttons */}
              <div className="hidden md:flex items-center">
                <MachineActionButtons 
                  machineState={machine.state}
                  isLoading={isLoading}
                  onAction={openConfirmation}
                  onOpenTerminal={openTerminal}
                  onClone={openCloneConfirmation}
                />
              </div>
              
              {/* Mobile view - Show drawer */}
              <div className="md:hidden">
                <Drawer>
                  <DrawerTrigger asChild>
                    <button className="h-10 w-10 flex items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800/40 transition-all duration-300 focus:outline-none cursor-pointer">
                      <Cog size={20} />
                    </button>
                  </DrawerTrigger>
                  <DrawerContent>
                    <DrawerHeader>
                      <DrawerTitle className="text-center">Machine Actions</DrawerTitle>
                      <DrawerDescription className="text-center">
                        Manage {machine?.name || machineId}
                      </DrawerDescription>
                    </DrawerHeader>
                    <div className="px-4 py-2 space-y-3">
                      {machine?.state !== 'started' && (
                        <button
                          onClick={() => {
                            openConfirmation('start');
                            document.querySelector('[data-state="open"]')?.dispatchEvent(
                              new KeyboardEvent('keydown', { key: 'Escape' })
                            );
                          }}
                          disabled={isLoading}
                          className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          <Play size={16} />
                          Start Machine
                        </button>
                      )}
                      {machine?.state === 'started' && (
                        <button
                          onClick={() => {
                            openConfirmation('stop');
                            document.querySelector('[data-state="open"]')?.dispatchEvent(
                              new KeyboardEvent('keydown', { key: 'Escape' })
                            );
                          }}
                          disabled={isLoading}
                          className="w-full flex items-center justify-center gap-2 py-3 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 transition-colors"
                        >
                          <Square size={16} />
                          Stop Machine
                        </button>
                      )}
                      <button
                        onClick={() => {
                          openConfirmation('restart');
                          document.querySelector('[data-state="open"]')?.dispatchEvent(
                            new KeyboardEvent('keydown', { key: 'Escape' })
                          );
                        }}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        <RotateCw size={16} />
                        Restart Machine
                      </button>
                      {machine?.state === 'started' && (
                        <button
                          onClick={() => {
                            openConfirmation('suspend');
                            document.querySelector('[data-state="open"]')?.dispatchEvent(
                              new KeyboardEvent('keydown', { key: 'Escape' })
                            );
                          }}
                          disabled={isLoading}
                          className="w-full flex items-center justify-center gap-2 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 transition-colors"
                        >
                          <Pause size={16} />
                          Suspend Machine
                        </button>
                      )}
                      <button
                        onClick={() => {
                          openCloneConfirmation();
                          document.querySelector('[data-state="open"]')?.dispatchEvent(
                            new KeyboardEvent('keydown', { key: 'Escape' })
                          );
                        }}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                      >
                        <Copy size={16} />
                        Clone Machine
                      </button>
                      {machine?.state === 'started' && (
                        <button
                          onClick={() => {
                            openTerminal();
                            document.querySelector('[data-state="open"]')?.dispatchEvent(
                              new KeyboardEvent('keydown', { key: 'Escape' })
                            );
                          }}
                          disabled={isLoading}
                          className="w-full flex items-center justify-center gap-2 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 transition-colors"
                        >
                          <Terminal size={16} />
                          Run Terminal
                        </button>
                      )}
                      {machine?.state !== 'started' && (
                        <button
                          onClick={() => {
                            openConfirmation('delete');
                            document.querySelector('[data-state="open"]')?.dispatchEvent(
                              new KeyboardEvent('keydown', { key: 'Escape' })
                            );
                          }}
                          disabled={isLoading}
                          className="w-full flex items-center justify-center gap-2 py-3 bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors border border-red-300 dark:border-red-600"
                        >
                          <Trash2 size={16} />
                          Delete Machine
                        </button>
                      )}
                    </div>
                    <DrawerFooter>
                      <DrawerClose asChild>
                        <button className="w-full py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                          Cancel
                        </button>
                      </DrawerClose>
                    </DrawerFooter>
                  </DrawerContent>
                </Drawer>
              </div>
            </>
          )}
        </div>

        {/* Content section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden relative">
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 p-6">
            <div>
              <h1 className="flex items-center text-2xl font-bold text-gray-900 dark:text-white">
                {machine?.name || machineId}
                {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                {machine && (
                  <Badge 
                    className={`ml-3 rounded-full px-2.5 py-0.5 text-xs ${getStateClass(machine.state)}`}
                  >
                    {capitalizeMachineState(machine.state)}
                  </Badge>
                )}
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Machine details and configuration
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
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Machine ID</p>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white font-mono">
                    <CopyableCode value={machine?.id || ''}>{machine?.id}</CopyableCode>
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Region</p>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white flex items-center">
                    <span className="mr-2 text-lg" title={machine?.region || 'Unknown region'}>
                      {getRegionFlag(machine?.region)}
                    </span>
                    {machine?.region || 'Unknown'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Private IP</p>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white font-mono">
                    <CopyableCode value={machine?.private_ip || ''}>{machine?.private_ip}</CopyableCode>
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</p>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {machine?.created_at && <TimeAgo date={machine.created_at} />}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</p>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {machine?.updated_at && <TimeAgo date={machine.updated_at} />}
                  </p>
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Image</p>
                  <div className="mt-1 text-sm text-gray-900 dark:text-white font-mono w-full overflow-hidden">
                    <CopyableCode value={machine?.config?.image || ''} className="break-all w-full">
                      {machine?.config?.image}
                    </CopyableCode>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white dark:bg-gray-800">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Resources
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">CPU</p>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {machine?.config?.guest?.cpus} CPUs ({machine?.config?.guest?.cpu_kind})
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Memory</p>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {machine?.config?.guest?.memory_mb && formatMemory(machine.config.guest.memory_mb)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Restart Policy</p>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {machine?.config?.restart?.policy || 'Unknown'}
                  </p>
                </div>
                {machine?.config?.services && machine.config.services.length > 0 && (
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

          <div className="mx-6 mb-6 p-6 bg-white dark:bg-gray-800">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Configuration</h2>
            
            {machine?.config?.env && Object.keys(machine.config.env).length > 0 && (
              <div className="mt-0">
                <h3 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-2">Environment Variables</h3>
                <CopyableJson data={machine.config.env} />
              </div>
            )}
            
            {machine?.config?.services && machine.config.services.length > 0 && (
              <div className="mt-6">
                <h3 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-2">Services</h3>
                <CopyableJson data={machine.config.services} />
              </div>
            )}
            
            {/* Machine Metadata */}
            <div className="mt-6">
              <h3 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-2">Metadata</h3>
              {isLoadingMetadata ? (
                <div className="flex justify-center p-4">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : metadata && Object.keys(metadata).length > 0 ? (
                <CopyableJson data={metadata} />
              ) : (
                <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md">
                  <p className="text-sm text-gray-500 dark:text-gray-400">No metadata available for this machine</p>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Events
              <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                ({events.length})
              </span>
            </h2>
            {events.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-6">No events found for this Machine</p>
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
        </div>
      </main>

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
        requireValidation={confirmAction === 'delete'}
        validationText={confirmAction === 'delete' ? machine?.name || machineId : ''}
        validationLabel={confirmAction === 'delete' ? `To confirm deletion, please type "${machine?.name || machineId}"` : ''}
      />

      {/* Clone Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={cloneConfirmOpen}
        onClose={closeCloneConfirmation}
        onConfirm={handleCloneMachine}
        title="Clone Machine"
        description="This will create a new Machine with the same configuration as the current one."
        confirmText="Clone"
        destructive={false}
        customContent={
          <div className="mt-4">
            <label htmlFor="machineName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              New Machine Name
            </label>
            <input
              type="text"
              id="machineName"
              value={newMachineName}
              onChange={(e) => setNewMachineName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
              placeholder="Enter a name for the cloned Machine"
            />
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              Leave blank to generate a name automatically
            </p>
          </div>
        }
      />

      {/* Terminal Dialog */}
      <TerminalDialog
        isOpen={terminalOpen}
        onClose={closeTerminal}
        appName={appName}
        machineId={machineId}
      />
    </div>
  );
}

// Interface and component for rendering event rows
interface EventRowProps {
  event: MachineEvent;
}

function EventRow({ event }: EventRowProps) {
  const getStatusClass = () => {
    const statusClasses = {
      succeeded: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100',
      failed: 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100',
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
    };
    
    return statusClasses[event.status as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100';
  };
  
  return (
    <tr>
      <td className="px-6 py-4 whitespace-nowrap">
        <TimeAgo date={event.timestamp} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="capitalize">{event.type}</span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass()}`}>
          {event.status}
        </span>
      </td>
    </tr>
  );
} 