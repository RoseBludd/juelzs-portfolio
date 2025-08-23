import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CADIS Hub - Autonomous Development Intelligence',
  description: 'CADIS autonomous development projects and implementations',
};

export default function CADISLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">
            🧠 CADIS Development Hub
          </h1>
          <p className="text-blue-200 text-lg">
            Autonomous Intelligence • Real-time Implementation • Strategic Evolution
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
