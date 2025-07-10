'use client';

import { useEffect, useState } from 'react';

interface InitializationStatus {
  initialized: boolean;
  loading: boolean;
  error: string | null;
  syncStatus: {
    lastSync: Date | null;
    githubProjects: number;
    s3Meetings: number;
    nextSync: Date | null;
  } | null;
}

export default function AppInitializer() {
  const [status, setStatus] = useState<InitializationStatus>({
    initialized: false,
    loading: true,
    error: null,
    syncStatus: null
  });

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Only do client-side initialization - no server-side service imports
        console.log('Application client initialization complete');
        
        setStatus({
          initialized: true,
          loading: false,
          error: null,
          syncStatus: {
            lastSync: new Date(),
            githubProjects: 0,
            s3Meetings: 0,
            nextSync: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes from now
          }
        });

        // Optional: Call health check API endpoint instead of importing services
        if (process.env.NODE_ENV === 'development') {
          try {
            const response = await fetch('/api/registry');
            if (response.ok) {
              const data = await response.json();
              console.log('Registry API available:', data.success);
            }
          } catch (error) {
            console.log('Registry API check failed (this is normal):', error);
          }
        }
        
      } catch (error) {
        console.error('Failed to initialize application:', error);
        setStatus({
          initialized: false,
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          syncStatus: null
        });
      }
    };

    initializeApp();
  }, []);

  // Don't render anything - this is just for initialization
  // In development, you might want to show a debug panel
  if (process.env.NODE_ENV === 'development' && status.loading) {
    return (
      <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-3 rounded-lg shadow-lg z-50 text-sm">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          <span>Initializing client...</span>
        </div>
      </div>
    );
  }

  if (process.env.NODE_ENV === 'development' && status.error) {
    return (
      <div className="fixed bottom-4 right-4 bg-red-800 text-white p-3 rounded-lg shadow-lg z-50 text-sm max-w-xs">
        <div className="font-bold">Client Error</div>
        <div className="text-red-200">{status.error}</div>
      </div>
    );
  }

  // Development status badge removed per user request

  return null;
} 