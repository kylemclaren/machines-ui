import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
  // Get the URL from the query parameter
  const url = request.nextUrl.searchParams.get('url');
  
  if (!url) {
    return NextResponse.json(
      { error: 'URL parameter is required' },
      { status: 400 }
    );
  }

  try {
    // Set a short timeout to avoid long waits
    const response = await axios.get(url, {
      timeout: 5000, // 5 seconds timeout
      validateStatus: () => true, // Don't throw error for any status code
    });
    
    const isAccessible = response.status >= 200 && response.status < 300;
    
    return NextResponse.json({
      isAccessible,
      status: response.status,
      url
    });
  } catch (error) {
    console.error('Error checking site accessibility:', error);
    return NextResponse.json({
      isAccessible: false,
      error: 'Failed to connect',
      url
    });
  }
} 