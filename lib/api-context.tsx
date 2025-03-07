'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import flyApi from './api-client';

interface ApiContextType {
  isAuthenticated: boolean;
  setToken: (token: string) => void;
  clearToken: () => void;
  orgSlug: string;
  setOrgSlug: (slug: string) => void;
  isLoading: boolean;
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);

export const ApiProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [orgSlug, setOrgSlug] = useState<string>('personal');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check for token in local storage on mount
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem('flyApiToken');
      if (savedToken) {
        flyApi.setAuthToken(savedToken);
        setIsAuthenticated(true);
      }
      
      const savedOrgSlug = localStorage.getItem('flyOrgSlug');
      if (savedOrgSlug) {
        setOrgSlug(savedOrgSlug);
      }
    } catch (error) {
      console.error('Error loading auth data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setToken = (token: string) => {
    try {
      localStorage.setItem('flyApiToken', token);
      flyApi.setAuthToken(token);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error setting token:', error);
    }
  };

  const clearToken = () => {
    try {
      localStorage.removeItem('flyApiToken');
      flyApi.setAuthToken('');
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error clearing token:', error);
    }
  };

  // Store orgSlug in localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem('flyOrgSlug', orgSlug);
    } catch (error) {
      console.error('Error saving org slug:', error);
    }
  }, [orgSlug]);

  const value = {
    isAuthenticated,
    setToken,
    clearToken,
    orgSlug,
    setOrgSlug,
    isLoading,
  };

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
};

export const useApi = (): ApiContextType => {
  const context = useContext(ApiContext);
  if (context === undefined) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
}; 