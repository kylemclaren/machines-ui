'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import flyApi from '../../lib/api-client';
import { Github, Info } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function LoginPage() {
  const [token, setToken] = useState('');
  const [orgSlug, setOrgSlug] = useState('personal');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const trimmedToken = token.trim();
    
    if (!trimmedToken) {
      setError('API token is required');
      return;
    }

    // Check if token follows one of the expected patterns
    if (!trimmedToken.startsWith('FlyV1') && !trimmedToken.startsWith('fm2_')) {
      setError('Invalid token format. Token should start with either "FlyV1" or "fm2_".');
      return; // Don't continue with invalid token
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

  // Validate token as user types
  const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setToken(value);
    
    if (!value.trim()) {
      setTokenValid(null); // No value, no validation state
      return;
    }
    
    // Check for valid token format
    setTokenValid(value.startsWith('FlyV1') || value.startsWith('fm2_'));
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
      <div className="w-full max-w-md space-y-8 bg-gray-50 dark:bg-gray-800 p-8 rounded-lg border border-gray-200 dark:border-gray-700 shadow-md">
        <div className="flex justify-center">
          {/* Logo for light mode (dark logo) */}
          <img 
            src="https://fly.io/static/images/brand/logo-portrait-dark.svg" 
            alt="Fly.io Logo" 
            className="h-[92px] dark:hidden"
          />
          {/* Logo for dark mode (light logo) */}
          <img 
            src="https://fly.io/static/images/brand/logo-portrait-light.svg" 
            alt="Fly.io Logo" 
            className="h-[92px] hidden dark:block"
          />
        </div>
        <div>
          <p className="mt-3 text-center text-base font-medium text-gray-700 dark:text-gray-300">
            Enter your API token to continue
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
                className={`mt-1 block w-full rounded-md border ${
                  tokenValid === true 
                    ? 'border-green-500 dark:border-green-700 focus:border-green-500 focus:ring-green-500/20' 
                    : tokenValid === false 
                      ? 'border-red-500 dark:border-red-700 focus:border-red-500 focus:ring-red-500/20' 
                      : 'border-gray-300 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500'
                } px-3 py-2 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-800 focus:outline-none sm:text-sm`}
                placeholder="Enter your Fly.io API token"
                value={token}
                onChange={handleTokenChange}
              />
              {tokenValid === false && (
                <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                  Token must start with "FlyV1" or "fm2_"
                </p>
              )}
              
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
                  Leave as &quot;personal&quot; for your personal organization
                </p>
              </div>
              
              <div className="mt-4 flex items-center">
                <Popover>
                  <PopoverTrigger asChild>
                    <button 
                      type="button" 
                      className="inline-flex items-center text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      <Info className="h-4 w-4 mr-1" />
                      How to get your token
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <div className="text-gray-700 dark:text-gray-300">
                      <h3 className="text-sm font-medium mb-2">To get your token:</h3>
                      <ol className="text-xs list-decimal list-inside pl-2 space-y-2">
                        <li>Download the <a href="https://fly.io/docs/flyctl/install/" target="_blank" className="text-blue-600 dark:text-blue-400 hover:underline">Fly CLI</a></li>
                        <li>Run <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">fly tokens create org</code> to create a new token</li> 
                        <li>Copy and paste the generated token that begins with either <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">FlyV1</code> or <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">fm2_</code></li>
                      </ol>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || tokenValid !== true}
              className={`group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
                (isLoading || tokenValid !== true) 
                  ? 'opacity-70 cursor-not-allowed' 
                  : 'cursor-pointer hover:bg-blue-700'
              }`}
            >
              {isLoading ? 'Authenticating...' : 'Authenticate'}
            </button>
          </div>
          <div className="text-center text-xs text-gray-500 dark:text-gray-400">
            <p>The dashboard connects to the <a href="https://fly.io/docs/machines/api/working-with-machines-api/" className="text-blue-600 dark:text-blue-400 hover:underline" target="_blank">Fly.io Machines API</a> via server-side API routes to avoid CORS issues.</p>
            <br />
            <p>Your API token is never stored on the server.</p>
          </div>
        </form>
        <div className="mt-8 text-center">
          <a 
            href="https://github.com/kylemclaren/machines-ui" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <Github className="w-3.5 h-3.5" />
            kylemclaren/machines-ui
          </a>
        </div>
      </div>
    </div>
  );
} 