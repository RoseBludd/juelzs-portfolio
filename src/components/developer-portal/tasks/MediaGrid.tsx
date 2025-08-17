import { IconPhoto, IconVideo } from "@tabler/icons-react";

import S3Media from '@/components/S3Media';
import { Milestone } from "@/hooks/useTaskDetails";

interface MediaItem {
  id: string;
  url: string;
  description: string;
  milestone: string;
  created_at: string | Date;
  comment?: string;
}

interface MediaGridProps {
  milestones: Milestone[];
  onMediaPreview: (mediaFiles: any[], index?: number) => void;
}

export const MediaGrid = ({ milestones, onMediaPreview }: MediaGridProps) => {
  // Group media by type
  const groupMediaByType = (milestones: Milestone[]) => {
    const images: MediaItem[] = [];
    const videos: MediaItem[] = [];

    if (!milestones) return { images, videos };

    milestones.forEach((milestone) => {
      if (milestone.updates) {
        milestone.updates.forEach((update) => {
          // Handle regular image updates
          if (update.update_type === 'image' &&
              update.content &&
              update.content.includes('s3.amazonaws.com') &&
              !update.content.includes('placeholder')) {
            images.push({
              id: update.id,
              url: update.content,
              description: `Added by ${update.developer_name}`,
              milestone: milestone.title,
              created_at: update.created_at
            });
          }
          // Handle regular video updates
          else if (update.update_type === 'video' &&
                    update.content &&
                    update.content.includes('s3.amazonaws.com') &&
                    !update.content.includes('placeholder')) {
            videos.push({
              id: update.id,
              url: update.content,
              description: `Added by ${update.developer_name}`,
              milestone: milestone.title,
              created_at: update.created_at
            });
          }
          // Handle image with comment updates
          else if (update.update_type === 'image_with_comment' && update.content) {
            try {
              const contentData = JSON.parse(update.content);
              if (contentData.mediaUrl && contentData.mediaUrl.includes('s3.amazonaws.com')) {
                images.push({
                  id: update.id,
                  url: contentData.mediaUrl,
                  description: `Added by ${update.developer_name}`,
                  milestone: milestone.title,
                  created_at: update.created_at,
                  comment: contentData.comment
                });
              }
            } catch (e) {
              console.error("Error parsing image_with_comment content:", e);
            }
          }
          // Handle video with comment updates
          else if (update.update_type === 'video_with_comment' && update.content) {
            try {
              const contentData = JSON.parse(update.content);
              if (contentData.mediaUrl && contentData.mediaUrl.includes('s3.amazonaws.com')) {
                videos.push({
                  id: update.id,
                  url: contentData.mediaUrl,
                  description: `Added by ${update.developer_name}`,
                  milestone: milestone.title,
                  created_at: update.created_at,
                  comment: contentData.comment
                });
              }
            } catch (e) {
              console.error("Error parsing video_with_comment content:", e);
            }
          }
          // Handle multi-media updates
          else if ((update.update_type === 'multi_media' || update.update_type === 'multi_media_with_comment') && update.content) {
            try {
              const contentData = JSON.parse(update.content);
              if (contentData.mediaFiles && Array.isArray(contentData.mediaFiles)) {
                // Process each media file
                contentData.mediaFiles.forEach((media: any) => {
                  if (media.url && media.url.includes('s3.amazonaws.com')) {
                    if (media.type === 'image') {
                      images.push({
                        id: `${update.id}-${media.url.substring(media.url.lastIndexOf('/') + 1)}`,
                        url: media.url,
                        description: `Added by ${update.developer_name}`,
                        milestone: milestone.title,
                        created_at: update.created_at,
                        comment: contentData.comment || undefined
                      });
                    } else if (media.type === 'video') {
                      videos.push({
                        id: `${update.id}-${media.url.substring(media.url.lastIndexOf('/') + 1)}`,
                        url: media.url,
                        description: `Added by ${update.developer_name}`,
                        milestone: milestone.title,
                        created_at: update.created_at,
                        comment: contentData.comment || undefined
                      });
                    }
                  }
                });
              }
            } catch (e) {
              console.error("Error parsing multi_media content:", e);
            }
          }
        });
      }
    });

    return { images, videos };
  };

  const { images, videos } = groupMediaByType(milestones);

  // Don't render if no media
  if (images.length === 0 && videos.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4 text-white">Media Attachments</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Images */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="text-lg font-medium mb-3 flex items-center text-white">
            <IconPhoto className="mr-2 text-indigo-400" size={20} />
            Images ({images.length})
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {images.map((image, index) => (              <div                key={image.id}                className="relative aspect-video rounded-lg overflow-hidden bg-gray-700 cursor-pointer group"                onClick={() => onMediaPreview(images.map(img => ({                  url: img.url,                  type: 'image' as const,                  fileName: img.url.substring(img.url.lastIndexOf('/') + 1)                })), index)}              >
                <S3Media
                  url={image.url}
                  type="image"
                  width={250}
                  height={150}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {/* Hover overlay with preview icon */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
                  <div className="p-2 rounded-full bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <IconPhoto className="text-white" size={24} />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-1 truncate z-20">
                  {image.comment ? `${image.milestone} - ${image.comment.substring(0, 20)}${image.comment.length > 20 ? '...' : ''}` : image.milestone}
                </div>
              </div>
            ))}

            {images.length === 0 && (
              <div className="col-span-2 sm:col-span-3 text-gray-400 text-center py-8">
                No images uploaded yet
              </div>
            )}
          </div>
        </div>

        {/* Videos */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="text-lg font-medium mb-3 flex items-center text-white">
            <IconVideo className="mr-2 text-red-400" size={20} />
            Videos ({videos.length})
          </h3>

          <div className="space-y-3">
                        {videos.map((video, index) => (              <div                key={video.id}                className="relative aspect-video rounded-lg overflow-hidden bg-gray-700 cursor-pointer group"                onClick={() => onMediaPreview(videos.map(v => ({                  url: v.url,                  type: 'video' as const,                  fileName: v.url.substring(v.url.lastIndexOf('/') + 1)                })), index)}              >
                                <S3Media                  url={video.url}                  type="video"                  width={400}                  height={225}                  thumbnail={true}                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"                />
                {/* Hover overlay with preview icon */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
                  <div className="p-2 rounded-full bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <IconVideo className="text-white" size={24} />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-1 truncate z-20">
                  {video.comment ? `${video.milestone} - ${video.comment.substring(0, 20)}${video.comment.length > 20 ? '...' : ''}` : video.milestone}
                </div>
              </div>
            ))}

            {videos.length === 0 && (
              <div className="text-gray-400 text-center py-8">
                No videos uploaded yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 