'use client';

import { useState, useEffect } from 'react';
import SimpleVideoThumbnail from '@/components/ui/SimpleVideoThumbnail';

interface TestVideo {
  id: string;
  title: string;
  videoUrl?: string;
  videoAvailable: boolean;
}

export default function ThumbnailTestPage() {
  const [videos, setVideos] = useState<TestVideo[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<TestVideo | null>(null);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      console.log('🔍 Loading videos for thumbnail testing...');
      const response = await fetch('/api/leadership-videos');
      const data = await response.json();
      
      if (data.success) {
        const availableVideos = data.videos.filter((v: TestVideo) => v.videoAvailable);
        setVideos(availableVideos);
        // Auto-select the first video
        if (availableVideos.length > 0) {
          setSelectedVideo(availableVideos[0]);
        }
        console.log(`✅ Loaded ${availableVideos.length} videos for testing`);
      } else {
        throw new Error(data.error || 'Failed to load videos');
      }
    } catch (err) {
      console.error('❌ Error loading videos:', err);
      setError(err instanceof Error ? err.message : 'Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  // Fetch video URL whenever selection changes
  useEffect(() => {
    const fetchUrl = async () => {
      if (!selectedVideo) {
        setSelectedVideoUrl(null);
        return;
      }
      try {
        const url = await getVideoUrl(selectedVideo.id);
        setSelectedVideoUrl(url);
      } catch (e) {
        console.warn('Failed to fetch video URL', e);
        setSelectedVideoUrl(null);
      }
    };
    fetchUrl();
  }, [selectedVideo]);

  const getVideoUrl = async (videoId: string): Promise<string> => {
    const response = await fetch(`/api/video/${videoId}/url`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to get video URL');
    }
    
    return data.url;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading videos for testing...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-red-600">
          <h2 className="text-xl font-bold mb-2">Error Loading Videos</h2>
          <p>{error}</p>
          <button 
            onClick={loadVideos}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🧪 Thumbnail Generation Test Page
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">📋 Test Instructions</h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 mb-2">
              <strong>🎯 What This Tests:</strong> Real client-side thumbnail generation with GPT Vision AI analysis
            </p>
            <ul className="list-disc list-inside text-blue-700 space-y-1 text-sm">
              <li>Browser loads video and takes 10 screenshots</li>
              <li>Analyzes each frame for brightness, contrast, sharpness</li>
              <li>Sends best frames to GPT Vision for content analysis</li>
              <li>Combines pixel analysis (40%) + AI analysis (60%)</li>
              <li>Uploads best thumbnail to S3 with presigned URL</li>
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">🎬 Select Video for Testing</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {videos.map((video) => (
              <button
                key={video.id}
                onClick={() => setSelectedVideo(video)}
                className={`p-4 text-left rounded-lg border-2 transition-colors ${
                  selectedVideo?.id === video.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-gray-900">{video.title}</div>
                <div className="text-sm text-gray-500">ID: {video.id}</div>
                <div className="text-xs text-green-600 mt-1">✅ Video Available</div>
              </button>
            ))}
          </div>
        </div>

        {selectedVideo && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">
              🖼️ Thumbnail Generation Test
            </h2>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
              <h3 className="font-medium text-gray-900 mb-2">Selected Video:</h3>
              <p className="text-sm text-gray-600 mb-1">
                <strong>Title:</strong> {selectedVideo.title}
              </p>
              <p className="text-sm text-gray-600">
                <strong>ID:</strong> {selectedVideo.id}
              </p>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Generated Thumbnail
                </h3>
                <div className="inline-block">
                  <SimpleVideoThumbnail
                    videoKey={selectedVideo.id}
                    videoUrl={selectedVideoUrl ?? undefined}
                    className="rounded-lg shadow-md"
                  />
                </div>
                <div className="mt-4 text-sm text-gray-600">
                  <p>⏱️ Generation may take 30-60 seconds</p>
                  <p>🔍 Check browser console for detailed logs</p>
                  <p>📊 Watch for GPT Vision analysis scores</p>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-800 mb-2">🔍 What to Watch For:</h4>
              <ul className="list-disc list-inside text-yellow-700 text-sm space-y-1">
                <li>Initial loading spinner</li>
                <li>Console logs showing screenshot analysis</li>
                <li>GPT Vision API calls with scores</li>
                <li>S3 upload success message</li>
                <li>Final thumbnail showing REAL video content (not black)</li>
              </ul>
            </div>

            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-800 mb-2">✅ Success Indicators:</h4>
              <ul className="list-disc list-inside text-green-700 text-sm space-y-1">
                <li>Thumbnail shows actual people/meeting content</li>
                <li>Play button overlay is visible</li>
                <li>No infinite loading or error states</li>
                <li>Console shows "Simple thumbnail uploaded with presigned URL"</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 