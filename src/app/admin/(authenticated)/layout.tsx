import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import ResponsiveAdminLayout from '@/components/admin/ResponsiveAdminLayout';
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
    <ResponsiveAdminLayout>
      {children}
    </ResponsiveAdminLayout>
  );
} 