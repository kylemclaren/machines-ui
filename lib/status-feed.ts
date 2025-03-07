export interface StatusEntry {
  id: string;
  title: string;
  updated: string;
  content: string;
  link: string;
  isIncident: boolean;
}

export async function fetchStatusFeed(): Promise<StatusEntry[]> {
  try {
    const response = await fetch('/api/status');
    if (!response.ok) {
      throw new Error(`Failed to fetch status feed: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.entries || [];
  } catch (error) {
    console.error('Error fetching status feed:', error);
    return [];
  }
}

export function hasActiveIncidents(entries: StatusEntry[]): boolean {
  return entries.some(entry => entry.isIncident);
} 