import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Module Registry | Juelzs',
  description: 'Comprehensive registry of development modules, UI components, and system architectures. Showcasing real production components with interactive previews and detailed documentation.',
  keywords: [
    'module registry',
    'UI components',
    'development infrastructure',
    'interactive components',
    'system architecture'
  ],
};

export default function RegistryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 