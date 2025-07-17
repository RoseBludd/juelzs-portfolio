import { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import TranscriptAnalysisService, { MeetingInsights } from './transcript-analysis.service';
import { LeadershipAnalysis } from './meeting-analysis.service';
import { ArchitectureAnalysis } from './architecture-analysis.service';
import { ProjectPhoto } from './project-linking.service';

export interface MeetingFile {
  id: string;
  filename: string;
  type: 'video' | 'transcript' | 'recap';
  s3Key: string;
  url?: string;
  lastModified: Date;
  size: number;
  meetingTitle?: string;
  participants?: string[];
  dateRecorded?: string;
}

export interface MeetingGroup {
  id: string;
  title: string;
  dateRecorded: string;
  participants: string[];
  video?: MeetingFile;
  transcript?: MeetingFile;
  recap?: MeetingFile;
  insights?: MeetingInsights;
  category?: string;
  isPortfolioRelevant?: boolean;
}

export interface PhotoUploadResult {
  success: boolean;
  photo?: ProjectPhoto;
  error?: string;
}

class AWSS3Service {
  private static instance: AWSS3Service;
  private s3Client: S3Client;
  private bucketName: string;
  private meetingsPath: string;
  private transcriptAnalysis: TranscriptAnalysisService;

  private constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
    this.bucketName = process.env.AWS_S3_BUCKET || 'genius-untitled';
    this.meetingsPath = process.env.AWS_S3_MEETINGS_PATH || 'meetings';
    this.transcriptAnalysis = TranscriptAnalysisService.getInstance();
  }

  public static getInstance(): AWSS3Service {
    if (!AWSS3Service.instance) {
      AWSS3Service.instance = new AWSS3Service();
    }
    return AWSS3Service.instance;
  }

  /**
   * List all meeting files from S3
   */
  async listMeetingFiles(): Promise<MeetingFile[]> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: this.meetingsPath + '/',
      });

      const response = await this.s3Client.send(command);
      
      if (!response.Contents) {
        return [];
      }

      const files: MeetingFile[] = [];
      
      for (const object of response.Contents) {
        if (!object.Key || !object.LastModified) continue;

        const filename = object.Key.split('/').pop() || '';
        const type = this.getFileType(filename);
        
        if (type) {
          files.push({
            id: this.generateFileId(object.Key),
            filename,
            type,
            s3Key: object.Key,
            lastModified: object.LastModified,
            size: object.Size || 0,
            meetingTitle: this.extractMeetingTitle(filename),
            dateRecorded: this.extractDateFromFilename(filename),
          });
        }
      }

      return files;
    } catch (error) {
      console.error('Error listing meeting files:', error);
      return [];
    }
  }

  /**
   * Get pre-signed URL for a file
   */
  async getFileUrl(s3Key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
      });

      const signedUrl = await getSignedUrl(this.s3Client, command, { expiresIn });
      return signedUrl;
    } catch (error) {
      console.error('Error generating signed URL:', error);
      throw error;
    }
  }

  /**
   * Get file content as text (for transcripts and recaps)
   */
  async getFileContent(s3Key: string): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
      });

      const response = await this.s3Client.send(command);
      
      if (!response.Body) {
        return '';
      }

      // Convert stream to string
      const body = await response.Body.transformToString();
      return body;
    } catch (error) {
      console.error('Error getting file content:', error);
      return '';
    }
  }

  /**
   * Group meeting files by meeting session and analyze for portfolio relevance
   */
  async getMeetingGroups(): Promise<MeetingGroup[]> {
    try {
      console.log('🔍 Starting getMeetingGroups...');
      const files = await this.listMeetingFiles();
      console.log(`📁 Found ${files.length} meeting files`);
      
      const groups = new Map<string, MeetingGroup>();

      for (const file of files) {
        try {
          const meetingKey = this.generateMeetingKey(file.filename);
          
          if (!groups.has(meetingKey)) {
            groups.set(meetingKey, {
              id: meetingKey,
              title: file.meetingTitle || 'Untitled Meeting',
              dateRecorded: file.dateRecorded || new Date().toISOString(),
              participants: file.participants || [],
            });
          }

          const group = groups.get(meetingKey)!;
          
          // Add file URL with error handling
          try {
            file.url = await this.getFileUrl(file.s3Key);
          } catch (urlError) {
            console.warn(`⚠️ Failed to generate URL for ${file.filename}:`, urlError);
            file.url = ''; // Fallback to empty URL
          }
          
          // Assign file to appropriate property
          switch (file.type) {
            case 'video':
              group.video = file;
              break;
            case 'transcript':
              group.transcript = file;
              break;
            case 'recap':
              group.recap = file;
              break;
          }
        } catch (fileError) {
          console.error(`❌ Error processing file ${file.filename}:`, fileError);
          // Continue with next file instead of failing completely
          continue;
        }
      }

      console.log(`📊 Grouped into ${groups.size} meeting groups`);

      // Analyze transcripts for portfolio relevance
      const analyzedGroups: MeetingGroup[] = [];
      
      for (const group of groups.values()) {
        // First check for manual portfolio settings (these override AI analysis)
        const manualSettings = await this.getMeetingPortfolioSettings(group.id);
        
        if (group.transcript) {
          try {
            // Get transcript content with timeout and error handling
            console.log(`🔍 Analyzing transcript for ${group.title}...`);
            const transcriptContent = await this.getFileContent(group.transcript.s3Key);
            
            if (transcriptContent && transcriptContent.length > 50) {
              // Analyze the transcript with timeout protection
              const insights = await Promise.race([
                this.transcriptAnalysis.analyzeTranscript(transcriptContent, group.transcript.filename),
                new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('Analysis timeout')), 30000) // 30 second timeout
                )
              ]) as MeetingInsights;
              
              // Include all meetings with analysis results
              group.insights = insights;
              group.title = insights.title;
              group.participants = insights.participants.length > 0 ? insights.participants : group.participants;
              group.category = insights.category.type;
              
              // Manual settings override AI analysis
              group.isPortfolioRelevant = manualSettings ? manualSettings.isPortfolioRelevant : insights.isPortfolioRelevant;
              
              console.log(`✅ Successfully analyzed: ${group.title} (relevant: ${group.isPortfolioRelevant}${manualSettings ? ' - manual override' : ''})`);
            } else {
              console.log(`⚠️ Transcript too short or empty for ${group.title}, marking as non-relevant`);
              group.isPortfolioRelevant = manualSettings ? manualSettings.isPortfolioRelevant : false;
            }
            
            analyzedGroups.push(group);
          } catch (error) {
            console.error(`❌ Error analyzing meeting ${group.id}:`, error instanceof Error ? error.message : 'Unknown error');
            // Include without analysis if there's an error - don't lose the meeting
            group.isPortfolioRelevant = manualSettings ? manualSettings.isPortfolioRelevant : false;
            group.category = 'uncategorized';
            analyzedGroups.push(group);
          }
        } else {
          // Include meetings with videos but no transcripts (user can decide)
          console.log(`📹 Including meeting without transcript: ${group.title}`);
          group.isPortfolioRelevant = manualSettings ? manualSettings.isPortfolioRelevant : false;
          group.category = 'uncategorized';
          analyzedGroups.push(group);
        }
      }

      console.log(`✅ Successfully processed ${analyzedGroups.length} meeting groups`);

      // Sort by portfolio relevance and date
      return analyzedGroups
        .sort((a, b) => {
          // First sort by portfolio relevance
          if (a.isPortfolioRelevant && !b.isPortfolioRelevant) return -1;
          if (!a.isPortfolioRelevant && b.isPortfolioRelevant) return 1;
          // Then by date
          return new Date(b.dateRecorded).getTime() - new Date(a.dateRecorded).getTime();
        });
    } catch (error) {
      console.error('❌ Fatal error in getMeetingGroups:', error);
      // Return empty array instead of throwing to prevent 500 errors
      return [];
    }
  }

  /**
   * Get a specific meeting group by ID
   */
  async getMeetingGroupById(id: string): Promise<MeetingGroup | null> {
    const groups = await this.getMeetingGroups();
    return groups.find(group => group.id === id) || null;
  }

  /**
   * Get meetings filtered by category
   */
  async getMeetingsByCategory(category: string): Promise<MeetingGroup[]> {
    const groups = await this.getMeetingGroups();
    return groups.filter(group => group.category === category);
  }

  /**
   * Get all available meeting categories
   */
  async getMeetingCategories(): Promise<{category: string, count: number}[]> {
    const groups = await this.getMeetingGroups();
    const categoryCount = new Map<string, number>();
    
    groups.forEach(group => {
      if (group.category) {
        categoryCount.set(group.category, (categoryCount.get(group.category) || 0) + 1);
      }
    });

    return Array.from(categoryCount.entries()).map(([category, count]) => ({
      category: category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      count
    }));
  }

  /**
   * Store leadership analysis results in S3
   */
  async storeAnalysisResult(meetingId: string, analysis: LeadershipAnalysis): Promise<void> {
    try {
      const analysisKey = `${this.meetingsPath}/analysis/${meetingId}_analysis.json`;
      
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: analysisKey,
        Body: JSON.stringify(analysis, null, 2),
        ContentType: 'application/json',
        Metadata: {
          'meeting-id': meetingId,
          'analysis-version': '1.0',
          'created-at': new Date().toISOString()
        }
      });

      await this.s3Client.send(command);
      console.log(`✅ Analysis stored for meeting: ${meetingId}`);
    } catch (error) {
      console.error(`❌ Error storing analysis for ${meetingId}:`, error);
    }
  }

  /**
   * Store overall leadership analysis in S3
   */
  async storeOverallAnalysis(analysis: Record<string, unknown>): Promise<void> {
    try {
      const analysisKey = 'overall-leadership-analysis/overall_analysis.json';
      
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: analysisKey,
        Body: JSON.stringify(analysis, null, 2),
        ContentType: 'application/json',
        Metadata: {
          'analysis-type': 'overall-leadership',
          'analysis-version': '1.0',
          'created-at': new Date().toISOString()
        }
      });

      await this.s3Client.send(command);
      console.log('✅ Overall leadership analysis stored');
    } catch (error) {
      console.error('❌ Error storing overall analysis:', error);
    }
  }

  /**
   * Get cached leadership analysis from S3
   */
  async getCachedAnalysis(meetingId: string): Promise<LeadershipAnalysis | null> {
    try {
      const analysisKey = `${this.meetingsPath}/analysis/${meetingId}_analysis.json`;
      
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: analysisKey,
      });

      const response = await this.s3Client.send(command);
      
      if (!response.Body) {
        return null;
      }

      const analysisContent = await response.Body.transformToString();
      const analysis = JSON.parse(analysisContent) as LeadershipAnalysis;
      
      console.log(`✅ Retrieved cached analysis for: ${meetingId}`);
      return analysis;
    } catch (error) {
      // Analysis doesn't exist yet, that's fine
      if (error instanceof Error && error.name === 'NoSuchKey') {
        console.log(`📄 No cached analysis found for: ${meetingId}`);
        return null;
      }
      console.error(`❌ Error retrieving cached analysis for ${meetingId}:`, error);
      return null;
    }
  }

  /**
   * Check if analysis exists for a meeting
   */
  async hasAnalysis(meetingId: string): Promise<boolean> {
    const analysis = await this.getCachedAnalysis(meetingId);
    return analysis !== null;
  }

  /**
   * Store meeting portfolio settings in S3
   */
  async storeMeetingPortfolioSettings(meetingId: string, isRelevant: boolean, showcaseDescription?: string): Promise<void> {
    try {
      const settingsKey = `${this.meetingsPath}/portfolio-settings/${meetingId}_settings.json`;
      
      const settings = {
        meetingId,
        isPortfolioRelevant: isRelevant,
        showcaseDescription,
        updatedAt: new Date().toISOString()
      };
      
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: settingsKey,
        Body: JSON.stringify(settings, null, 2),
        ContentType: 'application/json',
        Metadata: {
          'meeting-id': meetingId,
          'updated-at': new Date().toISOString()
        }
      });

      await this.s3Client.send(command);
      console.log(`✅ Portfolio settings stored for meeting: ${meetingId} (relevant: ${isRelevant})`);
    } catch (error) {
      console.error(`❌ Error storing portfolio settings for ${meetingId}:`, error);
      throw error;
    }
  }

  /**
   * Get meeting portfolio settings from S3
   */
  async getMeetingPortfolioSettings(meetingId: string): Promise<{isPortfolioRelevant: boolean, showcaseDescription?: string} | null> {
    try {
      const settingsKey = `${this.meetingsPath}/portfolio-settings/${meetingId}_settings.json`;
      
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: settingsKey,
      });

      const response = await this.s3Client.send(command);
      
      if (!response.Body) {
        return null;
      }

      const settingsContent = await response.Body.transformToString();
      const settings = JSON.parse(settingsContent);
      
      console.log(`✅ Retrieved portfolio settings for: ${meetingId} (relevant: ${settings.isPortfolioRelevant})`);
      return {
        isPortfolioRelevant: settings.isPortfolioRelevant,
        showcaseDescription: settings.showcaseDescription
      };
    } catch (error) {
      // Settings don't exist yet, that's fine
      if (error instanceof Error && error.name === 'NoSuchKey') {
        console.log(`📄 No portfolio settings found for: ${meetingId}`);
        return null;
      }
      console.error(`❌ Error retrieving portfolio settings for ${meetingId}:`, error);
      return null;
    }
  }

  /**
   * Store architecture analysis results in S3
   */
  async storeArchitectureAnalysis(projectId: string, analysis: ArchitectureAnalysis): Promise<void> {
    try {
      const analysisKey = `architecture-analysis/${projectId}_analysis.json`;
      
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: analysisKey,
        Body: JSON.stringify(analysis, null, 2),
        ContentType: 'application/json',
        Metadata: {
          'project-id': projectId,
          'analysis-version': '1.0',
          'created-at': new Date().toISOString()
        }
      });

      await this.s3Client.send(command);
      console.log(`✅ Architecture analysis stored for project: ${projectId}`);
    } catch (error) {
      console.error(`❌ Error storing architecture analysis for ${projectId}:`, error);
    }
  }

  /**
   * Get cached architecture analysis from S3
   */
  async getCachedArchitectureAnalysis(projectId: string): Promise<ArchitectureAnalysis | null> {
    try {
      const analysisKey = `architecture-analysis/${projectId}_analysis.json`;
      
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: analysisKey,
      });

      const response = await this.s3Client.send(command);
      
      if (!response.Body) {
        return null;
      }

      const analysisContent = await response.Body.transformToString();
      const analysis = JSON.parse(analysisContent);
      
      console.log(`✅ Retrieved cached architecture analysis for: ${projectId}`);
      return analysis;
    } catch (error) {
      // Analysis doesn't exist yet, that's fine
      if (error instanceof Error && error.name === 'NoSuchKey') {
        console.log(`📄 No cached architecture analysis found for: ${projectId}`);
        return null;
      }
      console.error(`❌ Error retrieving cached architecture analysis for ${projectId}:`, error);
      return null;
    }
  }

  /**
   * Check if architecture analysis exists for a project
   */
  async hasArchitectureAnalysis(projectId: string): Promise<boolean> {
    const analysis = await this.getCachedArchitectureAnalysis(projectId);
    return analysis !== null;
  }

  /**
   * Upload photo to S3 for project gallery
   */
  async uploadProjectPhoto(projectId: string, file: File, category: ProjectPhoto['category']): Promise<PhotoUploadResult> {
    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (!['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(fileExtension || '')) {
        return { success: false, error: 'Invalid file type. Please upload JPG, PNG, WebP, or GIF files.' };
      }

      const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const s3Key = `projects/${projectId}/photos/${fileName}`;

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
        Body: file,
        ContentType: file.type,
        Metadata: {
          'project-id': projectId,
          'category': category,
          'original-name': file.name,
          'uploaded-at': new Date().toISOString()
        }
      });

      await this.s3Client.send(command);
      
      // Get the URL for the uploaded photo
      const url = await this.getFileUrl(s3Key);

      const photo: ProjectPhoto = {
        id: this.generatePhotoId(projectId, fileName),
        projectId,
        filename: fileName,
        s3Key,
        url,
        category,
        order: 0, // Will be updated by project linking service
        uploadedAt: new Date(),
        size: file.size,
      };

      return { success: true, photo };
    } catch (error) {
      console.error('Error uploading photo:', error);
      return { success: false, error: 'Failed to upload photo. Please try again.' };
    }
  }

  /**
   * Delete photo from S3
   */
  async deleteProjectPhoto(s3Key: string): Promise<boolean> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      console.error('Error deleting photo:', error);
      return false;
    }
  }

  /**
   * List all photos for a project
   */
  async listProjectPhotos(projectId: string): Promise<ProjectPhoto[]> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: `projects/${projectId}/photos/`,
      });

      const response = await this.s3Client.send(command);
      
      if (!response.Contents) {
        return [];
      }

      const photos: ProjectPhoto[] = [];
      
      for (const object of response.Contents) {
        if (!object.Key || !object.LastModified) continue;

        const filename = object.Key.split('/').pop() || '';
        const category = this.extractPhotoCategory(filename);
        
        if (category) {
          const url = await this.getFileUrl(object.Key);
          
          photos.push({
            id: this.generatePhotoId(projectId, filename),
            projectId,
            filename,
            s3Key: object.Key,
            url,
            category,
            order: 0,
            uploadedAt: object.LastModified,
            size: object.Size || 0,
          });
        }
      }

      return photos;
    } catch (error) {
      console.error('Error listing project photos:', error);
      return [];
    }
  }

  /**
   * Get presigned URL for photo upload (for direct browser uploads)
   */
  async getPhotoUploadUrl(projectId: string, filename: string, contentType: string): Promise<string> {
    try {
      const s3Key = `projects/${projectId}/photos/${Date.now()}_${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
        ContentType: contentType,
      });

      const signedUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 300 }); // 5 minutes
      return signedUrl;
    } catch (error) {
      console.error('Error generating upload URL:', error);
      throw error;
    }
  }

  /**
   * Private helper methods
   */
  private getFileType(filename: string): 'video' | 'transcript' | 'recap' | null {
    const ext = filename.toLowerCase().split('.').pop();
    
    if (ext === 'mp4') return 'video';
    if (ext === 'txt') {
      // Check if it's a transcript or recap based on filename
      if (filename.toLowerCase().includes('transcript')) return 'transcript';
      if (filename.toLowerCase().includes('recap') || filename.toLowerCase().includes('summary')) return 'recap';
      return 'transcript'; // Default to transcript for .txt files
    }
    
    return null;
  }

  private generateFileId(s3Key: string): string {
    return s3Key.replace(/[^a-zA-Z0-9]/g, '_');
  }

  private generateMeetingKey(filename: string): string {
    // Extract base meeting name (remove extensions and suffixes)
    const baseName = filename
      .replace(/\.(mp4|txt)$/i, '')
      .replace(/_?(transcript|recap|summary|video)$/i, '') // Added 'video' to suffixes
      .replace(/[^a-zA-Z0-9\-_]/g, '_');
    
    return baseName;
  }

  private extractMeetingTitle(filename: string): string {
    // Convert filename to readable title
    const baseName = filename
      .replace(/\.(mp4|txt)$/i, '')
      .replace(/_?(transcript|recap|summary)$/i, '')
      .replace(/[_-]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
    
    return baseName || 'Untitled Meeting';
  }

  private extractDateFromFilename(filename: string): string {
    // Try to extract date from filename
    const dateMatch = filename.match(/(\d{4}[-_]\d{2}[-_]\d{2})/);
    if (dateMatch) {
      return dateMatch[1].replace(/_/g, '-');
    }
    
    // Default to current date if no date found
    return new Date().toISOString().split('T')[0];
  }

  private generatePhotoId(projectId: string, filename: string): string {
    return `photo_${projectId}_${filename.replace(/[^a-zA-Z0-9]/g, '_')}`;
  }

  private extractPhotoCategory(filename: string): ProjectPhoto['category'] | null {
    const lower = filename.toLowerCase();
    
    if (lower.includes('screenshot') || lower.includes('screen')) return 'screenshot';
    if (lower.includes('diagram') || lower.includes('architecture')) return 'diagram';
    if (lower.includes('demo') || lower.includes('showcase')) return 'demo';
    if (lower.includes('interface') || lower.includes('ui')) return 'interface';
    if (lower.includes('mobile') || lower.includes('phone')) return 'mobile';
    if (lower.includes('analytics') || lower.includes('dashboard') || lower.includes('metrics')) return 'analytics';
    
    // Default to screenshot for most images
    return 'screenshot';
  }
}

export default AWSS3Service; 