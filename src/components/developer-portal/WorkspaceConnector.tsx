import { useState } from 'react';

import { Button } from './ui/button';

export function WorkspaceConnector() {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      
      // Get available workspace
      const response = await fetch('/api/workspace/assign');
      const data = await response.json();
      
      if (!data.username) {
        throw new Error('No workspaces available');
      }

      // Launch our custom protocol with assigned workspace
      window.location.href = `connectworkspace://10.24.1.10?user=${data.username}`;
    } catch (error) {
      console.error('Failed to connect to workspace:', error);
      alert('Failed to connect to workspace. Please try again later.');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Button 
      onClick={handleConnect}
      disabled={isConnecting}
      className="bg-blue-600 hover:bg-blue-700 text-white"
    >
      {isConnecting ? 'Connecting...' : 'Connect to Workspace'}
    </Button>
  );
} 