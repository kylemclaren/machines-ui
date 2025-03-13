'use client';

import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { useApi } from '../../../lib/api-context';
import flyApi from '../../../lib/api-client';
import { Machine } from '../../../types/api';
import Link from 'next/link';
import { TimeAgo } from "@/components/ui/time-ago";
import { Loader2, Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn, getRegionFlag } from "@/lib/utils";

export default function MachinesPage() {
  const { orgSlug, isAuthenticated } = useApi();
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [filterState, setFilterState] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [openFilter, setOpenFilter] = useState(false);

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

  const states = [
    { label: "All states", value: "" },
    { label: "Started", value: "started" },
    { label: "Stopped", value: "stopped" },
    { label: "Destroying", value: "destroying" }
  ];

  if (!isAuthenticated) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Machines</h1>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Please sign in to view your machines.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center mb-2">
        <Breadcrumb className="w-full">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">
                Dashboard
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Machines</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Machines</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your Fly Machines
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="sm:w-1/3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Select App
              </label>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  >
                    {selectedApp ? selectedApp : "Select an app..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start" sideOffset={4}>
                  <Command>
                    <CommandInput placeholder="Search apps..." className="h-9" />
                    <CommandEmpty>
                      {isLoadingApps ? (
                        <div className="flex items-center justify-center py-6">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading apps...
                        </div>
                      ) : (
                        "No apps found."
                      )}
                    </CommandEmpty>
                    <CommandGroup>
                      {apps?.map((app) => (
                        <CommandItem
                          key={app.id}
                          onSelect={() => {
                            setSelectedApp(app.name);
                            setOpen(false);
                          }}
                          className="cursor-pointer"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedApp === app.name ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {app.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="sm:w-1/3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Filter by State
              </label>
              <Popover open={openFilter} onOpenChange={setOpenFilter}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openFilter}
                    disabled={!selectedApp}
                    className="w-full justify-between bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500 dark:disabled:text-gray-500"
                  >
                    {filterState ? states.find(state => state.value === filterState)?.label : states[0].label}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start" sideOffset={4}>
                  <Command>
                    <CommandInput placeholder="Search states..." className="h-9" />
                    <CommandEmpty>No states found.</CommandEmpty>
                    <CommandGroup>
                      {states.map((state) => (
                        <CommandItem
                          key={state.value}
                          onSelect={() => {
                            setFilterState(state.value || null);
                            setOpenFilter(false);
                          }}
                          className="cursor-pointer"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              filterState === state.value ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {state.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {/* Display loading, no app selected, or machines */}
        <div className="bg-white dark:bg-gray-800 p-4">
          {!selectedApp ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              Please select an app to view its machines
            </p>
          ) : isLoadingMachines ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : machines && machines.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Region
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {machines.map((machine) => (
                    <MachineRow key={machine.id} machine={machine} appName={selectedApp} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              No Machines found for this app.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

interface MachineRowProps {
  machine: Machine;
  appName: string;
}

function MachineRow({ machine, appName }: MachineRowProps) {
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

  // Capitalize first letter of state
  const capitalizeState = (state: string): string => {
    return state.charAt(0).toUpperCase() + state.slice(1);
  };

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
      <td className="px-6 py-4 whitespace-nowrap">
        <Link
          href={`/dashboard/apps/${appName}/machines/${machine.id}`}
          className="block"
        >
          <div className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400">{machine.name || 'Unnamed'}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{machine.id}</div>
        </Link>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Badge className={`rounded-full ${getStateClass(machine.state)}`}>
          {capitalizeState(machine.state)}
        </Badge>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <span className="text-xl mr-2" title={machine.region || 'Unknown region'}>
            {getRegionFlag(machine.region)}
          </span>
          <div className="text-sm text-gray-500 dark:text-gray-400">{machine.region}</div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        <TimeAgo date={machine.created_at} />
      </td>
    </tr>
  );
} 