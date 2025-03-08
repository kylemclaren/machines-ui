'use client';

import React, { useState } from 'react';
import flyApi from '@/lib/api-client';
import { Terminal } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TerminalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  appName: string;
  machineId: string;
}

export function TerminalDialog({ isOpen, onClose, appName, machineId }: TerminalDialogProps) {
  const [command, setCommand] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [output, setOutput] = useState<{ stdout: string; stderr: string; exit_code: number | null } | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const runCommand = async () => {
    if (!command.trim()) return;
    
    setIsLoading(true);
    setOutput(null);
    
    try {
      // Update command history
      const newHistory = [command, ...history.slice(0, 9)]; // Keep last 10 commands
      setHistory(newHistory);
      setHistoryIndex(-1);
      
      // Split the command by spaces but respect quoted strings
      const cmdArray = command.match(/(?:[^\s"]+|"[^"]*")+/g)?.map(arg => 
        arg.startsWith('"') && arg.endsWith('"') ? arg.slice(1, -1) : arg
      ) || [command];
      
      // Manual fallback to direct API call if type issue
      let result;
      try {
        console.log('Attempting to execute command via API client:', { appName, machineId, command: cmdArray });
        // @ts-ignore - TypeScript doesn't recognize the method due to type definition
        result = await flyApi.execMachine(appName, machineId, cmdArray);
        console.log('API client exec result:', result);
      } catch (execError) {
        console.error('Exec error via API client:', execError);
        
        // Fallback to direct API call
        console.log('Falling back to direct fetch API call');
        const token = localStorage.getItem('flyApiToken');
        if (!token) {
          console.error('No API token found in localStorage');
          throw new Error('Authentication token not found');
        }
        
        // Send command as array according to API documentation
        console.log('Sending command to API via fetch:', {
          url: `/api/proxy/apps/${appName}/machines/${machineId}/exec`,
          command: cmdArray
        });
        
        const response = await fetch(`/api/proxy/apps/${appName}/machines/${machineId}/exec`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token
          },
          body: JSON.stringify({ 
            command: cmdArray,
            timeout: 30 // Default timeout of 30 seconds
          })
        });
        
        console.log('API response status:', response.status);
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API error response:', errorText);
          throw new Error(`API Error (${response.status}): ${errorText}`);
        }
        
        result = await response.json();
      }
      
      if (result) {
        setOutput(result);
      } else {
        throw new Error('No result from API call');
      }
    } catch (error: any) {
      console.error('Error executing command:', error);
      
      // Show more detailed error in the terminal
      setOutput({
        stdout: '',
        stderr: `Error executing command: ${error.message || 'Unknown error'}\n\nPlease check console for more details.`,
        exit_code: 1
      });
      
      toast.error(`Failed to execute command: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
      // Clear the command and refocus the input
      setCommand('');
      // Use setTimeout to ensure refocus happens after React rendering
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      runCommand();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      // Navigate up in history
      if (history.length > 0 && historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setCommand(history[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      // Navigate down in history
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCommand(history[newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCommand('');
      }
    }
  };

  const handleClose = () => {
    onClose();
    // Don't reset history when closing
  };

  // Handle the open state change - only actually close when user intends to
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      handleClose();
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="sm:max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Terminal - {machineId}</AlertDialogTitle>
          <AlertDialogDescription>
            Execute commands directly on this machine. Use with caution.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="mb-6 mt-2">
          <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 dark:focus-within:ring-blue-500">
            <div className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-3 py-2 border-r border-gray-200 dark:border-gray-700 font-mono">$</div>
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter command (e.g. ls -la)"
              className="flex-1 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm border-none focus:outline-none"
              disabled={isLoading}
              autoFocus
              ref={inputRef}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Press Enter to execute the command
          </p>
        </div>
        
        {history.length > 0 && (
          <div className="mb-4">
            <h4 className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-2">Recent Commands</h4>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 p-1">
              {history.slice(0, 5).map((cmd, i) => (
                <div 
                  key={i} 
                  className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1.5 rounded text-xs font-mono"
                  onClick={() => {
                    setCommand(cmd);
                    setHistoryIndex(i);
                  }}
                >
                  {cmd}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {output && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-xs font-medium text-gray-600 dark:text-gray-300">Command Output</h4>
              <span className={`text-xs px-2 py-0.5 rounded ${
                output.exit_code === 0 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
              }`}>
                Exit Code: {output.exit_code}
              </span>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
              <div className="bg-black text-white p-3 font-mono text-xs leading-relaxed overflow-auto" style={{ maxHeight: '200px' }}>
                {output.stdout && (
                  <pre className="whitespace-pre-wrap mb-2">{output.stdout}</pre>
                )}
                {output.stderr && (
                  <pre className="whitespace-pre-wrap text-red-400">{output.stderr}</pre>
                )}
                {!output.stdout && !output.stderr && (
                  <span className="text-gray-400">No output</span>
                )}
              </div>
            </div>
          </div>
        )}
        
        {output && output.exit_code !== 0 && (
          <div className="mb-4">
            <h4 className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-2">Troubleshooting Tips</h4>
            <div className="bg-amber-50 dark:bg-gray-800 border border-amber-200 dark:border-gray-700 rounded-md p-3 text-xs">
              <ul className="space-y-1.5 text-gray-700 dark:text-gray-300">
                <li className="flex items-start">
                  <span className="text-amber-500 mr-2">•</span>
                  If you see <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">command not found</span>, the command may not be installed on the machine
                </li>
                <li className="flex items-start">
                  <span className="text-amber-500 mr-2">•</span>
                  For permission errors, try using <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">sudo</span>
                </li>
                <li className="flex items-start">
                  <span className="text-amber-500 mr-2">•</span>
                  For commands with pipes or redirects, wrap in <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">sh -c "command"</span>
                </li>
              </ul>
            </div>
          </div>
        )}
        
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose} className="cursor-pointer">
            Cancel
          </AlertDialogCancel>
          <button
            onClick={(e) => {
              e.preventDefault();
              runCommand();
            }}
            disabled={isLoading || !command.trim()}
            className="cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white dark:text-white h-9 px-4 py-2 disabled:opacity-50"
          >
            {isLoading ? 'Running...' : 'Execute'}
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 