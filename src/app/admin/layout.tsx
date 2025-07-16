import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin | Juelzs Portfolio',
  description: 'Administrative interface for managing portfolio content',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout applies to all admin routes but doesn't do auth checks
  // Auth checks are handled in the (authenticated) sub-layout
  return children;
} 