'use client';

import { useState, useEffect, useRef } from 'react';
import Button from '@/components/ui/Button';
import { AdminNotification } from '@/services/scheduled-tasks.service';

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [modalPosition, setModalPosition] = useState({ 
    left: false, 
    right: true, 
    hasVerticalSpace: true 
  });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadNotifications();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/admin/notifications');
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setNotifications(data.notifications || []);
        }
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notificationId })
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    const icons = {
      'info': '💡',
      'success': '✅',
      'warning': '⚠️',
      'error': '❌'
    };
    return icons[type as keyof typeof icons] || '📢';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      'low': 'border-gray-500',
      'medium': 'border-blue-500',
      'high': 'border-orange-500',
      'urgent': 'border-red-500'
    };
    return colors[priority as keyof typeof colors] || 'border-gray-500';
  };

  const calculateOptimalPosition = () => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const modalWidth = 384; // w-96 = 24rem = 384px
    const modalHeight = 384; // max-h-96 = 24rem = 384px
    
    // Check if we're on mobile
    const isMobile = viewportWidth < 640; // sm breakpoint
    
    if (isMobile) {
      // On mobile, position centrally
      setModalPosition({
        left: false,
        right: false,
        hasVerticalSpace: true
      });
      return;
    }
    
    // Check available space on both sides
    const spaceOnRight = viewportWidth - rect.right;
    const spaceOnLeft = rect.left;
    const spaceBelow = viewportHeight - rect.bottom;
    
    // Prefer right positioning, but switch to left if not enough space
    // Also ensure there's enough vertical space
    const shouldPositionLeft = spaceOnRight < modalWidth && spaceOnLeft > modalWidth;
    const hasEnoughVerticalSpace = spaceBelow > Math.min(modalHeight, 200);
    
    setModalPosition({
      left: shouldPositionLeft,
      right: !shouldPositionLeft,
      hasVerticalSpace: hasEnoughVerticalSpace
    });
  };

  const handleToggle = () => {
    if (!isOpen) {
      calculateOptimalPosition();
    }
    setIsOpen(!isOpen);
  };

  // Recalculate position on window resize
  useEffect(() => {
    const handleResize = () => {
      if (isOpen) {
        calculateOptimalPosition();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen]);

  // Handle click outside to close modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const unreadCount = notifications.length;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-25 z-40 sm:hidden" />
      )}
      
      <div className="relative" ref={containerRef}>
        {/* Notification Bell */}
        <button
          onClick={handleToggle}
          className="relative p-2 text-gray-300 hover:text-white transition-colors"
        >
          <span className="text-xl">🔔</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Notifications Dropdown */}
        {isOpen && (
        <div className={`absolute bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 overflow-y-auto transition-all duration-200 ${
          // Positioning logic
          modalPosition.left ? 'right-full mr-2 top-0' : 
          modalPosition.right ? 'left-0 top-full mt-2' :
          'left-1/2 transform -translate-x-1/2 top-full mt-2'
        } ${
          // Responsive sizing
          'w-80 sm:w-96 max-w-[calc(100vw-2rem)]'
        } ${
          // Height constraints
          modalPosition.hasVerticalSpace ? 'max-h-96' : 'max-h-64'
        } ${
          // Mobile adjustments - position as overlay on very small screens
          'sm:relative sm:transform-none'
        }`}>
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Notifications</h3>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                ✕
              </Button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-400">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-400">
                No new notifications
              </div>
            ) : (
              <div className="divide-y divide-gray-700">
                {notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`p-4 border-l-4 ${getPriorityColor(notification.priority)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <span className="text-xl">
                          {getNotificationIcon(notification.type)}
                        </span>
                        <div className="flex-1">
                          <h4 className="text-white font-medium">
                            {notification.title}
                          </h4>
                          <p className="text-gray-300 text-sm mt-1">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-xs text-gray-500">
                              {new Date(notification.createdAt).toLocaleString()}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              notification.priority === 'urgent' ? 'bg-red-600/20 text-red-300' :
                              notification.priority === 'high' ? 'bg-orange-600/20 text-orange-300' :
                              notification.priority === 'medium' ? 'bg-blue-600/20 text-blue-300' :
                              'bg-gray-600/20 text-gray-300'
                            }`}>
                              {notification.priority}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="text-gray-400 hover:text-white text-sm ml-2"
                      >
                        ✕
                      </button>
                    </div>
                    
                    {notification.actionUrl && notification.actionLabel && (
                      <div className="mt-3 pt-3 border-t border-gray-700">
                        <a
                          href={notification.actionUrl}
                          onClick={() => {
                            markAsRead(notification.id);
                            setIsOpen(false);
                          }}
                          className="inline-flex items-center text-blue-400 hover:text-blue-300 text-sm"
                        >
                          {notification.actionLabel} →
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-4 border-t border-gray-700">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  notifications.forEach(n => markAsRead(n.id));
                }}
                className="w-full"
              >
                Mark All as Read
              </Button>
            </div>
          )}
        </div>
        )}
      </div>
    </>
  );
}
