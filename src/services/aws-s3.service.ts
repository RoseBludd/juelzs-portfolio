import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import TranscriptAnalysisService, { MeetingInsights } from './transcript-analysis.service';

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
    const files = await this.listMeetingFiles();
    const groups = new Map<string, MeetingGroup>();

    for (const file of files) {
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
      
      // Add file URL
      file.url = await this.getFileUrl(file.s3Key);
      
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
    }

    // Analyze transcripts for portfolio relevance
    const analyzedGroups: MeetingGroup[] = [];
    
    for (const group of groups.values()) {
      if (group.transcript) {
        try {
          // Get transcript content
          const transcriptContent = await this.getFileContent(group.transcript.s3Key);
          
          // Analyze the transcript
          const insights = await this.transcriptAnalysis.analyzeTranscript(
            transcriptContent, 
            group.transcript.filename
          );
          
          // Only include portfolio-relevant meetings
          if (insights.isPortfolioRelevant) {
            group.insights = insights;
            group.title = insights.title;
            group.participants = insights.participants.length > 0 ? insights.participants : group.participants;
            group.category = insights.category.type;
            group.isPortfolioRelevant = true;
            analyzedGroups.push(group);
          }
        } catch (error) {
          console.error(`Error analyzing meeting ${group.id}:`, error);
          // Include without analysis if there's an error
          group.isPortfolioRelevant = false;
        }
      } else {
        // Include meetings with videos but no transcripts (user can decide)
        group.isPortfolioRelevant = false; // Mark as uncertain
      }
    }

    // Sort by portfolio relevance and date
    return analyzedGroups
      .sort((a, b) => {
        // First sort by portfolio relevance
        if (a.isPortfolioRelevant && !b.isPortfolioRelevant) return -1;
        if (!a.isPortfolioRelevant && b.isPortfolioRelevant) return 1;
        // Then by date
        return new Date(b.dateRecorded).getTime() - new Date(a.dateRecorded).getTime();
      });
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
      .replace(/_?(transcript|recap|summary)$/i, '')
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
}

export default AWSS3Service; 