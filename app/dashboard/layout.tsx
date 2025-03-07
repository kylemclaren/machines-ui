'use client';

import React, { useEffect } from 'react';
import { ApiProvider } from '../../lib/api-context';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { QueryClient, QueryClientProvider } from 'react-query';
import { useRouter } from 'next/navigation';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();

  // Check if we need to redirect to login
  useEffect(() => {
    const token = localStorage.getItem('flyApiToken');
    if (!token) {
      router.push('/auth');
    }
  }, [router]);

  return (
    <QueryClientProvider client={queryClient}>
      <ApiProvider>
        <DashboardLayout>{children}</DashboardLayout>
      </ApiProvider>
    </QueryClientProvider>
  );
} 