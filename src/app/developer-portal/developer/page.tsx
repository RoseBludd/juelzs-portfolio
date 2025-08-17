'use client';

import { redirect } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DeveloperRootPage() {
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    async function checkDeveloperStatus() {
      try {
        // Get email from localStorage or session
        const email = localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail');
        
        if (!email) {
          // If no email is found, redirect to application
          redirect('/application');
          return;
        }
        
        // Check developer status
        const response = await fetch(`/api/developer/status?email=${encodeURIComponent(email)}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to check developer status');
        }
        
        // If developer is not active, redirect to assessment
        if (!data.isActive) {
          if (data.needsAssessment) {
            redirect('/application/assessment');
          } else {
            redirect('/application');
          }
        } else {
          // If developer is active, redirect to dashboard
          redirect('/developer/dashboard');
        }
      } catch (error) {
        console.error('Error checking developer status:', error);
        // On error, redirect to application
        redirect('/application');
      } finally {
        setIsLoading(false);
      }
    }
    
    checkDeveloperStatus();
  }, []);
  
  // Show loading state while checking
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }
  
  // This should never be reached due to redirects
  return null;
} 