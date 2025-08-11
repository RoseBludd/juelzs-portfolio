export interface CachedThumbnailRecord {
  thumbnailUrl: string;
  generatedAt: number; // epoch ms
  seekTime?: number;
  details?: Record<string, unknown>;
}

/**
 * Lightweight client-side cache for video thumbnails.
 * - Singleton pattern to align with the rest of the codebase
 * - Uses localStorage to persist across sessions
 * - Safe no-ops on server (guards around window/localStorage)
 */
class VideoThumbnailCacheService {
  private static instance: VideoThumbnailCacheService | null = null;
  private readonly storagePrefix = 'vtc:';
  private readonly defaultTtlMs = 7 * 24 * 60 * 60 * 1000; // 7 days

  private constructor() {}

  public static getInstance(): VideoThumbnailCacheService {
    if (!VideoThumbnailCacheService.instance) {
      VideoThumbnailCacheService.instance = new VideoThumbnailCacheService();
    }
    return VideoThumbnailCacheService.instance;
  }

  /**
   * Best comprehensive thumbnail from AI pipeline (if any).
   * This implementation is intentionally minimal; returns null by default.
   * The calling component already checks higher-priority showcased thumbnails first.
   */
  async getBestComprehensiveThumbnail(_videoKey: string): Promise<(CachedThumbnailRecord & { comprehensiveScore?: number }) | null> {
    try {
      // Placeholder for future comprehensive cache source (e.g., IndexedDB or API)
      return null;
    } catch {
      return null;
    }
  }

  getCachedThumbnail(videoKey: string): CachedThumbnailRecord | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = window.localStorage.getItem(this.key(videoKey));
      if (!raw) return null;
      const parsed = JSON.parse(raw) as CachedThumbnailRecord;
      if (!parsed || !parsed.thumbnailUrl || !parsed.generatedAt) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  isThumbnailExpired(record: CachedThumbnailRecord, ttlMs: number = this.defaultTtlMs): boolean {
    const now = Date.now();
    return now - record.generatedAt > ttlMs;
  }

  /**
   * Save or update a cached thumbnail for a video key.
   */
  async saveThumbnailToCache(videoKey: string, thumbnailUrl: string, details?: Record<string, unknown>): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      const payload: CachedThumbnailRecord = {
        thumbnailUrl,
        generatedAt: Date.now(),
        seekTime: typeof details?.seekTime === 'number' ? (details!.seekTime as number) : undefined,
        details,
      };
      window.localStorage.setItem(this.key(videoKey), JSON.stringify(payload));
    } catch {
      // Ignore storage failures
    }
  }

  clear(videoKey: string): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(this.key(videoKey));
    } catch {}
  }

  private key(videoKey: string): string {
    return `${this.storagePrefix}${videoKey}`;
  }
}

export default VideoThumbnailCacheService;


