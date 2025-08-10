export default function LeadershipLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Header */}
      <div className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Profile Placeholder */}
            <div className="flex justify-center mb-8">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 animate-pulse"></div>
            </div>
            
            {/* Title Placeholder */}
            <div className="mb-6">
              <div className="h-12 bg-gradient-to-r from-gray-700/50 to-gray-600/50 rounded-lg w-96 mx-auto animate-pulse"></div>
            </div>
            
            {/* Description Placeholder */}
            <div className="space-y-3 max-w-4xl mx-auto">
              <div className="h-4 bg-gray-700/30 rounded w-3/4 mx-auto animate-pulse"></div>
              <div className="h-4 bg-gray-700/30 rounded w-1/2 mx-auto animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Loading Animation */}
        <div className="text-center mb-12">
          <div className="relative w-20 h-20 mx-auto mb-6">
            {/* Outer Ring */}
            <div className="absolute inset-0 rounded-full border-4 border-purple-500/30"></div>
            {/* Spinning Ring */}
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 border-r-blue-500 animate-spin"></div>
            {/* Inner Glow */}
            <div className="absolute inset-2 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 blur-sm"></div>
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-3">Loading Leadership Sessions</h2>
          <p className="text-gray-300 mb-6">
            Analyzing video content and generating real thumbnails...
          </p>
          
          {/* Progress Steps */}
          <div className="flex justify-center space-x-8 text-sm">
            <div className="flex items-center text-blue-400">
              <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></div>
              Fetching videos from S3
            </div>
            <div className="flex items-center text-purple-400">
              <div className="w-2 h-2 bg-purple-400 rounded-full mr-2 animate-pulse"></div>
              Loading AI analysis
            </div>
            <div className="flex items-center text-green-400">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
              Generating thumbnails
            </div>
          </div>
        </div>

        {/* Skeleton Video Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="bg-gray-800/50 rounded-xl overflow-hidden border border-gray-700/50">
              {/* Thumbnail Skeleton */}
              <div className="aspect-video bg-gradient-to-br from-gray-700/30 to-gray-800/30 relative">
                <div className="absolute inset-0 bg-gray-700/20 animate-pulse"></div>
                {/* Play button placeholder */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 bg-gray-600/30 rounded-full flex items-center justify-center">
                    <div className="w-6 h-6 bg-gray-500/50 rounded"></div>
                  </div>
                </div>
              </div>
              
              {/* Content Skeleton */}
              <div className="p-6">
                {/* Title */}
                <div className="h-5 bg-gray-700/40 rounded w-3/4 mb-3 animate-pulse"></div>
                {/* Metadata */}
                <div className="flex space-x-4 mb-4">
                  <div className="h-3 bg-gray-700/30 rounded w-20 animate-pulse"></div>
                  <div className="h-3 bg-gray-700/30 rounded w-16 animate-pulse"></div>
                </div>
                {/* Description */}
                <div className="space-y-2 mb-4">
                  <div className="h-3 bg-gray-700/30 rounded w-full animate-pulse"></div>
                  <div className="h-3 bg-gray-700/30 rounded w-2/3 animate-pulse"></div>
                </div>
                {/* Tags */}
                <div className="flex space-x-2 mb-4">
                  <div className="h-6 bg-gray-700/30 rounded-full w-16 animate-pulse"></div>
                  <div className="h-6 bg-gray-700/30 rounded-full w-20 animate-pulse"></div>
                </div>
                {/* Button */}
                <div className="h-10 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Loading Tips */}
        <div className="mt-16 text-center">
          <div className="max-w-2xl mx-auto bg-gray-800/30 rounded-xl p-8 border border-gray-700/50">
            <h3 className="text-lg font-medium text-white mb-4">While you wait...</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-300">
              <div className="text-center">
                <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-blue-400">🎬</span>
                </div>
                <p>Real video thumbnails are generated from actual footage</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-purple-400">🤖</span>
                </div>
                <p>AI analyzes each session for key leadership moments</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-green-400">⚡</span>
                </div>
                <p>Enhanced video player with timeline navigation</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 