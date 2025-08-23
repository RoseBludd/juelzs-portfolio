'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigation = [
  {
    name: 'Overall Analysis',
    href: '/admin/one',
    icon: '🧭',
    description: 'Comprehensive system overview'
  },
  {
    name: 'CADIS Agent',
    href: '/admin/cadis-agent',
    icon: '🤖',
    description: 'Autonomous coding agent'
  },
  {
    name: 'CADIS Tower',
    href: '/admin/cadis-tower',
    icon: '🗼',
    description: 'Tower of Babel AI ecosystem'
  },
  {
    name: 'Dashboard',
    href: '/admin',
    icon: '📊',
    description: 'Main admin dashboard'
  },
  {
    name: 'Meetings',
    href: '/admin/meetings',
    icon: '🎥',
    description: 'Meeting analysis & recordings'
  },
  {
    name: 'Projects',
    href: '/admin/projects',
    icon: '💼',
    description: 'Project management'
  },
  {
    name: 'Architecture',
    href: '/admin/architecture',
    icon: '🏗️',
    description: 'System architecture'
  },
  {
    name: 'Photos',
    href: '/admin/photos',
    icon: '📸',
    description: 'Photo management'
  },
  {
    name: 'AI Thumbnails',
    href: '/admin/thumbnails',
    icon: '🎨',
    description: 'AI-generated thumbnails'
  },
  {
    name: 'Links',
    href: '/admin/links',
    icon: '🔗',
    description: 'Link management'
  },
  {
    name: 'Journal',
    href: '/admin/journal',
    icon: '📝',
    description: 'Personal journal entries'
  },
  {
    name: 'CADIS Journal',
    href: '/admin/cadis-journal',
    icon: '🧠',
    description: 'AI intelligence insights'
  },
  {
    name: 'Cursor Chats',
    href: '/admin/cursor-chats',
    icon: '💬',
    description: 'Upload & manage chats'
  },
  {
    name: 'Calendar',
    href: '/admin/calendar',
    icon: '📅',
    description: 'Calendar & scheduling'
  },
];

const externalAdminSystems = [
  {
    name: 'Genius Game Admin',
    href: 'https://genius.vibezs.io/admin',
    icon: '🎮',
    description: 'Strategic intelligence game management',
    external: true
  },
  {
    name: 'VibezS Dev Admin',
    href: 'https://dev.juelzs.com/admin',
    icon: '⚡',
    description: 'Development platform administration',
    external: true
  }
];

export default function AdminNavigation() {
  const pathname = usePathname();

  return (
    <nav className="w-64 bg-gray-800 shadow-sm border-r border-gray-700 min-h-screen">
      <div className="p-6">
        <h2 className="text-lg font-medium text-white mb-6">
          Portfolio Management
        </h2>
        
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors group ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                  title={item.description}
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
                  <div className="flex-1">
                    <div>{item.name}</div>
                    {isActive && (
                      <div className="text-xs text-blue-200 opacity-75">{item.description}</div>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* External Admin Systems */}
        <div className="mt-8 pt-6 border-t border-gray-700">
          <h3 className="text-sm font-medium text-gray-400 mb-4 uppercase tracking-wider">
            Cross-Platform Admin
          </h3>
          <ul className="space-y-1">
            {externalAdminSystems.map((item) => (
              <li key={item.name}>
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white rounded-md transition-colors group"
                  title={item.description}
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center">
                      {item.name}
                      <span className="ml-2 text-xs text-gray-500">↗</span>
                    </div>
                  </div>
                </a>
              </li>
            ))}
          </ul>
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
  );
} 