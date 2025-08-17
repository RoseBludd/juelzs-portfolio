import { IconX, IconPhoto, IconVideo } from "@tabler/icons-react";
import Image from "next/image";

import S3Media from '@/components/S3Media';
import { MilestoneUpdate } from "@/hooks/useTaskDetails";
import { formatDateTime } from "@/utils/taskHelpers";
import { getSafeFileName } from "@/utils/fileUtils";

interface MilestoneUpdateItemProps {
  update: MilestoneUpdate;
  deletingUpdateId: string | null;
  onDelete: (updateId: string) => void;
  onMediaPreview: (mediaFiles: any[], index?: number) => void;
}

export const MilestoneUpdateItem = ({ 
  update, 
  deletingUpdateId, 
  onDelete, 
  onMediaPreview 
}: MilestoneUpdateItemProps) => {
  const renderMediaContent = () => {
    // Handle single image updates
    if (update.update_type === 'image' && update.content && update.content.includes('s3.amazonaws.com')) {
      return (
        <div className="mt-3 bg-gray-700/30 p-2 rounded border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <IconPhoto size={16} className="text-indigo-400" />
            <span className="text-gray-300 text-xs">Image Attachment</span>
          </div>
          <div
            className="relative cursor-pointer group"
            onClick={() => onMediaPreview([{
              url: update.content,
              type: 'image',
              fileName: getSafeFileName(undefined, update.content)
            }])}
          >
            <div className="bg-gray-900/50 rounded overflow-hidden">
              <S3Media
                url={update.content}
                type="image"
                width={300}
                height={200}
                className="rounded w-full h-auto max-h-60 object-contain transition-transform duration-300 group-hover:scale-[1.02] mx-auto"
              />
            </div>
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center rounded">
              <div className="p-2 rounded-full bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <IconPhoto className="text-white" size={20} />
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Handle single video updates
    if (update.update_type === 'video' && update.content && update.content.includes('s3.amazonaws.com')) {
      return (
        <div className="mt-3 bg-gray-700/30 p-2 rounded border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <IconVideo size={16} className="text-red-400" />
            <span className="text-gray-300 text-xs">Video Attachment</span>
          </div>
          <div
            className="relative cursor-pointer group"
            onClick={() => onMediaPreview([{
              url: update.content,
              type: 'video',
              fileName: getSafeFileName(undefined, update.content)
            }])}
          >
            <div className="bg-gray-900/50 rounded overflow-hidden">
              <S3Media
                url={update.content}
                type="video"
                width={300}
                height={200}
                className="w-full h-auto max-h-60 rounded transition-transform duration-300 group-hover:scale-[1.02] mx-auto"
              />
            </div>
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center rounded">
              <div className="p-2 rounded-full bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <IconVideo className="text-white" size={20} />
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Handle image with comment
    if (update.update_type === 'image_with_comment' && update.content) {
      try {
        const contentData = JSON.parse(update.content);
        return (
          <div className="mt-3">
            <p className="text-white mb-3">{contentData.comment}</p>
            <div className="bg-gray-700/30 p-2 rounded border border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <IconPhoto size={16} className="text-indigo-400" />
                <span className="text-gray-300 text-xs">Image Attachment</span>
              </div>
              <div
                className="relative cursor-pointer group"
                onClick={() => onMediaPreview([{
                  url: contentData.mediaUrl,
                  type: 'image',
                  fileName: getSafeFileName(undefined, contentData.mediaUrl),
                  comment: contentData.comment
                }])}
              >
                <div className="bg-gray-900/50 rounded overflow-hidden">
                  <S3Media
                    url={contentData.mediaUrl}
                    type="image"
                    width={300}
                    height={200}
                    className="rounded w-full h-auto max-h-60 object-contain transition-transform duration-300 group-hover:scale-[1.02] mx-auto"
                  />
                </div>
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center rounded">
                  <div className="p-2 rounded-full bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <IconPhoto className="text-white" size={20} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      } catch (e) {
        console.error("Error parsing image_with_comment content:", e);
        return null;
      }
    }

    // Handle video with comment
    if (update.update_type === 'video_with_comment' && update.content) {
      try {
        const contentData = JSON.parse(update.content);
        return (
          <div className="mt-3">
            <p className="text-white mb-3">{contentData.comment}</p>
            <div className="bg-gray-700/30 p-2 rounded border border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <IconVideo size={16} className="text-red-400" />
                <span className="text-gray-300 text-xs">Video Attachment</span>
              </div>
              <div
                className="relative cursor-pointer group"
                onClick={() => onMediaPreview([{
                  url: contentData.mediaUrl,
                  type: 'video',
                  fileName: getSafeFileName(undefined, contentData.mediaUrl),
                  comment: contentData.comment
                }])}
              >
                <div className="bg-gray-900/50 rounded overflow-hidden">
                  <S3Media
                    url={contentData.mediaUrl}
                    type="video"
                    width={300}
                    height={200}
                    className="w-full h-auto max-h-60 rounded transition-transform duration-300 group-hover:scale-[1.02] mx-auto"
                  />
                </div>
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center rounded">
                  <div className="p-2 rounded-full bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <IconVideo className="text-white" size={20} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      } catch (e) {
        console.error("Error parsing video_with_comment content:", e);
        return null;
      }
    }

    // Handle multiple media files
    if ((update.update_type === 'multi_media' || update.update_type === 'multi_media_with_comment') && update.content) {
      try {
        const contentData = JSON.parse(update.content);
        return (
          <div className="mt-3">
            {contentData.comment && (
              <p className="text-white mb-3">{contentData.comment}</p>
            )}

            <div className="space-y-3">
              {contentData.mediaFiles && Array.isArray(contentData.mediaFiles) && contentData.mediaFiles.map((media: any, index: number) => (
                <div key={index} className="bg-gray-700/30 p-2 rounded border border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    {media.type === 'image' ? (
                      <>
                        <IconPhoto size={16} className="text-indigo-400" />
                        <span className="text-gray-300 text-xs">Image Attachment</span>
                      </>
                    ) : (
                      <>
                        <IconVideo size={16} className="text-red-400" />
                        <span className="text-gray-300 text-xs">Video Attachment</span>
                      </>
                    )}
                    <span className="text-gray-400 text-xs ml-auto">
                      {getSafeFileName(media.fileName, media.url) || 'File'}
                      {media.size && (
                        <> ({(media.size / (1024 * 1024)).toFixed(2)} MB)</>
                      )}
                    </span>
                  </div>
                  <div
                    className="relative cursor-pointer group"
                    onClick={() => onMediaPreview(contentData.mediaFiles || [], index)}
                  >
                    <div className="bg-gray-900/50 rounded overflow-hidden">
                      <S3Media
                        url={media.url}
                        type={media.type || 'image'}
                        width={300}
                        height={200}
                        className="rounded w-full h-auto max-h-60 object-contain transition-transform duration-300 group-hover:scale-[1.02] mx-auto"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center rounded">
                      <div className="p-2 rounded-full bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {media.type === 'image' ? (
                          <IconPhoto className="text-white" size={20} />
                        ) : (
                          <IconVideo className="text-white" size={20} />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      } catch (e) {
        console.error("Error parsing multi_media content:", e);
        return null;
      }
    }

    return null;
  };

  const shouldShowTextContent = (
    (update.update_type === 'comment' || 
     update.update_type === 'status' || 
     update.update_type === 'status_update' || 
     update.update_type === 'progress' ||
     update.update_type === 'system' ||
     update.update_type === 'milestone_completed' ||
     update.update_type === 'task_submitted' ||
     update.update_type === 'test_submission' ||
     update.update_type === 'assessment_completed' ||
     update.update_type === 'developer_stage_changed' ||
     update.update_type === 'challenge' ||
     (!update.update_type && update.content && 
      !update.content.includes('s3.amazonaws.com') && 
      !update.content.startsWith('{'))) && 
    (update.message || update.content)?.trim()
  );

  return (
    <div className="flex items-start space-x-3 mb-3">
      <div className="flex-shrink-0">
        {update.developer_profile_picture_url ? (
          <Image
            src={update.developer_profile_picture_url}
            alt={update.developer_name || "Developer"}
            width={40}
            height={40}
            className="rounded-full"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
            {update.developer_name ? update.developer_name.charAt(0) : "?"}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-sm text-white truncate">{update.developer_name}</span>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-gray-400 whitespace-nowrap">
                {formatDateTime(update.created_at)}
              </span>
              <button
                onClick={() => onDelete(update.id)}
                className="text-red-400 hover:text-red-300 focus:outline-none disabled:opacity-50"
                disabled={deletingUpdateId === update.id}
                title="Delete update"
              >
                {deletingUpdateId === update.id ? (
                  <div className="animate-spin h-4 w-4 border-t-2 border-b-2 border-red-400 rounded-full"></div>
                ) : (
                  <IconX size={16} />
                )}
              </button>
            </div>
          </div>
          
          {/* Display text content for text-based updates */}
          {shouldShowTextContent && (
            <p className="text-sm text-gray-200 mb-2 whitespace-pre-line">
              {update.message || update.content}
            </p>
          )}

          {update.status && (
            <div className={`mt-2 text-xs ${update.status === 'completed' ? 'text-green-400' : 'text-blue-400'}`}>
              Status: {update.status.charAt(0).toUpperCase() + update.status.slice(1)}
            </div>
          )}

          {/* Display admin response if available */}
          {update.admin_response && (
            <div className="mt-3 p-3 bg-blue-900/20 border border-blue-600/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                  A
                </div>
                <span className="text-xs font-medium text-blue-300">
                  Admin Response{update.admin_name ? ` from ${update.admin_name}` : ''}
                </span>
                {update.admin_response_at && (
                  <span className="text-xs text-blue-400 ml-auto">
                    {formatDateTime(update.admin_response_at)}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-line">
                {update.admin_response}
              </p>
            </div>
          )}

          {/* Render media content */}
          {renderMediaContent()}
        </div>
      </div>
    </div>
  );
}; 