'use client';

import React, { useState, useEffect } from 'react';
import { fetchStatusFeed, StatusEntry } from '@/lib/status-feed';
import { AlertTriangle, X, ExternalLink } from 'lucide-react';

// Local storage key for dismissed incidents
const DISMISSED_INCIDENTS_KEY = 'fly-dashboard-dismissed-incidents';

export default function StatusBanner() {
  const [incidents, setIncidents] = useState<StatusEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Load dismissed incidents from localStorage
  const getDismissedIncidents = (): string[] => {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem(DISMISSED_INCIDENTS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (err) {
      console.error('Error reading dismissed incidents from localStorage:', err);
      return [];
    }
  };

  // Save dismissed incident ID to localStorage
  const saveDismissedIncident = (id: string) => {
    if (typeof window === 'undefined') return;
    
    try {
      const dismissedIncidents = getDismissedIncidents();
      
      // Only add if not already in the list
      if (!dismissedIncidents.includes(id)) {
        const updatedDismissed = [...dismissedIncidents, id];
        
        // Limit the number of stored IDs to prevent localStorage from growing too large
        const limitedDismissed = updatedDismissed.slice(-20); // Keep only the last 20
        
        localStorage.setItem(DISMISSED_INCIDENTS_KEY, JSON.stringify(limitedDismissed));
      }
    } catch (err) {
      console.error('Error saving dismissed incident to localStorage:', err);
    }
  };

  useEffect(() => {
    // Mark as initialized to handle hydration properly
    setInitialized(true);
    
    async function loadStatusFeed() {
      try {
        setLoading(true);
        const feed = await fetchStatusFeed();
        const dismissedIncidents = getDismissedIncidents();
        
        // Filter for active incidents and remove already dismissed ones
        const activeIncidents = feed.filter(entry => {
          // Skip if already dismissed
          if (dismissedIncidents.includes(entry.id)) {
            return false;
          }
          
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
        
        setIncidents(activeIncidents);
        setError(null);
      } catch (err) {
        setError('Failed to load status information');
        console.error('Error loading status feed:', err);
      } finally {
        setLoading(false);
      }
    }

    loadStatusFeed();
    // Refresh every 5 minutes
    const interval = setInterval(loadStatusFeed, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Handle dismissing the banner
  const handleDismiss = () => {
    if (incidents.length > 0) {
      // Save all incident IDs as dismissed
      incidents.forEach(incident => saveDismissedIncident(incident.id));
    }
    setDismissed(true);
  };

  // During server-side rendering or before initialization, don't render anything
  // This prevents hydration errors and flickering
  if (!initialized) {
    return null;
  }

  // Don't show anything if loading, no incidents, or banner was dismissed
  if (loading || incidents.length === 0 || dismissed) {
    return null;
  }

  // Extract first incident for display
  const mainIncident = incidents[0];

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/30 border-b border-yellow-200 dark:border-yellow-800">
      <div className="px-4 py-3 mx-auto max-w-7xl">
        <div className="flex items-center justify-between">
          {/* Left spacer for balance */}
          <div className="w-8">
            {incidents.length > 1 && (
              <div className="text-xs text-yellow-600 dark:text-yellow-400">
                +{incidents.length - 1}
              </div>
            )}
          </div>
          
          {/* Centered title */}
          <div className="flex-1 text-center flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mr-2 flex-shrink-0" />
            <div className="font-medium text-yellow-700 dark:text-yellow-300">
              Fly.io Status Alert: {mainIncident.title}
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center space-x-2">
            <a 
              href={mainIncident.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-2 py-1 text-sm rounded-md bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 flex items-center hover:bg-yellow-200 dark:hover:bg-yellow-700"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Details
            </a>
            <button 
              onClick={handleDismiss} 
              className="text-yellow-700 dark:text-yellow-300 hover:text-yellow-800 dark:hover:text-yellow-200 focus:outline-none"
              aria-label="Dismiss"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 