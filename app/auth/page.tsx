'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import flyApi from '../../lib/api-client';

export default function LoginPage() {
  const [token, setToken] = useState('');
  const [orgSlug, setOrgSlug] = useState('personal');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const trimmedToken = token.trim();
    
    if (!trimmedToken) {
      setError('API token is required');
      return;
    }

    // Check if token follows expected pattern
    if (!trimmedToken.startsWith('FlyV1')) {
      setError('Warning: Fly.io API tokens typically start with "FlyV1". Your token may not be valid.');
      // Continue anyway as this is just a warning
    }

    try {
      setIsLoading(true);
      
      // Store the values in localStorage - strip any "Bearer " prefix if present
      const cleanToken = trimmedToken.replace(/^Bearer\s+/i, '');
      localStorage.setItem('flyApiToken', cleanToken);
      localStorage.setItem('flyOrgSlug', orgSlug);
      
      // Set the token in the API client 
      flyApi.setAuthToken(cleanToken);
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      setError('Failed to save token. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
      <div className="w-full max-w-md space-y-8 bg-gray-50 dark:bg-gray-800 p-8 rounded-lg border border-gray-200 dark:border-gray-700 shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900 dark:text-white">
            Authenticate to Fly.io
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Enter your Fly.io API token to continue
          </p>
        </div>
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 rounded-md p-4 text-sm">
            {error}
          </div>
        )}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md bg-white dark:bg-gray-800 p-6 shadow-sm space-y-6 border border-gray-100 dark:border-gray-700">
            <div>
              <label htmlFor="api-token" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                API Token
              </label>
              <input
                id="api-token"
                name="token"
                type="password"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-800 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                placeholder="Enter your Fly.io API token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
              
              <div className="mt-4">
                <label htmlFor="org-slug" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Organization Slug
                </label>
                <input
                  id="org-slug"
                  name="orgSlug"
                  type="text"
                  className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-800 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  placeholder="Enter your organization slug (default: personal)"
                  value={orgSlug}
                  onChange={(e) => setOrgSlug(e.target.value)}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Leave as &quot;personal&quot; for your personal account
                </p>
              </div>
              
              <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                <p>To get your token:</p>
                <ol className="list-decimal list-inside pl-2 space-y-1 mt-1">
                  <li>Download the <a href="https://fly.io/docs/flyctl/install/" target="_blank" className="text-blue-600 dark:text-blue-400 hover:underline">Fly CLI</a></li>
                  <li>Run <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">fly tokens create org</code> to create a new token</li> 
                  <li>Copy and paste the generated token that begins with <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">FlyV1</code></li>
                </ol>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? 'Authenticating...' : 'Authenticate'}
            </button>
          </div>
          <div className="text-center text-xs text-gray-500 dark:text-gray-400">
            <p>The dashboard connects to the <a href="https://fly.io/docs/machines/api/working-with-machines-api/" className="text-blue-600 dark:text-blue-400 hover:underline" target="_blank">Fly.io Machines API</a> via Next.js API routes to avoid CORS issues.</p>
            <br />
            <p>Your API token is never stored on the server.</p>
          </div>
        </form>
      </div>
    </div>
  );
} 