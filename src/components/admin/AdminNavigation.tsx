'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigation = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: '📊',
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
];

export default function AdminNavigation() {
  const pathname = usePathname();

  return (
    <nav className="w-64 bg-gray-800 shadow-sm border-r border-gray-700 min-h-screen">
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