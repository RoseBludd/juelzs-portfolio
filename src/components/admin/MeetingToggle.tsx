'use client';

import { useState } from 'react';

interface MeetingToggleProps {
  meetingId: string;
  isRelevant: boolean;
  onToggleComplete?: () => void;
}

export default function MeetingToggle({ meetingId, isRelevant, onToggleComplete }: MeetingToggleProps) {
  const [isToggled, setIsToggled] = useState(isRelevant);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      const newState = !isToggled;
      
      const response = await fetch('/api/admin/meetings/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          meetingId, 
          isRelevant: newState,
          showcaseDescription: newState ? 'Featured in portfolio showcase' : undefined
        })
      });

      const data = await response.json();

      if (response.ok) {
        setIsToggled(newState);
        console.log(`✅ ${data.message}`);
        
        // Clear leadership page cache when toggling portfolio relevance
        if (newState) {
          try {
            await fetch('/api/leadership/clear-cache', { method: 'POST' });
            console.log('🗑️ Cleared leadership page cache');
          } catch (error) {
            console.log('⚠️ Could not clear leadership cache:', error);
          }
        }
        
        onToggleComplete?.();
      } else {
        throw new Error(data.error || 'Failed to update meeting relevance');
      }
      
    } catch (error) {
      console.error('Error toggling meeting relevance:', error);
      // Revert on error
      setIsToggled(isToggled);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        isToggled 
          ? 'bg-green-600' 
          : 'bg-gray-200'
      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={isToggled ? 'Hide from portfolio' : 'Show in portfolio'}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          isToggled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
      <span className="sr-only">
        {isToggled ? 'Remove from portfolio' : 'Add to portfolio'}
      </span>
    </button>
  );
} 