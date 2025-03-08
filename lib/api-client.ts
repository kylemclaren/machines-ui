'use client';

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import {
  App,
  ListAppsResponse,
  Machine,
  Volume,
  CreateAppRequest,
  CreateMachineRequest,
  UpdateMachineRequest,
  MachineEvent,
} from '../types/api';

// Use our Next.js API proxy to avoid CORS issues
const API_BASE_URL = '/api/proxy';

class FlyMachinesApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000, // 10 second timeout
    });

    // Add interceptor to add auth header if token is set
    this.client.interceptors.request.use((config) => {
      if (this.token) {
        // Make sure token is properly formatted with Bearer prefix
        // First, remove any existing Bearer prefix and trim whitespace
        const cleanToken = this.token.replace(/^Bearer\s+/i, '').trim();
        const tokenToUse = `Bearer ${cleanToken}`;
          
        config.headers['Authorization'] = tokenToUse;
      }
      return config;
    });

    // Add response interceptor to log responses
    this.client.interceptors.response.use(
      (response) => {
        console.log(`API response success: ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error(`API response error: ${error.config?.url}`, error);
        return Promise.reject(error);
      }
    );
    
    console.log('API client initialized to use real Fly.io API via proxy');
  }

  setAuthToken(token: string) {
    // Clean the token in case it has whitespaces or Bearer prefix
    const cleanToken = token.replace(/^Bearer\s+/i, '').trim();
    this.token = cleanToken;
    
    // Check if token starts with FlyV1 as expected
    if (!cleanToken.startsWith('FlyV1')) {
      console.warn('Warning: Fly.io tokens typically start with "FlyV1". Your token may not be valid.');
    }
  }

  // Apps
  async listApps(orgSlug: string): Promise<App[]> {
    try { 
      const response = await this.client.get<ListAppsResponse>('/apps', {
        params: { org_slug: orgSlug }
      });
      
      // Normalize the response to make sure it's safe
      let apps = response.data.apps || [];
      
      // Ensure all apps have required fields to avoid errors
      apps = apps.map(app => ({
        id: app.id || `generated-${Date.now()}`,
        name: app.name || 'Unnamed App',
        organization: app.organization || { id: 'unknown', slug: orgSlug },
        status: app.status || 'unknown'
      }));
      
      return apps;
    } catch (error) {
      this.handleError(error as AxiosError);
      
      // Return empty array on error
      return [];
    }
  }

  async getApp(appName: string): Promise<App | null> {
    try {
      const response = await this.client.get<App>(`/apps/${appName}`);
      
      // Normalize the response
      const app = response.data;
      if (!app) return null;
      
      return {
        id: app.id || `unknown-${Date.now()}`,
        name: app.name || appName,
        organization: app.organization || { id: 'unknown', slug: 'unknown' },
        status: app.status || 'unknown'
      };
    } catch (error) {
      this.handleError(error as AxiosError);
      return null;
    }
  }

  async createApp(data: CreateAppRequest): Promise<App | null> {
    try {
      console.log('Creating app with data:', data);
      // Ensure required fields are present
      if (!data.app_name) {
        console.error('app_name is required for app creation');
        return null;
      }
      if (!data.org_slug) {
        console.error('org_slug is required for app creation');
        return null;
      }
      
      const response = await this.client.post<App>('/apps', data);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
      return null;
    }
  }

  async deleteApp(appName: string): Promise<boolean> {
    try {
      await this.client.delete(`/apps/${appName}`);
      return true;
    } catch (error) {
      this.handleError(error as AxiosError);
      return false;
    }
  }

  // Machines
  async listMachines(
    appName: string, 
    options?: { includeDeleted?: boolean; region?: string; state?: string }
  ): Promise<Machine[]> {
    try {
      const response = await this.client.get<Machine[]>(`/apps/${appName}/machines`, {
        params: {
          include_deleted: options?.includeDeleted,
          region: options?.region,
          state: options?.state
        }
      });
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
      return [];
    }
  }

  async getMachine(appName: string, machineId: string): Promise<Machine | null> {
    try {
      const response = await this.client.get<Machine>(`/apps/${appName}/machines/${machineId}`);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
      return null;
    }
  }

  async createMachine(appName: string, data: CreateMachineRequest): Promise<Machine | null> {
    try {
      const response = await this.client.post<Machine>(`/apps/${appName}/machines`, data);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
      return null;
    }
  }

  async updateMachine(
    appName: string,
    machineId: string,
    data: UpdateMachineRequest
  ): Promise<Machine | null> {
    try {
      const response = await this.client.post<Machine>(
        `/apps/${appName}/machines/${machineId}`,
        data
      );
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
      return null;
    }
  }

  async deleteMachine(appName: string, machineId: string, force = false): Promise<boolean> {
    try {
      await this.client.delete(`/apps/${appName}/machines/${machineId}`, {
        params: { force }
      });
      return true;
    } catch (error) {
      this.handleError(error as AxiosError);
      return false;
    }
  }

  async startMachine(appName: string, machineId: string): Promise<boolean> {
    try {
      await this.client.post(`/apps/${appName}/machines/${machineId}/start`);
      return true;
    } catch (error) {
      this.handleError(error as AxiosError);
      return false;
    }
  }

  async stopMachine(appName: string, machineId: string): Promise<boolean> {
    try {
      await this.client.post(`/apps/${appName}/machines/${machineId}/stop`);
      return true;
    } catch (error) {
      this.handleError(error as AxiosError);
      return false;
    }
  }

  async restartMachine(appName: string, machineId: string): Promise<boolean> {
    try {
      await this.client.post(`/apps/${appName}/machines/${machineId}/restart`);
      return true;
    } catch (error) {
      this.handleError(error as AxiosError);
      return false;
    }
  }

  async getMachineEvents(appName: string, machineId: string): Promise<MachineEvent[]> {
    try {
      const response = await this.client.get<MachineEvent[]>(
        `/apps/${appName}/machines/${machineId}/events`
      );
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
      return [];
    }
  }

  // Volumes
  async listVolumes(appName: string): Promise<Volume[]> {
    try {
      const response = await this.client.get<Volume[]>(`/apps/${appName}/volumes`);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
      return [];
    }
  }

  async getVolume(appName: string, volumeId: string): Promise<Volume | null> {
    try {
      const response = await this.client.get<Volume>(`/apps/${appName}/volumes/${volumeId}`);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
      return null;
    }
  }

  private handleError(error: AxiosError): void {
    console.error('API Error:', error);
    
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      
      // If authentication error, show a message
      if (error.response.status === 401) {
        alert('Authentication failed. Please check your API token and try again.');
      } else if (error.response.status === 500) {
        console.error('Server error from proxy. Check server logs for details.');
      }
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
  }
}

// Create a singleton instance
const flyApi = new FlyMachinesApiClient();

export default flyApi; 