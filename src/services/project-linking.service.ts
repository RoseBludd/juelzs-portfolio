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
  lastUpdated: Date;
}

class ProjectLinkingService {
  private static instance: ProjectLinkingService;
  private projectResourcesCache: Map<string, ProjectResources> = new Map();
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

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
      return this.projectResourcesCache.get(projectId)!;
    }

    // Load from storage (for now using localStorage, could be moved to S3 or database)
    const resources = await this.loadProjectResourcesFromStorage(projectId);
    
    // Cache the result
    this.projectResourcesCache.set(projectId, resources);
    this.cacheTimestamp = Date.now();

    return resources;
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
    // For now, get from localStorage. In production, this would query S3 or database
    const projects: string[] = [];
    
    if (typeof window !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('project_resources_')) {
          projects.push(key.replace('project_resources_', ''));
        }
      }
    }

    return projects;
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
    // For development, use localStorage. In production, this would be S3 or database
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`project_resources_${projectId}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
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
        } catch (error) {
          console.error('Error parsing stored project resources:', error);
        }
      }
    }

    // Return empty resources structure
    return {
      projectId,
      photos: [],
      linkedVideos: [],
      lastUpdated: new Date(),
    };
  }

  private async saveProjectResources(projectId: string, resources: ProjectResources): Promise<void> {
    // For development, use localStorage. In production, this would be S3 or database
    if (typeof window !== 'undefined') {
      localStorage.setItem(`project_resources_${projectId}`, JSON.stringify(resources));
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