import { getLoomEmbedUrl } from '@/utils/mediaUtils';

interface VideoExplanationProps {
  loomVideoUrl?: string;
  transcript?: string;
}

export const VideoExplanation = ({ loomVideoUrl, transcript }: VideoExplanationProps) => {
  if (!loomVideoUrl) {
    return null;
  }

  // Convert Loom share URL to embed URL
  const embedUrl = getLoomEmbedUrl(loomVideoUrl);
  
  if (!embedUrl) {
    console.warn('Invalid Loom URL provided:', loomVideoUrl);
    return null;
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 sm:p-6 mb-6 shadow-lg">
      <h2 className="text-xl font-semibold text-white mb-4">Video Explanation</h2>
      <div className="aspect-video mb-4">
        <iframe
          src={embedUrl}
          frameBorder="0"
          allowFullScreen
          className="w-full h-full rounded-lg"
        />
      </div>
      {transcript && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold text-white mb-2">Transcript</h3>
          <div className="prose prose-invert max-w-none">
            <p className="text-gray-300 whitespace-pre-line leading-relaxed">{transcript}</p>
          </div>
        </div>
      )}
    </div>
  );
}; 