import Link from 'next/link';
import Button from '@/components/ui/Button';

export default function ProjectNotFound() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-6">
        <div className="text-6xl mb-6">🔍</div>
        <h1 className="text-4xl font-bold mb-4">Project Not Found</h1>
        <p className="text-gray-300 mb-8">
          The project you&apos;re looking for doesn&apos;t exist or may have been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="primary" size="md">
            <Link href="/projects">View All Projects</Link>
          </Button>
          <Button variant="outline" size="md">
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
} 