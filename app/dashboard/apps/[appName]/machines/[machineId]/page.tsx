'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { useApi } from '../../../../../../lib/api-context';
import flyApi from '../../../../../../lib/api-client';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Machine, MachineEvent, CreateMachineRequest, MachineProcess } from '../../../../../../types/api';
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
  Copy,
  Zap
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TerminalDialog } from '@/components/ui/terminal-dialog';
import { Badge } from '@/components/ui/badge';
import { MachineActionButtons } from '@/components/dashboard/MachineActionButtons';
import { FLY_REGIONS } from '@/lib/regions';

// Define available signals
const AVAILABLE_SIGNALS = [
  'SIGABRT',
  'SIGALRM',
  'SIGFPE',
  'SIGHUP',
  'SIGILL',
  'SIGINT',
  'SIGKILL',
  'SIGPIPE',
  'SIGQUIT',
  'SIGSEGV',
  'SIGTERM',
  'SIGTRAP',
  'SIGUSR1'
];

// Signal descriptions
const SIGNAL_DESCRIPTIONS: Record<string, string> = {
  'SIGABRT': 'Abort signal, used for abnormal termination',
  'SIGALRM': 'Alarm clock signal, used for timers',
  'SIGFPE': 'Floating-point exception signal',
  'SIGHUP': 'Hangup signal, used when terminal connection is lost',
  'SIGILL': 'Illegal instruction signal',
  'SIGINT': 'Interrupt signal, similar to Ctrl+C',
  'SIGKILL': 'Kill signal, forces immediate termination (cannot be caught or ignored)',
  'SIGPIPE': 'Broken pipe signal',
  'SIGQUIT': 'Quit signal, similar to Ctrl+\\',
  'SIGSEGV': 'Segmentation fault signal',
  'SIGTERM': 'Termination signal, graceful shutdown',
  'SIGTRAP': 'Trace/breakpoint trap signal',
  'SIGUSR1': 'User-defined signal 1, for custom use'
};

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
  const [selectedRegion, setSelectedRegion] = useState('');
  const [signalDialogOpen, setSignalDialogOpen] = useState(false);
  const [selectedSignal, setSelectedSignal] = useState('SIGTERM');
  const [processFilter, setProcessFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const processesPerPage = 10; // Fixed number of processes per page

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

  // Get machine processes
  const { data: processes = [], isLoading: isLoadingProcesses } = useQuery(
    ['machine-processes', appName, machineId],
    () => flyApi.getProcesses(appName, machineId),
    {
      enabled: isAuthenticated && !!appName && !!machineId,
    }
  );

  // Filter and paginate processes
  const filteredProcesses = React.useMemo(() => {
    if (!processes || processes.length === 0) return [];
    
    return processes.filter(process => 
      process.command && 
      (processFilter === '' || 
        process.command.toLowerCase().includes(processFilter.toLowerCase()) ||
        process.pid.toString().includes(processFilter) ||
        (process.directory && process.directory.toLowerCase().includes(processFilter.toLowerCase()))
      )
    );
  }, [processes, processFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredProcesses.length / processesPerPage));
  
  // Reset to page 1 when filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [processFilter]);

  const paginatedProcesses = React.useMemo(() => {
    const startIndex = (currentPage - 1) * processesPerPage;
    return filteredProcesses.slice(startIndex, startIndex + processesPerPage);
  }, [filteredProcesses, currentPage, processesPerPage]);

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
      // Set the default region to match the existing machine
      setSelectedRegion(machine.region || '');
      setCloneConfirmOpen(true);
    }
  };

  const closeCloneConfirmation = () => {
    setCloneConfirmOpen(false);
  };

  const openSignalDialog = () => {
    setSelectedSignal('SIGTERM'); // Default to SIGTERM
    setSignalDialogOpen(true);
  };

  const closeSignalDialog = () => {
    setSignalDialogOpen(false);
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
        region: selectedRegion // Use the selected region
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

  const handleSignalMachine = async () => {
    if (!machine || !selectedSignal) return;
    
    const toastId = toast.loading(`Sending ${selectedSignal} signal to machine...`);
    setIsLoading(true);
    
    try {
      const success = await flyApi.signalMachine(appName, machineId, selectedSignal);
      
      if (success) {
        toast.success(`${selectedSignal} signal sent successfully`, { id: toastId });
        // Refetch machine to update UI
        await queryClient.invalidateQueries(['machine', appName, machineId]);
      } else {
        toast.error(`Failed to send ${selectedSignal} signal`, { id: toastId });
      }
    } catch (error) {
      console.error('Error signaling machine:', error);
      toast.error(`Error sending signal to machine. Please try again later.`, { id: toastId });
    } finally {
      setIsLoading(false);
      closeSignalDialog();
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

  // Format process memory to human-readable format
  const formatMemorySize = (bytes: number): string => {
    const kb = bytes / 1024;
    if (kb < 1024) {
      return `${Math.round(kb * 10) / 10} KB`;
    }
    const mb = kb / 1024;
    if (mb < 1024) {
      return `${Math.round(mb * 10) / 10} MB`;
    }
    const gb = mb / 1024;
    return `${Math.round(gb * 10) / 10} GB`;
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
                  onSignal={openSignalDialog}
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
                      {machine?.state === 'started' && (
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
                      )}
                      {machine?.state === 'started' && (
                        <button
                          onClick={() => {
                            openSignalDialog();
                            document.querySelector('[data-state="open"]')?.dispatchEvent(
                              new KeyboardEvent('keydown', { key: 'Escape' })
                            );
                          }}
                          disabled={isLoading}
                          className="w-full flex items-center justify-center gap-2 py-3 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 transition-colors"
                        >
                          <Zap size={16} />
                          Signal Machine
                        </button>
                      )}
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

          {/* Running Processes Section */}
          {machine?.state === 'started' && (
            <div className="mx-6 mb-6 p-6 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Running Processes
                <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                  ({filteredProcesses.length})
                </span>
              </h2>
              {isLoadingProcesses ? (
                <div className="flex justify-center p-4">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : processes.length > 0 ? (
                <div>
                  {/* Process filtering and searching */}
                  <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div className="relative max-w-xs">
                      <input
                        type="text"
                        placeholder="Filter processes..."
                        className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                        value={processFilter}
                        onChange={(e) => setProcessFilter(e.target.value)}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Showing {filteredProcesses.length > 0 ? Math.min((currentPage - 1) * processesPerPage + 1, filteredProcesses.length) : 0} - {Math.min(currentPage * processesPerPage, filteredProcesses.length)} of {filteredProcesses.length} processes
                    </div>
                  </div>
                  
                  {/* Process table */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-200 dark:border-gray-700 rounded-md">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            PID
                          </th>
                          <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Command
                          </th>
                          <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            CPU %
                          </th>
                          <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Memory
                          </th>
                          <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Directory
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        {paginatedProcesses.map((process: MachineProcess) => (
                          process.command && (
                            <tr key={process.pid} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100 font-mono">
                                {process.pid}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100 font-mono truncate max-w-xs">
                                {process.command}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                                {process.cpu.toFixed(1)}%
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                                {formatMemorySize(process.rss)}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100 font-mono truncate max-w-xs">
                                {process.directory}
                              </td>
                            </tr>
                          )
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <div className="flex items-center space-x-2">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          // Show pages around current page
                          let pageToShow = currentPage;
                          if (currentPage < 3) {
                            pageToShow = i + 1;
                          } else if (currentPage > totalPages - 2) {
                            pageToShow = totalPages - 4 + i;
                          } else {
                            pageToShow = currentPage - 2 + i;
                          }
                          
                          // Ensure the page is valid
                          if (pageToShow <= 0 || pageToShow > totalPages) return null;
                          
                          return (
                            <button
                              key={pageToShow}
                              onClick={() => setCurrentPage(pageToShow)}
                              className={`px-3 py-1 border ${currentPage === pageToShow 
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300' 
                                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'} 
                                rounded-md text-sm font-medium`}
                            >
                              {pageToShow}
                            </button>
                          );
                        })}
                        {totalPages > 5 && currentPage < totalPages - 2 && (
                          <>
                            <span className="text-gray-500 dark:text-gray-400">...</span>
                            <button
                              onClick={() => setCurrentPage(totalPages)}
                              className={`px-3 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md text-sm font-medium`}
                            >
                              {totalPages}
                            </button>
                          </>
                        )}
                      </div>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md">
                  <p className="text-sm text-gray-500 dark:text-gray-400">No processes information available for this machine</p>
                </div>
              )}
            </div>
          )}

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
          <div className="mt-4 space-y-4">
            <div>
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

            <div>
              <label htmlFor="regionSelect" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Region
              </label>
              <Select
                value={selectedRegion}
                onValueChange={(value) => setSelectedRegion(value)}
              >
                <SelectTrigger className="w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600" id="regionSelect">
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 max-h-80">
                  {FLY_REGIONS.map((region) => (
                    <SelectItem key={region.code} value={region.code} className="text-gray-900 dark:text-gray-100 focus:bg-gray-100 dark:focus:bg-gray-600">
                      <div className="flex items-center">
                        <span className="mr-2">{getRegionFlag(region.code)}</span>
                        <span>{region.name} ({region.code})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                Choose the region where this Machine will be deployed
              </p>
            </div>
          </div>
        }
      />

      {/* Signal Dialog */}
      <ConfirmationDialog
        isOpen={signalDialogOpen}
        onClose={closeSignalDialog}
        onConfirm={handleSignalMachine}
        title="Signal Machine"
        description="Send a signal to the running Machine. This can be used to control the machine's behavior or terminate processes."
        confirmText="Send Signal"
        destructive={selectedSignal === 'SIGKILL' || selectedSignal === 'SIGTERM' || selectedSignal === 'SIGABRT'}
        customContent={
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Select Signal Type
            </label>
            <Select
              value={selectedSignal}
              onValueChange={(value) => setSelectedSignal(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select signal" />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_SIGNALS.map((signal) => (
                  <SelectItem key={signal} value={signal}>
                    {signal}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedSignal && (
              <div className="mt-3 mb-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {SIGNAL_DESCRIPTIONS[selectedSignal] || 'No description available.'}
                </p>
                {(selectedSignal === 'SIGKILL' || selectedSignal === 'SIGTERM') && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                    <strong>Warning:</strong> This signal may terminate processes or the entire Machine.
                  </p>
                )}
              </div>
            )}
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