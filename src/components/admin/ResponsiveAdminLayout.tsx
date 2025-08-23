'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AdminNotifications from './AdminNotifications';

const navigation = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: '📊',
  },
  {
    name: 'Overall Analysis',
    href: '/admin/one',
    icon: '🧭',
  },
  {
    name: 'Meetings',
    href: '/admin/meetings',
    icon: '🎥',
  },
  {
    name: 'Projects',
    href: '/admin/projects',
    icon: '💼',
  },
  {
    name: 'Architecture',
    href: '/admin/architecture',
    icon: '🏗️',
  },
  {
    name: 'Photos',
    href: '/admin/photos',
    icon: '📸',
  },
  {
    name: 'AI Thumbnails',
    href: '/admin/thumbnails',
    icon: '🎨',
  },
  {
    name: 'Links',
    href: '/admin/links',
    icon: '🔗',
  },
  {
    name: 'Journal',
    href: '/admin/journal',
    icon: '📝',
  },
  {
    name: 'CADIS Journal',
    href: '/admin/cadis-journal',
    icon: '🧠',
  },
  {
    name: 'Cursor Chats',
    href: '/admin/cursor-chats',
    icon: '💬',
  },
  {
    name: 'Calendar',
    href: '/admin/calendar',
    icon: '📅',
  },
];

const crossPlatformAdmin = [
  {
    name: 'Genius Game Admin',
    href: 'https://genius.vibezs.io/admin',
    icon: '🎮',
  },
  {
    name: 'VibezS Dev Admin',
    href: 'https://dev.juelzs.com/admin',
    icon: '⚡',
  },
  {
    name: 'dev.juelzs.com',
    href: 'https://dev.juelzs.com',
    icon: '🌐',
  },
];

interface ResponsiveAdminLayoutProps {
  children: React.ReactNode;
}

export default function ResponsiveAdminLayout({ children }: ResponsiveAdminLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Get current page info for mobile header
  const currentPage = navigation.find(item => item.href === pathname) || navigation[0];

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Mobile Header */}
      <header className="lg:hidden bg-gray-800 shadow-sm border-b border-gray-700">
        <div className="px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <span className="sr-only">Open menu</span>
                {isMobileMenuOpen ? (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
              <div className="ml-3">
                <h1 className="text-lg font-semibold text-white flex items-center">
                  <span className="mr-2 text-xl">{currentPage.icon}</span>
                  {currentPage.name}
                </h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Desktop Header */}
      <header className="hidden lg:block bg-gray-800 shadow-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-white">
                Portfolio Admin
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="fixed top-0 left-0 w-80 h-full bg-gray-800 shadow-xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-medium text-white">
                  Portfolio Management
                </h2>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <ul className="space-y-2">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                          isActive
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        }`}
                      >
                        <span className="mr-3 text-lg">{item.icon}</span>
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>

              {/* Cross-Platform Admin */}
              <div className="mt-8 pt-6 border-t border-gray-700">
                <h3 className="text-sm font-medium text-gray-400 mb-3">Cross-Platform Admin</h3>
                <ul className="space-y-2">
                  {crossPlatformAdmin.map(link => (
                    <li key={link.href}>
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-700 hover:text-white"
                      >
                        <span className="mr-3 text-lg">{link.icon}</span>
                        {link.name}
                        <span className="ml-2 text-xs text-gray-400">↗</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Notifications Section */}
              <div className="mt-8 pt-6 border-t border-gray-700">
                <h3 className="text-sm font-medium text-gray-400 mb-3">Notifications</h3>
                <AdminNotifications />
              </div>

              <div className="mt-8 pt-6 border-t border-gray-700">
                <form action="/api/admin/logout" method="POST">
                  <button
                    type="submit"
                    className="flex items-center px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-900/20 hover:text-red-300 rounded-md transition-colors w-full"
                  >
                    <span className="mr-3 text-lg">🚪</span>
                    Logout
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex">
        {/* Desktop Sidebar Navigation */}
        <nav className="hidden lg:block w-64 bg-gray-800 shadow-sm border-r border-gray-700 min-h-screen">
          <div className="p-6">
            <h2 className="text-lg font-medium text-white mb-6">
              Portfolio Management
            </h2>
            
            <ul className="space-y-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`}
                    >
                      <span className="mr-3 text-lg">{item.icon}</span>
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* Cross-Platform Admin */}
            <div className="mt-8 pt-6 border-t border-gray-700">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Cross-Platform Admin</h3>
              <ul className="space-y-2">
                {crossPlatformAdmin.map(link => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                      <span className="mr-3 text-lg">{link.icon}</span>
                      {link.name}
                      <span className="ml-2 text-xs text-gray-400">↗</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Notifications Section */}
            <div className="mt-8 pt-6 border-t border-gray-700">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Notifications</h3>
              <AdminNotifications />
            </div>

            <div className="mt-8 pt-6 border-t border-gray-700">
              <form action="/api/admin/logout" method="POST">
                <button
                  type="submit"
                  className="flex items-center px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-900/20 hover:text-red-300 rounded-md transition-colors w-full"
                >
                  <span className="mr-3 text-lg">🚪</span>
                  Logout
                </button>
              </form>
            </div>
          </div>
        </nav>
        
        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-gray-900 text-gray-100">
          {children}
        </main>
      </div>
    </div>
  );
}