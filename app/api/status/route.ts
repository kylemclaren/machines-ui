import { NextRequest, NextResponse } from 'next/server';
import { parseStringPromise } from 'xml2js';

const STATUS_FEED_URL = 'https://status.flyio.net/history.atom';

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(STATUS_FEED_URL, { 
      next: { revalidate: 60 } // Revalidate every 60 seconds
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch status feed: ${response.statusText}`);
    }
    
    const xmlData = await response.text();
    const result = await parseStringPromise(xmlData, { explicitArray: false });
    
    if (!result.feed || !result.feed.entry) {
      return NextResponse.json({ entries: [] });
    }
    
    // Ensure entries is always an array even if there's only one entry
    const entries = Array.isArray(result.feed.entry) 
      ? result.feed.entry 
      : [result.feed.entry];
    
    const processedEntries = entries.map((entry: any) => ({
      id: entry.id,
      title: entry.title,
      updated: entry.updated,
      content: entry.content._,
      link: entry.link.$.href,
      // Consider it an active incident if the title contains certain keywords
      isIncident: entry.title.toLowerCase().includes('incident') && 
                  !entry.title.toLowerCase().includes('resolved')
    }));
    
    return NextResponse.json({ entries: processedEntries });
  } catch (error) {
    console.error('Error fetching status feed:', error);
    return NextResponse.json({ error: 'Failed to fetch status feed' }, { status: 500 });
  }
} 