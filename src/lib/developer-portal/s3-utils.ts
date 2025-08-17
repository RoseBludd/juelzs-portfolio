import { PutObjectCommand, DeleteObjectCommand, GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { s3Client, S3_BUCKET } from './aws-config';

export interface PresignedUrlResponse {
  uploadUrl: string;
  key: string;
}

export async function generatePresignedUrl(
  taskId: string,
  fileName: string,
  fileType: string
): Promise<PresignedUrlResponse> {
  if (!s3Client) {
    throw new Error('S3 client not available - AWS credentials may not be configured');
  }

  if (!S3_BUCKET) {
    throw new Error('S3 bucket not configured');
  }

  const key = `tasks/${taskId}/${Date.now()}-${fileName}`;
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    ContentType: fileType,
  });

  try {
    const uploadUrl = await getSignedUrl(s3Client as S3Client, command, { expiresIn: 3600 });
    return { uploadUrl, key };
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    throw new Error('Failed to generate upload URL');
  }
}

export async function deleteFile(key: string): Promise<void> {
  if (!s3Client) {
    throw new Error('S3 client not available - AWS credentials may not be configured');
  }

  if (!S3_BUCKET) {
    throw new Error('S3 bucket not configured');
  }

  const command = new DeleteObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
  });

  try {
    await s3Client.send(command);
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    throw new Error('Failed to delete file');
  }
}

/**
 * Generate a presigned URL for downloading an S3 object
 * @param key - The S3 object key (e.g., "profile-pictures/filename.jpg")
 * @param expiresIn - URL expiration time in seconds (default: 1 hour)
 * @returns Promise<string> - The presigned URL
 */
export async function generateDownloadPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
  try {
    if (!s3Client) {
      throw new Error('S3 client not available - AWS credentials may not be configured');
    }

    if (!S3_BUCKET) {
      throw new Error('S3 bucket not configured');
    }

    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    });

    const signedUrl = await getSignedUrl(s3Client as S3Client, command, { expiresIn });
    return signedUrl;
  } catch (error) {
    console.error('Error generating download presigned URL:', error);
    throw new Error('Failed to generate download presigned URL');
  }
}

/**
 * Extract S3 key from internal profile picture URLs
 * @param url - The internal URL (e.g., "/api/images/profile/filename.jpg" or "https://domain.com/api/images/profile/filename.jpg")
 * @returns string | null - The S3 key or null if not a valid profile picture URL
 */
export function extractS3KeyFromProfileUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  
  // Extract filename from internal URLs like "/api/images/profile/filename.jpg" or "https://domain.com/api/images/profile/filename.jpg"
  const match = url.match(/\/api\/images\/profile\/(.+)$/);
  if (match && match[1]) {
    return `profile-pictures/${match[1]}`;
  }
  
  // If it's already an S3 URL or other external URL, return null (we can't process it)
  return null;
}

/**
 * Convert internal profile picture URLs to direct S3 presigned URLs
 * @param url - The internal profile picture URL
 * @returns Promise<string | null> - The presigned URL or null if conversion failed
 */
export async function convertToPresignedUrl(url: string | null | undefined): Promise<string | null> {
  const s3Key = extractS3KeyFromProfileUrl(url);
  if (!s3Key) return url || null; // Return original URL if we can't extract S3 key
  
  try {
    return await generateDownloadPresignedUrl(s3Key, 3600); // 1 hour expiration
  } catch (error) {
    console.error('Error converting to presigned URL:', error);
    return null;
  }
} 
