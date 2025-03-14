'use client';

import React, { useState } from 'react';
import { 
  Play, 
  Square, 
  RotateCw, 
  Trash2, 
  Terminal, 
  Cog,
  Pause,
  Copy 
} from 'lucide-react';

interface MachineActionButtonsProps {
  machineState: string;
  isLoading: boolean;
  onAction: (action: 'start' | 'stop' | 'restart' | 'delete' | 'suspend') => void;
  onOpenTerminal: () => void;
  onClone: () => void;
}

export function MachineActionButtons({
  machineState,
  isLoading,
  onAction,
  onOpenTerminal,
  onClone
}: MachineActionButtonsProps) {
  const [actionsExpanded, setActionsExpanded] = useState(false);
  
  const toggleActions = () => {
    setActionsExpanded(!actionsExpanded);
  };

  return (
    <div className="hidden md:block relative">
      <div className="relative z-20 flex justify-end">
        <button
          onClick={toggleActions}
          className={`flex items-center justify-center h-10 w-10 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800/40 transition-all duration-300 focus:outline-none cursor-pointer ${actionsExpanded ? 'rotate-180' : 'rotate-0'}`}
          aria-expanded={actionsExpanded}
          title={actionsExpanded ? "Hide Actions" : "Show Actions"}
        >
          <Cog size={20} />
        </button>
      </div>
      
      {/* Keep buttons in DOM but control visibility with CSS for smooth transitions */}
      <div className={`absolute top-0 right-12 flex gap-2.5 action-buttons-container ${actionsExpanded ? 'is-visible' : 'is-hidden'}`}>
        {machineState !== 'started' && (
          <button
            onClick={() => onAction('start')}
            disabled={isLoading}
            className="action-btn h-10 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center cursor-pointer"
            style={{ '--btn-index': '0' } as React.CSSProperties}
          >
            <Play size={18} className="mr-2" />
            Start
          </button>
        )}
        {machineState === 'started' && (
          <button
            onClick={() => onAction('stop')}
            disabled={isLoading}
            className="action-btn h-10 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 flex items-center cursor-pointer" 
            style={{ '--btn-index': '1' } as React.CSSProperties}
          >
            <Square size={18} className="mr-2" />
            Stop
          </button>
        )}
        {machineState === 'started' && (
          <button
            onClick={() => onAction('restart')}
            disabled={isLoading}
            className="action-btn h-10 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center cursor-pointer"
            style={{ '--btn-index': '2' } as React.CSSProperties}
          >
            <RotateCw size={18} className="mr-2" />
            Restart
          </button>
        )}
        {machineState === 'started' && (
          <button
            onClick={() => onAction('suspend')}
            disabled={isLoading}
            className="action-btn h-10 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 flex items-center cursor-pointer" 
            style={{ '--btn-index': '3' } as React.CSSProperties}
          >
            <Pause size={18} className="mr-2" />
            Suspend
          </button>
        )}
        {machineState === 'started' && (
          <button
            onClick={onOpenTerminal}
            disabled={isLoading}
            className="action-btn h-10 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 flex items-center cursor-pointer"
            style={{ '--btn-index': '4' } as React.CSSProperties}
          >
            <Terminal size={18} className="mr-2" />
            Run
          </button>
        )}
        <button
          onClick={onClone}
          disabled={isLoading}
          className="action-btn h-10 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center cursor-pointer"
          style={{ '--btn-index': '5' } as React.CSSProperties}
        >
          <Copy size={18} className="mr-2" />
          Clone
        </button>
        {machineState !== 'started' && (
          <button
            onClick={() => onAction('delete')}
            disabled={isLoading}
            className="inline-flex items-center justify-center px-4 py-2 border border-red-300 dark:border-red-600 bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 cursor-pointer"
          >
            <Trash2 size={18} className="mr-2" />
            Delete
          </button>
        )}
      </div>
      
      {/* Improved animation styles to prevent flickering */}
      <style jsx>{`
        .action-buttons-container {
          pointer-events: none;
          opacity: 0;
          transform: translateZ(0); /* Force hardware acceleration */
          transition: opacity 200ms ease-out;
          width: max-content;
          max-width: calc(100vw - 150px);
          z-index: 30;
          background-color: transparent;
          will-change: opacity; /* Hint to browser for optimization */
        }
        
        .action-buttons-container.is-visible {
          opacity: 1;
          pointer-events: auto;
        }
        
        .action-buttons-container.is-hidden {
          opacity: 0;
          pointer-events: none;
        }
        
        .action-btn {
          opacity: 0;
          transform: scale(0.7) translateX(20px);
          transition: opacity 500ms cubic-bezier(0.34, 1.56, 0.64, 1),
                      transform 500ms cubic-bezier(0.34, 1.56, 0.64, 1);
          transition-delay: calc(var(--btn-index) * 50ms);
        }
        
        .is-visible .action-btn {
          opacity: 1;
          transform: scale(1) translateX(0);
        }
        
        /* Create a more dramatic animation with a small overshoot */
        @media (prefers-reduced-motion: no-preference) {
          .is-visible .action-btn {
            animation: buttonPop 500ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
            animation-delay: calc(var(--btn-index) * 50ms);
          }
          
          @keyframes buttonPop {
            0% {
              opacity: 0;
              transform: scale(0.7) translateX(20px);
            }
            70% {
              opacity: 1;
              transform: scale(1.05) translateX(-2px);
            }
            100% {
              opacity: 1;
              transform: scale(1) translateX(0);
            }
          }
        }
      `}</style>
    </div>
  );
} 