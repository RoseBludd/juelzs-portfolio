'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Global keyboard shortcut component for admin access
 * Ctrl+Shift+A -> Navigate to admin login/dashboard
 */
export default function AdminKeyboardShortcut() {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Ctrl+Shift+A (or Cmd+Shift+A on Mac)
      if (
        (event.ctrlKey || event.metaKey) && 
        event.shiftKey && 
        event.key.toLowerCase() === 'a'
      ) {
        event.preventDefault();
        
        // Navigate to admin - this will handle authentication redirect automatically
        router.push('/admin');
        
        // Optional: Show a brief indicator that the shortcut was triggered
        const indicator = document.createElement('div');
        indicator.textContent = '🚀 Accessing Admin...';
        indicator.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: rgba(59, 130, 246, 0.9);
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          z-index: 10000;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          animation: slideInRight 0.3s ease-out;
        `;
        
        // Add animation keyframes if not already present
        if (!document.querySelector('#admin-shortcut-styles')) {
          const style = document.createElement('style');
          style.id = 'admin-shortcut-styles';
          style.textContent = `
            @keyframes slideInRight {
              from {
                transform: translateX(100%);
                opacity: 0;
              }
              to {
                transform: translateX(0);
                opacity: 1;
              }
            }
            @keyframes fadeOut {
              from {
                opacity: 1;
              }
              to {
                opacity: 0;
                transform: translateX(100%);
              }
            }
          `;
          document.head.appendChild(style);
        }
        
        document.body.appendChild(indicator);
        
        // Remove indicator after 2 seconds
        setTimeout(() => {
          if (indicator.parentNode) {
            indicator.style.animation = 'fadeOut 0.3s ease-in';
            setTimeout(() => {
              if (indicator.parentNode) {
                indicator.parentNode.removeChild(indicator);
              }
            }, 300);
          }
        }, 2000);
      }
    };

    // Add event listener
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [router]);

  return null; // This component doesn't render anything visible
}
