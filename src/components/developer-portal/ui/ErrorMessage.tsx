import { useRouter } from "next/navigation";

interface ErrorMessageProps {
  title?: string;
  message: string;
  showBackButton?: boolean;
  backUrl?: string;
}

export const ErrorMessage = ({ 
  title = "Error", 
  message, 
  showBackButton = true,
  backUrl = "/dashboard"
}: ErrorMessageProps) => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-900 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
        <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 sm:p-6 text-red-200">
          <h2 className="text-xl font-semibold mb-2">{title}</h2>
          <p className="mb-4 leading-relaxed">{message}</p>
          {showBackButton && (
            <button
              onClick={() => router.push(backUrl)}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-md text-white transition-colors"
            >
              Return to Dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  );
}; 