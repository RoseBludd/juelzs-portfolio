import { convertToPresignedUrl } from './s3-utils';

/**
 * Singleton Profile Picture Service
 * Ensures consistent profile picture URL handling across the entire application
 * Always returns S3 presigned URLs for production reliability
 */
class ProfilePictureService {
  private static instance: ProfilePictureService;
  private cache: Map<string, { url: string; expiry: number }> = new Map();
  private readonly CACHE_DURATION = 3000000; // 50 minutes (S3 URLs expire in 1 hour)

  private constructor() {}

  public static getInstance(): ProfilePictureService {
    if (!ProfilePictureService.instance) {
      ProfilePictureService.instance = new ProfilePictureService();
    }
    return ProfilePictureService.instance;
  }

  /**
   * Get a profile picture URL with caching
   * @param rawUrl - The raw profile picture URL from the database
   * @returns Promise<string | null> - The presigned S3 URL or null if not available
   */
  public async getProfilePictureUrl(rawUrl: string | null | undefined): Promise<string | null> {
    if (!rawUrl) return null;

    // Check cache first
    const cached = this.cache.get(rawUrl);
    if (cached && Date.now() < cached.expiry) {
      return cached.url;
    }

    try {
      // Convert to S3 presigned URL
      const presignedUrl = await convertToPresignedUrl(rawUrl);
      
      if (presignedUrl) {
        // Cache the result
        this.cache.set(rawUrl, {
          url: presignedUrl,
          expiry: Date.now() + this.CACHE_DURATION
        });
        
        return presignedUrl;
      }
      
      return null;
    } catch (error) {
      console.error('ProfilePictureService: Error converting URL:', error);
      return null;
    }
  }

  /**
   * Get multiple profile picture URLs efficiently
   * @param urls - Array of raw profile picture URLs
   * @returns Promise<(string | null)[]> - Array of presigned URLs in the same order
   */
  public async getMultipleProfilePictureUrls(urls: (string | null | undefined)[]): Promise<(string | null)[]> {
    return Promise.all(urls.map(url => this.getProfilePictureUrl(url)));
  }

  /**
   * Clear the cache (useful for testing or memory management)
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Remove expired entries from cache
   */
  public cleanExpiredCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now >= value.expiry) {
        this.cache.delete(key);
      }
    }
  }
}

// Export singleton instance
export const profilePictureService = ProfilePictureService.getInstance();

// Export convenience functions for easy migration
export const getProfilePictureUrl = (rawUrl: string | null | undefined): Promise<string | null> => {
  return profilePictureService.getProfilePictureUrl(rawUrl);
};

export const getMultipleProfilePictureUrls = (urls: (string | null | undefined)[]): Promise<(string | null)[]> => {
  return profilePictureService.getMultipleProfilePictureUrls(urls);
}; 