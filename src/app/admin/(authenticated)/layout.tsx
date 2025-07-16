import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import AdminNavigation from '@/components/admin/AdminNavigation';
import { checkAdminAuth } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Admin Dashboard | Juelzs Portfolio',
  description: 'Administrative interface for managing portfolio content',
};

export default async function AuthenticatedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check authentication for protected admin routes
  const isAuthenticated = await checkAdminAuth();
  if (!isAuthenticated) {
    redirect('/admin/login');
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Admin Header */}
      <header className="bg-gray-800 shadow-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-white">
                Portfolio Admin
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                View Site
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <AdminNavigation />
        
        {/* Main Content */}
        <main className="flex-1 p-8 bg-gray-900 text-gray-100">
          {children}
        </main>
      </div>
    </div>
  );
} 