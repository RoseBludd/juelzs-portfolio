"use client";

import { IconBell, IconCheck } from '@tabler/icons-react';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback, useRef } from 'react';

interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: 'assessment' | 'milestone' | 'task' | 'developer' | 'system';
  priority: 'low' | 'medium' | 'high';
  date: Date | null;
  read: boolean | null;
  actionUrl?: string;
  actionLabel?: string;
}

export default function AdminNotifications() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch session data
  useEffect(() => {
    async function checkSession() {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          setSession({ user: userData });
        } else {
          router.push('/auth/signin');
        }
      } catch (error) {
        console.error('Error checking session:', error);
        router.push('/auth/signin');
      }
    }
    
    checkSession();
  }, [router]);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/admin/notifications');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.statusText}`);
      }
      
      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format');
      }
      
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    const interval = setInterval(fetchNotifications, 60 * 1000); // Poll every 1 minute instead of 5
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification: AdminNotification, event: React.MouseEvent) => {
    try {
      // Prevent event from bubbling to parent elements
      event.stopPropagation();
      
      // Mark notification as read
      if (!notification.read) {
        const response = await fetch(`/api/admin/notifications/${notification.id}`, {
          method: 'PATCH',
        });
        
        if (response.ok) {
          // Update local state to mark as read
          setNotifications(prev => 
            prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
          );
          setUnreadCount(prev => prev - 1);
        }
      }
      
      // Navigate to the action URL if available
      if (notification.actionUrl) {
        setIsOpen(false); // Close dropdown before navigation
        router.push(notification.actionUrl);
      }
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  const handleMarkAllAsRead = async (event: React.MouseEvent) => {
    try {
      // Prevent event from bubbling to parent elements
      event.stopPropagation();
      
      const response = await fetch('/api/admin/notifications/mark-all-read', {
        method: 'POST',
      });
      
      if (response.ok) {
        // Update all notifications to read in local state
        setNotifications(prev => 
          prev.map(n => ({ ...n, read: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
          isOpen
            ? "bg-indigo-500/20 text-indigo-300 shadow-lg shadow-indigo-500/10 border border-indigo-500/30"
            : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 border border-transparent"
        }`}
        title="Notifications"
      >
        <IconBell className="w-5 h-5" strokeWidth={1.5} />
        {unreadCount > 0 && (
          <span className="ml-1.5 bg-indigo-500 text-white text-xs rounded-full min-w-[20px] h-[20px] flex items-center justify-center px-1">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-96 bg-gray-900/95 rounded-lg shadow-xl border border-gray-800 backdrop-blur-sm z-50">
          <div className="p-2 border-b border-gray-800 flex items-center justify-between">
            <h3 className="text-sm font-medium text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={(e) => handleMarkAllAsRead(e)}
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>
          
          {loading ? (
            <div className="p-2 space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="animate-pulse flex gap-2">
                  <div className="h-2 bg-gray-800 rounded w-1/4"></div>
                  <div className="h-2 bg-gray-800 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-2 text-xs text-red-400">
              {error}
              <button
                onClick={fetchNotifications}
                className="ml-2 text-blue-400 hover:text-blue-300"
              >
                Retry
              </button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-2 text-xs text-gray-400 text-center">
              No new notifications
            </div>
          ) : (
            <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={(e) => handleNotificationClick(notification, e)}
                  className={`p-2 hover:bg-gray-800/50 transition-colors flex items-start gap-2 border-l-2 ${
                    notification.read ? 'border-transparent' : 'border-indigo-500'
                  } cursor-pointer`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">
                      {notification.title}
                      {!notification.read && (
                        <span className="ml-1.5 inline-block w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-gray-500">
                        {notification.date && formatDistanceToNow(new Date(notification.date), { addSuffix: true })}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-gray-800 rounded text-gray-400">
                        {notification.type}
                      </span>
                      {notification.actionUrl && (
                        <span className="text-[10px] text-indigo-400">
                          {notification.actionLabel || 'View Details'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 