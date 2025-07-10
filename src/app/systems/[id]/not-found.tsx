import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function SystemNotFound() {
  return (
    <div className="min-h-screen py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <Card className="text-center" padding="lg">
          <div className="w-24 h-24 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29.82-5.718 2.172" />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold mb-4 text-white">System Not Found</h1>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            The system you&apos;re looking for doesn&apos;t exist or may have been moved. 
            Let&apos;s get you back to exploring my other intelligent architectures.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button href="/systems" size="lg">
              View All Systems
            </Button>
            <Button href="/" variant="outline" size="lg">
              Back to Home
            </Button>
            <Button href="/contact" variant="ghost" size="lg">
              Report Issue
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
} 