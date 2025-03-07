'use client';

import React, { useState, useEffect } from 'react';
import { fetchStatusFeed } from '@/lib/status-feed';
import { CheckCircle2 } from 'lucide-react';

export default function StatusIndicator() {
  const [hasIncidents, setHasIncidents] = useState(false);
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
        
        setHasIncidents(activeIncidents.length > 0);
      } catch (err) {
        console.error('Error checking status:', err);
        // In case of error, don't show the indicator
        setHasIncidents(true);
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
  if (!initialized || loading || hasIncidents) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 rounded-full shadow-md px-3 py-1.5 border border-green-200 dark:border-green-800">
        <CheckCircle2 className="h-4 w-4 text-green-500" />
        <span className="text-xs font-medium text-green-700 dark:text-green-400">All Systems Operational</span>
      </div>
    </div>
  );
} 