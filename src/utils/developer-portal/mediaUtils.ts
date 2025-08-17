/**
 * Utility functions for media handling, particularly video URLs
 */

/**
 * Extract video ID from Loom URL
 * @param url - The Loom share URL
 * @returns The video ID or null if not found
 */
export const extractLoomVideoId = (url: string): string | null => {
  if (!url) return null;
  
  const loomMatch = url.match(/loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)/);
  if (loomMatch && loomMatch[1]) {
    return loomMatch[1];
  }
  return null;
};

/**
 * Convert Loom share URL to embed URL
 * @param url - The Loom share URL
 * @returns The embed URL or null if invalid
 */
export const getLoomEmbedUrl = (url: string): string | null => {
  const videoId = extractLoomVideoId(url);
  if (videoId) {
    return `https://www.loom.com/embed/${videoId}`;
  }
  return null;
};

/**
 * Check if a URL is a Loom video URL
 * @param url - The URL to check
 * @returns True if it's a Loom video URL
 */
export const isLoomVideoUrl = (url: string): boolean => {
  return url?.includes('loom.com/share') || url?.includes('loom.com/embed');
};

/**
 * Extract all Loom URLs from text content
 * @param content - Text content to search
 * @returns Array of Loom URLs found
 */
export const extractLoomUrlsFromText = (content: string): string[] => {
  if (!content) return [];
  const loomRegex = /https?:\/\/(?:www\.)?loom\.com\/(?:share|embed)\/[a-zA-Z0-9]+/g;
  return content.match(loomRegex) || [];
};

/**
 * Comprehensive loom video extraction from module data
 * @param module - Module object with all possible loom video sources
 * @returns Array of loom video objects with source tracking
 */
export const extractAllLoomVideosFromModule = (module: any): Array<{
  id: string;
  url: string;
  source: 'url' | 'metadata' | 'description' | 'update';
  title: string;
  created_at?: string;
  developer_name?: string;
  update_content?: string;
  module_id?: string;
  module_name?: string;
}> => {
  const loomVideos: Array<any> = [];

  // 1. Check module URL field
  if (module.url && isLoomVideoUrl(module.url)) {
    loomVideos.push({
      id: `${module.id}-url`,
      url: module.url,
      source: 'url',
      title: `${module.name} - Main Demo`,
      created_at: module.created_at,
      developer_name: module.developer_name,
      module_id: module.id,
      module_name: module.name
    });
  }

  // 2. Check module metadata for loom_video_url
  if (module.metadata) {
    let metadata;
    try {
      metadata = typeof module.metadata === 'string' ? JSON.parse(module.metadata) : module.metadata;
      if (metadata.loom_video_url && isLoomVideoUrl(metadata.loom_video_url)) {
        loomVideos.push({
          id: `${module.id}-metadata`,
          url: metadata.loom_video_url,
          source: 'metadata',
          title: `${module.name} - Metadata Video`,
          created_at: module.created_at,
          developer_name: module.developer_name,
          module_id: module.id,
          module_name: module.name
        });
      }
    } catch (e) {
      console.warn('Failed to parse module metadata:', e);
    }
  }

  // 3. Check module description for embedded loom URLs
  if (module.description) {
    const descriptionLoomUrls = extractLoomUrlsFromText(module.description);
    descriptionLoomUrls.forEach((url, index) => {
      loomVideos.push({
        id: `${module.id}-desc-${index}`,
        url: url,
        source: 'description',
        title: `${module.name} - Description Video ${index + 1}`,
        created_at: module.created_at,
        developer_name: module.developer_name,
        module_id: module.id,
        module_name: module.name
      });
    });
  }

  // 4. Check module updates for loom URLs
  if (module.updates && Array.isArray(module.updates)) {
    module.updates.forEach((update: any, updateIndex: number) => {
      if (update.content) {
        const updateLoomUrls = extractLoomUrlsFromText(update.content);
        updateLoomUrls.forEach((url, urlIndex) => {
          loomVideos.push({
            id: `${module.id}-update-${updateIndex}-${urlIndex}`,
            url: url,
            source: 'update',
            title: `${module.name} - Update Video`,
            created_at: update.created_at,
            developer_name: update.developer_name,
            update_content: update.content,
            module_id: module.id,
            module_name: module.name
          });
        });
      }
    });
  }

  return loomVideos;
};

/**
 * Extract loom videos from task data
 * @param task - Task object
 * @returns Array of loom video objects
 */
export const extractLoomVideosFromTask = (task: any): Array<{
  id: string;
  url: string;
  source: 'task';
  title: string;
  transcript?: string;
  created_at: string;
}> => {
  const loomVideos: Array<any> = [];

  if (task.loom_video_url && isLoomVideoUrl(task.loom_video_url)) {
    loomVideos.push({
      id: `task-${task.id}`,
      url: task.loom_video_url,
      source: 'task',
      title: `Task: ${task.title}`,
      transcript: task.transcript,
      created_at: task.created_at
    });
  }

  return loomVideos;
};

/**
 * Get comprehensive loom video statistics
 * @param modules - Array of modules
 * @param task - Task object
 * @returns Statistics object
 */
export const getLoomVideoStats = (modules: any[], task: any) => {
  const taskVideos = extractLoomVideosFromTask(task);
  const moduleVideos = modules.flatMap(module => extractAllLoomVideosFromModule(module));
  
  const allVideos = [...taskVideos, ...moduleVideos];
  
  const stats = {
    total: allVideos.length,
    by_source: {
      task: taskVideos.length,
      module_url: moduleVideos.filter(v => v.source === 'url').length,
      module_metadata: moduleVideos.filter(v => v.source === 'metadata').length,
      module_description: moduleVideos.filter(v => v.source === 'description').length,
      module_updates: moduleVideos.filter(v => v.source === 'update').length
    },
    videos: allVideos
  };

  return stats;
}; 