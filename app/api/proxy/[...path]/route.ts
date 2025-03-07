import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const API_BASE_URL = 'https://api.machines.dev/v1';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Await the params first
    const resolvedParams = await params;
    
    // Validate the path parameter
    if (!resolvedParams.path || !Array.isArray(resolvedParams.path)) {
      throw new Error('Invalid path parameter');
    }
    
    const pathString = resolvedParams.path.join('/');
    
    // Get the API token from the request header
    const authHeader = request.headers.get('Authorization') || '';
    
    if (!authHeader) {
      console.error('Missing Authorization header');
      return NextResponse.json(
        { error: 'Missing Authorization header' },
        { status: 401 }
      );
    }
    
    // Log that we're making a request (for debugging)
    console.log(`Proxying GET request to: ${pathString}`);
    
    // Get query parameters
    const url = new URL(request.url);
    const queryParams: Record<string, string> = {};
    
    url.searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });
    
    console.log('Query params:', queryParams);
    
    // Extract the token part
    const tokenPart = authHeader.replace('Bearer ', '').trim();
    // Format the authorization header correctly
    const formattedAuth = `Bearer ${tokenPart}`;
    
    // Make the request to the Fly API
    const response = await axios.get(`${API_BASE_URL}/${pathString}`, {
      params: queryParams,
      headers: {
        'Authorization': formattedAuth,
        'Content-Type': 'application/json',
      },
    });
    
    console.log(`Proxy success with status: ${response.status}`);
    
    // Return the response
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('API Proxy Error:', error);
    
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
      
      return NextResponse.json(
        { error: error.message, details: error.response.data },
        { status: error.response.status }
      );
    }
    
    // Return the error with proper status code
    return NextResponse.json(
      { error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Await the params first
    const resolvedParams = await params;
    
    // Validate the path parameter
    if (!resolvedParams.path || !Array.isArray(resolvedParams.path)) {
      throw new Error('Invalid path parameter');
    }
    
    const pathString = resolvedParams.path.join('/');
    
    // Get the API token from the request header
    const authHeader = request.headers.get('Authorization') || '';
    
    if (!authHeader) {
      console.error('Missing Authorization header');
      return NextResponse.json(
        { error: 'Missing Authorization header' },
        { status: 401 }
      );
    }
    
    // Log that we're making a request (for debugging)
    console.log(`Proxying POST request to: ${pathString}`);
    
    // Get query parameters
    const url = new URL(request.url);
    const queryParams: Record<string, string> = {};
    
    url.searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });
    
    // Get the request body
    const body = await request.json().catch(() => {
      console.log('No JSON body found');
      return {};
    });
    
    console.log('Request body:', body);
    
    // Extract the token part
    const tokenPart = authHeader.replace('Bearer ', '').trim();
    // Format the authorization header correctly
    const formattedAuth = `Bearer ${tokenPart}`;
    
    // Make the request to the Fly API
    const response = await axios.post(`${API_BASE_URL}/${pathString}`, body, {
      params: queryParams,
      headers: {
        'Authorization': formattedAuth,
        'Content-Type': 'application/json',
      },
    });
    
    console.log(`Proxy success with status: ${response.status}`);
    
    // Return the response
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('API Proxy Error:', error);
    
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
      
      return NextResponse.json(
        { error: error.message, details: error.response.data },
        { status: error.response.status }
      );
    }
    
    // Return the error with proper status code
    return NextResponse.json(
      { error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Await the params first
    const resolvedParams = await params;
    
    // Validate the path parameter
    if (!resolvedParams.path || !Array.isArray(resolvedParams.path)) {
      throw new Error('Invalid path parameter');
    }
    
    const pathString = resolvedParams.path.join('/');
    
    // Get the API token from the request header
    const authHeader = request.headers.get('Authorization') || '';
    
    if (!authHeader) {
      console.error('Missing Authorization header');
      return NextResponse.json(
        { error: 'Missing Authorization header' },
        { status: 401 }
      );
    }
    
    // Log that we're making a request (for debugging)
    console.log(`Proxying DELETE request to: ${pathString}`);
    
    // Get query parameters
    const url = new URL(request.url);
    const queryParams: Record<string, string> = {};
    
    url.searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });
    
    // Extract the token part
    const tokenPart = authHeader.replace('Bearer ', '').trim();
    // Format the authorization header correctly
    const formattedAuth = `Bearer ${tokenPart}`;
    
    // Make the request to the Fly API
    const response = await axios.delete(`${API_BASE_URL}/${pathString}`, {
      params: queryParams,
      headers: {
        'Authorization': formattedAuth,
        'Content-Type': 'application/json',
      },
    });
    
    console.log(`Proxy success with status: ${response.status}`);
    
    // Return the response
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('API Proxy Error:', error);
    
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
      
      return NextResponse.json(
        { error: error.message, details: error.response.data },
        { status: error.response.status }
      );
    }
    
    // Return the error with proper status code
    return NextResponse.json(
      { error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
} 