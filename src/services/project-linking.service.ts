export interface ProjectPhoto {
  id: string;
  projectId: string;
  filename: string;
  s3Key: string;
  url?: string;
  alt?: string;
  category: 'screenshot' | 'diagram' | 'demo' | 'interface' | 'mobile' | 'analytics';
  order: number;
  uploadedAt: Date;
  size: number;
}

export interface ProjectVideoLink {
  id: string;
  projectId: string;
  videoId: string;
  videoTitle: string;
  linkType: 'technical-discussion' | 'architecture-review' | 'mentoring-session' | 'demo' | 'planning';
  relevanceScore: number;
  linkedAt: Date;
  notes?: string;
}

export interface ProjectResources {
  projectId: string;
  photos: ProjectPhoto[];
  linkedVideos: ProjectVideoLink[];
  featuredImageId?: string;
  lastUpdated: Date;
}

class ProjectLinkingService {
  private static instance: ProjectLinkingService;
  private projectResourcesCache: Map<string, ProjectResources> = new Map();
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private constructor() {
    // Clear any existing cache when initializing
    this.invalidateCache();
  }

  public static getInstance(): ProjectLinkingService {
    if (!ProjectLinkingService.instance) {
      ProjectLinkingService.instance = new ProjectLinkingService();
    }
    return ProjectLinkingService.instance;
  }

  /**
   * Get all resources for a project (photos and linked videos)
   */
  async getProjectResources(projectId: string): Promise<ProjectResources> {
    // Check cache first
    if (this.isValidCache() && this.projectResourcesCache.has(projectId)) {
      const cachedResources = this.projectResourcesCache.get(projectId)!;
      // Generate fresh URLs for cached resources too
      return await this.generateFreshPhotoUrls(cachedResources);
    }

    // Load from storage (for now using localStorage, could be moved to S3 or database)
    const resources = await this.loadProjectResourcesFromStorage(projectId);
    
    // Generate fresh presigned URLs for all photos
    const resourcesWithFreshUrls = await this.generateFreshPhotoUrls(resources);
    
    // Cache the result (without URLs to avoid caching expired URLs)
    this.projectResourcesCache.set(projectId, resources);
    this.cacheTimestamp = Date.now();

    return resourcesWithFreshUrls;
  }

  /**
   * Add photo to project
   */
  async addPhotoToProject(projectId: string, photo: Omit<ProjectPhoto, 'id' | 'uploadedAt'>): Promise<ProjectPhoto> {
    const resources = await this.getProjectResources(projectId);
    
    const newPhoto: ProjectPhoto = {
      ...photo,
      id: this.generatePhotoId(projectId, photo.filename),
      uploadedAt: new Date(),
    };

    resources.photos.push(newPhoto);
    resources.lastUpdated = new Date();

    await this.saveProjectResources(projectId, resources);
    this.invalidateCache();

    return newPhoto;
  }

  /**
   * Remove photo from project
   */
  async removePhotoFromProject(projectId: string, photoId: string): Promise<boolean> {
    const resources = await this.getProjectResources(projectId);
    
    const photoIndex = resources.photos.findIndex(p => p.id === photoId);
    if (photoIndex === -1) return false;

    resources.photos.splice(photoIndex, 1);
    resources.lastUpdated = new Date();

    await this.saveProjectResources(projectId, resources);
    this.invalidateCache();

    return true;
  }

  /**
   * Update photo metadata
   */
  async updatePhotoMetadata(projectId: string, photoId: string, updates: Partial<Pick<ProjectPhoto, 'alt' | 'category' | 'order'>>): Promise<boolean> {
    const resources = await this.getProjectResources(projectId);
    
    const photo = resources.photos.find(p => p.id === photoId);
    if (!photo) return false;

    Object.assign(photo, updates);
    resources.lastUpdated = new Date();

    await this.saveProjectResources(projectId, resources);
    this.invalidateCache();

    return true;
  }

  /**
   * Set featured image for project
   */
  async setFeaturedImage(projectId: string, photoId: string): Promise<boolean> {
    const resources = await this.getProjectResources(projectId);
    
    // Verify the photo exists in this project
    const photo = resources.photos.find(p => p.id === photoId);
    if (!photo) return false;

    resources.featuredImageId = photoId;
    resources.lastUpdated = new Date();

    await this.saveProjectResources(projectId, resources);
    this.invalidateCache();

    return true;
  }

  /**
   * Clear featured image for project
   */
  async clearFeaturedImage(projectId: string): Promise<boolean> {
    const resources = await this.getProjectResources(projectId);
    
    resources.featuredImageId = undefined;
    resources.lastUpdated = new Date();

    await this.saveProjectResources(projectId, resources);
    this.invalidateCache();

    return true;
  }

  /**
   * Link video to project
   */
  async linkVideoToProject(projectId: string, link: Omit<ProjectVideoLink, 'id' | 'linkedAt'>): Promise<ProjectVideoLink> {
    const resources = await this.getProjectResources(projectId);
    
    // Check if this video is already linked
    const existingLink = resources.linkedVideos.find(l => l.videoId === link.videoId);
    if (existingLink) {
      // Update existing link
      Object.assign(existingLink, link);
      existingLink.linkedAt = new Date();
      await this.saveProjectResources(projectId, resources);
      this.invalidateCache();
      return existingLink;
    }

    const newLink: ProjectVideoLink = {
      ...link,
      id: this.generateVideoLinkId(projectId, link.videoId),
      linkedAt: new Date(),
    };

    resources.linkedVideos.push(newLink);
    resources.lastUpdated = new Date();

    await this.saveProjectResources(projectId, resources);
    this.invalidateCache();

    return newLink;
  }

  /**
   * Remove video link from project
   */
  async unlinkVideoFromProject(projectId: string, videoId: string): Promise<boolean> {
    const resources = await this.getProjectResources(projectId);
    
    const linkIndex = resources.linkedVideos.findIndex(l => l.videoId === videoId);
    if (linkIndex === -1) return false;

    resources.linkedVideos.splice(linkIndex, 1);
    resources.lastUpdated = new Date();

    await this.saveProjectResources(projectId, resources);
    this.invalidateCache();

    return true;
  }

  /**
   * Get all projects that have resources
   */
  async getProjectsWithResources(): Promise<string[]> {
    try {
      const { S3Client, ListObjectsV2Command } = await import('@aws-sdk/client-s3');
      const s3Client = new S3Client({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
      });

      const command = new ListObjectsV2Command({
        Bucket: process.env.AWS_S3_BUCKET || 'genius-untitled',
        Prefix: 'project-resources/',
      });

      const response = await s3Client.send(command);
      const projects: string[] = [];

      if (response.Contents) {
        for (const object of response.Contents) {
          if (object.Key && object.Key.endsWith('_resources.json')) {
            const projectId = object.Key
              .replace('project-resources/', '')
              .replace('_resources.json', '');
            projects.push(projectId);
          }
        }
      }

      return projects;
    } catch (error) {
      console.error('Error listing projects with resources:', error);
      return [];
    }
  }

  /**
   * Get projects linked to a specific video
   */
  async getProjectsLinkedToVideo(videoId: string): Promise<ProjectVideoLink[]> {
    const projectIds = await this.getProjectsWithResources();
    const links: ProjectVideoLink[] = [];

    for (const projectId of projectIds) {
      const resources = await this.getProjectResources(projectId);
      const projectLinks = resources.linkedVideos.filter(link => link.videoId === videoId);
      links.push(...projectLinks);
    }

    return links;
  }

  /**
   * Private helper methods
   */
  private async loadProjectResourcesFromStorage(projectId: string): Promise<ProjectResources> {
    try {
      // Use S3 for persistent storage
      const { S3Client, GetObjectCommand } = await import('@aws-sdk/client-s3');
      const s3Client = new S3Client({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
      });

      const command = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET || 'genius-untitled',
        Key: `project-resources/${projectId}_resources.json`,
      });

      const response = await s3Client.send(command);
      
      if (response.Body) {
        const data = await response.Body.transformToString();
        const parsed = JSON.parse(data);
        
        // Convert date strings back to Date objects
        parsed.lastUpdated = new Date(parsed.lastUpdated);
        parsed.photos = parsed.photos.map((p: Omit<ProjectPhoto, 'uploadedAt'> & { uploadedAt: string }) => ({
          ...p,
          uploadedAt: new Date(p.uploadedAt)
        }));
        parsed.linkedVideos = parsed.linkedVideos.map((l: Omit<ProjectVideoLink, 'linkedAt'> & { linkedAt: string }) => ({
          ...l,
          linkedAt: new Date(l.linkedAt)
        }));
        
        return parsed;
      }
    } catch {
      // File doesn't exist or other error - this is normal for new projects
      console.log(`📄 No existing resources found for project: ${projectId}`);
    }

    // Return empty resources structure
    return {
      projectId,
      photos: [],
      linkedVideos: [],
      lastUpdated: new Date(),
    };
  }

  /**
   * Generate public S3 URLs that never expire for all photos in resources
   */
  private async generateFreshPhotoUrls(resources: ProjectResources): Promise<ProjectResources> {
    if (!resources.photos || resources.photos.length === 0) {
      return resources;
    }

    try {
      const bucketName = process.env.AWS_S3_BUCKET || 'genius-untitled';
      const region = process.env.AWS_REGION || 'us-east-1';

      // Generate public URLs for all photos (these never expire)
      const photosWithFreshUrls = resources.photos.map((photo) => {
        try {
          if (!photo.s3Key) {
            console.error(`Photo ${photo.filename} missing s3Key`);
            return {
              ...photo,
              url: undefined
            };
          }

          // Generate public S3 URL that never expires
          const publicUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${photo.s3Key}`;
          
          return {
            ...photo,
            url: publicUrl
          };
        } catch (error) {
          console.error(`Error generating URL for photo ${photo.filename}:`, error);
          return {
            ...photo,
            url: undefined
          };
        }
      });

      return {
        ...resources,
        photos: photosWithFreshUrls
      };
    } catch (error) {
      console.error('Error generating photo URLs:', error);
      return resources; // Return original resources if URL generation fails
    }
  }

  private async saveProjectResources(projectId: string, resources: ProjectResources): Promise<void> {
    try {
      const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
      const s3Client = new S3Client({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
      });

      const command = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET || 'genius-untitled',
        Key: `project-resources/${projectId}_resources.json`,
        Body: JSON.stringify(resources),
        ContentType: 'application/json',
        Metadata: {
          'project-id': projectId,
          'updated-at': new Date().toISOString()
        }
      });

      await s3Client.send(command);
      console.log(`💾 Saved project resources for: ${projectId}`);
    } catch (error) {
      console.error('Error saving project resources to S3:', error);
      throw error;
    }
  }

  private generatePhotoId(projectId: string, filename: string): string {
    return `photo_${projectId}_${filename.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
  }

  private generateVideoLinkId(projectId: string, videoId: string): string {
    return `link_${projectId}_${videoId}_${Date.now()}`;
  }

  private isValidCache(): boolean {
    return Date.now() - this.cacheTimestamp < this.CACHE_TTL;
  }

  private invalidateCache(): void {
    this.projectResourcesCache.clear();
    this.cacheTimestamp = 0;
  }
}

export default ProjectLinkingService; 