'use client';

import React from 'react';
import { useQuery } from 'react-query';
import { useApi } from '../../lib/api-context';
import flyApi from '../../lib/api-client';
import Link from 'next/link';
import { TimeAgo } from "@/components/ui/time-ago";

export default function DashboardPage() {
  const { orgSlug, isAuthenticated } = useApi();

  const { data: apps, isLoading: isLoadingApps } = useQuery(
    ['apps', orgSlug],
    () => flyApi.listApps(orgSlug),
    {
      enabled: isAuthenticated,
    }
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Welcome to your Fly.io Machines Dashboard
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Apps</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Manage your Fly.io applications
          </p>
          <Link
            href="/dashboard/apps"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
          >
            View all apps &rarr;
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Machines</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Monitor and control your virtual machines
          </p>
          <Link
            href="/dashboard/machines"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
          >
            View all machines &rarr;
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Volumes</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Manage your persistent storage volumes
          </p>
          <Link
            href="/dashboard/volumes"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
          >
            View all volumes &rarr;
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Recent Apps</h2>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {isLoadingApps ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              <div className="flex justify-center items-center space-x-2">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span>Loading apps...</span>
              </div>
            </div>
          ) : apps && apps.length > 0 ? (
            apps.slice(0, 5).map((app) => (
              <div key={app.id} className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      {app.name}
                    </h3>
                  </div>
                  <Link
                    href={`/dashboard/apps/${app.name}`}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
                  >
                    View details &rarr;
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              No apps found. Create your first app to get started.
            </div>
          )}
        </div>
        {apps && apps.length > 5 && (
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
            <Link
              href="/dashboard/apps"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
            >
              View all apps &rarr;
            </Link>
          </div>
        )}
      </div>
    </div>
  );
} 