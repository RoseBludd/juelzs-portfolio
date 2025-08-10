'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import SimpleVideoThumbnail from '@/components/ui/SimpleVideoThumbnail';

interface ThumbnailOption {
  optionNumber: number;
  s3Url: string;
  combinedScore: number;
  aiScore: number | null;
  pixelScore: number;
  seekTime: number;
  fileSize: number;
  isRecommended: boolean;
  aiInsight: string | null;
  aiImprovements: string | null;
  selectionCommand: string;
}

interface VideoResult {
  videoNumber: number;
  videoKey: string;
  videoContext: string;
  bestScore: number;
  totalCandidates: number;
  options: ThumbnailOption[];
}

interface ShowcasedThumbnails {
  videoKey: string;
  videoContext: string;
  selectedOption: number;
  options: ThumbnailOption[];
  lastGenerated: Date;
  lastUpdated: Date;
}

interface GenerationResults {
  success: boolean;
  totalVideos: number;
  totalOptions: number;
  clickableResults: VideoResult[];
}

export default function ThumbnailsPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<GenerationResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedThumbnails, setSelectedThumbnails] = useState<{[key: string]: number}>({});
  const [videoCount, setVideoCount] = useState<number>(0);
  const [showcasedThumbnails, setShowcasedThumbnails] = useState<ShowcasedThumbnails[]>([]);
  const [isLoadingShowcased, setIsLoadingShowcased] = useState(false);

  // Auto-load existing results and video count when component mounts
  useEffect(() => {
    loadResults();
    loadVideoCount();
    loadShowcasedThumbnails();
  }, []);

  const loadVideoCount = async () => {
    try {
      const response = await fetch('/api/leadership-videos');
      if (response.ok) {
        const data = await response.json();
        setVideoCount(data.count || data.videos?.length || 0);
      }
    } catch (error) {
      console.warn('Failed to load video count:', error);
    }
  };

  const loadShowcasedThumbnails = async () => {
    setIsLoadingShowcased(true);
    try {
      const response = await fetch('/api/showcased-thumbnails');
      if (response.ok) {
        const data = await response.json();
        setShowcasedThumbnails(data.showcasedThumbnails || []);
      }
    } catch (error) {
      console.warn('Failed to load showcased thumbnails:', error);
    } finally {
      setIsLoadingShowcased(false);
    }
  };

  const updateShowcasedSelection = async (videoKey: string, optionNumber: number) => {
    try {
      const response = await fetch('/api/showcased-thumbnails', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoKey, optionNumber })
      });

      if (response.ok) {
        // Reload showcased thumbnails to reflect the change
        await loadShowcasedThumbnails();
      } else {
        console.error('Failed to update showcased thumbnail selection');
      }
    } catch (error) {
      console.error('Error updating showcased thumbnail:', error);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setResults(null);

    try {
      console.log('🚀 Starting comprehensive AI thumbnail generation...');
      
      // Step 1: Get leadership videos
      const videosResponse = await fetch('/api/leadership-videos');
      if (!videosResponse.ok) {
        throw new Error('Failed to fetch leadership videos');
      }
      
      const videosData = await videosResponse.json();
      if (!videosData.success) {
        throw new Error(videosData.error || 'Failed to get leadership videos');
      }

      const availableVideos = videosData.videos.filter((video: any) => video.videoAvailable);
      console.log(`📊 Found ${availableVideos.length} videos with video URLs`);

      if (availableVideos.length === 0) {
        throw new Error('No leadership videos found with video URLs available');
      }

      // Step 2: Generate thumbnails
      const videoKeys = availableVideos.map((v: any) => v.id);
      const contexts = availableVideos.map((v: any) => v.context);

      console.log('📡 Calling comprehensive thumbnails API...');
      const generateResponse = await fetch('/api/admin/comprehensive-thumbnails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoKeys, contexts })
      });

      if (!generateResponse.ok) {
        const errorText = await generateResponse.text();
        throw new Error(`Generation failed: ${generateResponse.status} ${generateResponse.statusText}\n${errorText}`);
      }

      const generateResult = await generateResponse.json();
      console.log('✅ Generation complete:', generateResult);

      // Step 3: Get formatted results
      await loadResults();

    } catch (err) {
      console.error('❌ Generation error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const loadResults = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/comprehensive-thumbnails');
      if (!response.ok) {
        throw new Error('Failed to load results');
      }
      
      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load results');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectThumbnail = async (videoNumber: number, optionNumber: number) => {
    try {
      const response = await fetch('/api/admin/comprehensive-thumbnails', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoNumber, optionNumber })
      });

      if (!response.ok) {
        throw new Error('Failed to select thumbnail');
      }

      setSelectedThumbnails(prev => ({
        ...prev,
        [videoNumber]: optionNumber
      }));

      console.log(`✅ Selected option ${optionNumber} for video ${videoNumber}`);
    } catch (err) {
      console.error('❌ Selection error:', err);
      setError(err instanceof Error ? err.message : 'Failed to select thumbnail');
    }
  };

  return (
    <div className="space-y-6">
      {/* Showcased Video Thumbnails Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Showcased Video Thumbnails</h2>
        
        {/* Generator Component */}
        <div className="mb-8">
          <ShowcasedThumbnailGenerator onGenerationComplete={loadShowcasedThumbnails} />
        </div>

        {/* Showcased Thumbnails Display */}
        {isLoadingShowcased ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading showcased thumbnails...</p>
          </div>
        ) : showcasedThumbnails.length > 0 ? (
          <div className="space-y-8">
            {showcasedThumbnails.map((video) => (
              <div key={video.videoKey} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {video.videoKey.replace('s3-_Private__Google_Meet_Call_', '').replace(/_/g, ' ')}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">{video.videoContext}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Selected: Option {video.selectedOption}</span>
                    <span>•</span>
                    <span>{video.options.length} options available</span>
                    <span>•</span>
                    <span>Generated: {new Date(video.lastGenerated).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {video.options.slice(0, 10).map((option) => (
                    <div 
                      key={option.optionNumber}
                      className={`relative bg-white rounded-lg border-2 transition-all shadow-sm ${
                        option.optionNumber === video.selectedOption
                          ? 'border-blue-500 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="aspect-video rounded-t-lg overflow-hidden">
                        <img
                          src={option.s3Url}
                          alt={`Option ${option.optionNumber}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <div className="p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-900">
                            Option {option.optionNumber}
                          </span>
                          <span className="text-xs text-green-600 font-medium">
                            {option.combinedScore.toFixed(0)}
                          </span>
                        </div>
                        
                        <div className="text-xs text-gray-500">
                          <div>Seek: {option.seekTime}s</div>
                          <div>AI: {option.aiScore.toFixed(0)} | Pixel: {option.pixelScore.toFixed(0)}</div>
                          {option.isRecommended && (
                            <div className="text-yellow-600">⭐ Recommended</div>
                          )}
                        </div>

                        <button
                          onClick={() => updateShowcasedSelection(video.videoKey, option.optionNumber)}
                          disabled={option.optionNumber === video.selectedOption}
                          className={`w-full text-xs py-1.5 px-2 rounded transition-colors font-medium ${
                            option.optionNumber === video.selectedOption
                              ? 'bg-blue-600 text-white cursor-default'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {option.optionNumber === video.selectedOption ? 'Selected' : 'Select'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-8 text-center border border-gray-200">
            <p className="text-gray-600 mb-4">No showcased thumbnails generated yet.</p>
            <p className="text-sm text-gray-500">Use the generator above to create AI-analyzed thumbnails for showcased videos.</p>
          </div>
        )}
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Legacy Thumbnail Generation</h1>
            <p className="text-gray-600 mt-1">
              Generate professional AI-analyzed thumbnails for leadership videos
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              variant="primary"
            >
              {isGenerating ? '🤖 Generating...' : '🎨 Generate Thumbnails'}
            </Button>
            
            {results && (
              <Button
                onClick={loadResults}
                disabled={isLoading}
                variant="outline"
              >
                {isLoading ? '📡 Loading...' : '🔄 Refresh Results'}
              </Button>
            )}
          </div>
        </div>

        {/* Generation Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-blue-900 mb-2">🎯 What This Does:</h3>
                     <ul className="text-sm text-blue-800 space-y-1">
             <li>• Processes your {videoCount} leadership videos displayed on the portfolio</li>
             <li>• Generates 10 thumbnail candidates per video ({videoCount * 10} total)</li>
            <li>• Uses AI analysis to score each thumbnail for professional impact</li>
            <li>• Provides clickable S3 URLs for immediate preview</li>
            <li>• Offers easy selection commands for your preferred thumbnails</li>
          </ul>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-red-900 mb-2">❌ Error:</h3>
            <pre className="text-sm text-red-800 whitespace-pre-wrap">{error}</pre>
          </div>
        )}

        {/* Results Display */}
        {results && (
          <div className="space-y-8">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-medium text-green-900 mb-2">🎉 Generation Complete!</h3>
              <div className="text-sm text-green-800 space-y-1">
                <p>✅ Videos Processed: {results.totalVideos}</p>
                <p>✅ Options Generated: {results.totalOptions}</p>
                <p>✅ AI Analysis: Complete for all options</p>
                <p>✅ Ready for selection</p>
              </div>
            </div>

            {/* Video Results */}
            {results.clickableResults.map((video) => (
              <div key={video.videoNumber} className="border border-gray-200 rounded-lg p-6">
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    🎬 Video {video.videoNumber}: {video.videoKey.substring(0, 50)}...
                  </h2>
                  <p className="text-gray-600 text-sm mb-2">{video.videoContext.substring(0, 200)}...</p>
                  <div className="flex gap-4 text-sm text-gray-500">
                    <span>🏆 Best Score: {video.bestScore.toFixed(1)}/100</span>
                    <span>📊 Total Options: {video.totalCandidates}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {video.options.slice(0, 6).map((option) => (
                    <div
                      key={option.optionNumber}
                      className={`border rounded-lg p-4 ${
                        selectedThumbnails[video.videoNumber] === option.optionNumber
                          ? 'border-blue-500 bg-blue-50'
                          : option.isRecommended
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">
                          Option {option.optionNumber}
                          {option.isRecommended && ' ⭐'}
                          {selectedThumbnails[video.videoNumber] === option.optionNumber && ' ✅'}
                        </span>
                        <span className="text-sm text-gray-500">
                          {option.combinedScore.toFixed(1)}/100
                        </span>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div>
                          <a
                            href={option.s3Url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline block truncate"
                          >
                            🔗 Preview Thumbnail
                          </a>
                        </div>
                        
                        <div className="text-gray-600">
                          <p>⏱️ {option.seekTime}s | 📁 {option.fileSize}KB</p>
                          <p>🤖 AI: {option.aiScore || 'N/A'} | 📊 Pixel: {option.pixelScore.toFixed(1)}</p>
                        </div>

                        {option.aiInsight && (
                          <p className="text-green-700 text-xs">💡 {option.aiInsight}</p>
                        )}

                        {option.aiImprovements && (
                          <p className="text-orange-700 text-xs">📝 {option.aiImprovements}</p>
                        )}

                        <Button
                          onClick={() => handleSelectThumbnail(video.videoNumber, option.optionNumber)}
                          size="sm"
                          variant={selectedThumbnails[video.videoNumber] === option.optionNumber ? "primary" : "outline"}
                          className="w-full mt-2"
                        >
                          {selectedThumbnails[video.videoNumber] === option.optionNumber ? '✅ Selected' : '🎯 Select'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {video.options.length > 6 && (
                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-500">
                      Showing top 6 options. Total: {video.options.length}
                    </p>
                  </div>
                )}
              </div>
            ))}

            {/* Summary */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="font-medium text-gray-900 mb-4">📊 Selection Summary</h3>
              <div className="space-y-2 text-sm">
                {results.clickableResults.map((video) => (
                  <div key={video.videoNumber} className="flex justify-between">
                    <span>Video {video.videoNumber}:</span>
                    <span className={selectedThumbnails[video.videoNumber] ? 'text-green-600' : 'text-gray-500'}>
                      {selectedThumbnails[video.videoNumber] 
                        ? `✅ Option ${selectedThumbnails[video.videoNumber]} selected`
                        : '⏳ No selection yet'
                      }
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 