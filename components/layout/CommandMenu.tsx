'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  CommandDialog, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList,
  CommandSeparator
} from '@/components/ui/command'
import { Database, HardDrive, Server } from 'lucide-react'
import { useApi } from '@/lib/api-context'
import flyApi from '@/lib/api-client'
import { useQuery } from 'react-query'

export function CommandMenu() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { isAuthenticated, orgSlug } = useApi()
  
  // Define query keys
  const appsQueryKey = ['apps', orgSlug]
  const machinesQueryKey = ['all-machines']
  const volumesQueryKey = ['all-volumes']
  
  // Fetch apps if authenticated
  const { data: apps = [] } = useQuery(
    appsQueryKey,
    () => flyApi.listApps(orgSlug || 'personal'),
    {
      enabled: isAuthenticated && open,
      staleTime: 1000 * 60 * 5, // 5 minutes
    }
  )
  
  // Fetch all machines from all apps
  const { data: machines = [] } = useQuery(
    machinesQueryKey,
    async () => {
      // Only attempt to fetch if we have apps
      if (!apps.length) return []
      
      // Fetch machines for each app
      const machinesPromises = apps.map(async (app) => {
        try {
          const appMachines = await flyApi.listMachines(app.name)
          // Add app name to each machine for context
          return appMachines.map(machine => ({
            ...machine,
            appName: app.name
          }))
        } catch (error) {
          console.error(`Error fetching machines for app ${app.name}:`, error)
          return []
        }
      })
      
      // Combine all machines into one array
      const machineArrays = await Promise.all(machinesPromises)
      return machineArrays.flat()
    },
    {
      enabled: isAuthenticated && open && !!apps.length,
      staleTime: 1000 * 60 * 5, // 5 minutes
    }
  )
  
  // Fetch all volumes from all apps
  const { data: volumes = [] } = useQuery(
    volumesQueryKey,
    async () => {
      // Only attempt to fetch if we have apps
      if (!apps.length) return []
      
      // Fetch volumes for each app
      const volumesPromises = apps.map(async (app) => {
        try {
          const appVolumes = await flyApi.listVolumes(app.name)
          // Add app name to each volume for context
          return appVolumes.map(volume => ({
            ...volume,
            appName: app.name
          }))
        } catch (error) {
          console.error(`Error fetching volumes for app ${app.name}:`, error)
          return []
        }
      })
      
      // Combine all volumes into one array
      const volumeArrays = await Promise.all(volumesPromises)
      return volumeArrays.flat()
    },
    {
      enabled: isAuthenticated && open && !!apps.length,
      staleTime: 1000 * 60 * 5, // 5 minutes
    }
  )

  // Setup keyboard shortcut (Cmd+K or Ctrl+K)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  // Handle navigation when an item is selected
  const handleSelect = (value: string) => {
    setOpen(false)
    router.push(value)
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search Apps, Machines, Volumes..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        {/* Apps Group */}
        <CommandGroup heading="Apps">
          {apps.map((app) => (
            <CommandItem
              key={app.id}
              value={`/dashboard/apps/${app.name}`}
              onSelect={handleSelect}
            >
              <Database className="mr-2 h-4 w-4" />
              <span>{app.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        
        <CommandSeparator />
        
        {/* Machines Group */}
        <CommandGroup heading="Machines">
          {machines.map((machine) => (
            <CommandItem
              key={machine.id}
              value={`/dashboard/apps/${machine.appName}/machines/${machine.id}`}
              onSelect={handleSelect}
            >
              <Server className="mr-2 h-4 w-4" />
              <span>{machine.name || machine.id}</span>
              <span className="ml-2 text-xs text-gray-500">
                ({machine.appName})
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
        
        <CommandSeparator />
        
        {/* Volumes Group */}
        <CommandGroup heading="Volumes">
          {volumes.map((volume) => (
            <CommandItem
              key={volume.id}
              value={`/dashboard/apps/${volume.appName}/volumes/${volume.id}`}
              onSelect={handleSelect}
            >
              <HardDrive className="mr-2 h-4 w-4" />
              <span>{volume.name || volume.id}</span>
              <span className="ml-2 text-xs text-gray-500">
                ({volume.appName})
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
} 