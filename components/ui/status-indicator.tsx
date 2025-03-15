'use client';

import React, { useState, useEffect } from 'react';
import { fetchStatusFeed, StatusEntry } from '@/lib/status-feed';
import { CheckCircle2, ExternalLink } from 'lucide-react';

export default function StatusIndicator() {
  const [activeIncident, setActiveIncident] = useState<StatusEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Mark as initialized to handle hydration properly
    setInitialized(true);
    
    async function checkStatus() {
      try {
        setLoading(true);
        const feed = await fetchStatusFeed();
        
        // Check if there are any active incidents
        const activeIncidents = feed.filter(entry => {
          const lowerContent = entry.content.toLowerCase();
          const lowerTitle = entry.title.toLowerCase();
          
          // Check if it contains "incident" but not "resolved" in the title
          const isIncidentInTitle = lowerTitle.includes('incident') && !lowerTitle.includes('resolved');
          
          // Also check if the content has "investigating" or "identified" but not "resolved"
          const hasActiveKeywords = 
            (lowerContent.includes('investigating') || 
             lowerContent.includes('identified') || 
             lowerContent.includes('monitoring')) && 
            !lowerContent.includes('resolved</strong>');
          
          return isIncidentInTitle || hasActiveKeywords;
        });
        
        setActiveIncident(activeIncidents.length > 0 ? activeIncidents[0] : null);
      } catch (err) {
        console.error('Error checking status:', err);
        // In case of error, don't show the indicator
        setActiveIncident(null);
      } finally {
        setLoading(false);
      }
    }

    checkStatus();
    // Refresh every 5 minutes
    const interval = setInterval(checkStatus, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // During server-side rendering or before initialization, don't render anything
  if (!initialized || loading) {
    return null;
  }

  if (activeIncident) {
    // Incident state: yellow with incident title
    return (
      <div className="w-full flex justify-center py-2">
        <a 
          href={activeIncident.link} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center space-x-2 bg-yellow-50 dark:bg-yellow-900/30 hover:bg-yellow-100 dark:hover:bg-yellow-800/50 rounded-full shadow-sm px-3 py-1.5 border border-yellow-200 dark:border-yellow-800 cursor-pointer transition-colors"
        >
          <span className="text-xs font-medium text-yellow-700 dark:text-yellow-300 max-w-[180px] truncate">{activeIncident.title}</span>
          <ExternalLink className="h-3 w-3 text-yellow-500 dark:text-yellow-400 flex-shrink-0" />
        </a>
      </div>
    );
  }

  // Normal state: green with "All Systems Operational"
  return (
    <div className="w-full flex justify-center py-2">
      <div className="flex items-center space-x-2 bg-white dark:bg-gray-700 rounded-full shadow-sm px-3 py-1.5 border border-green-200 dark:border-green-800">
        <CheckCircle2 className="h-4 w-4 text-green-500" />
        <span className="text-xs font-medium text-green-700 dark:text-green-400">All Systems Operational</span>
      </div>
    </div>
  );
} 