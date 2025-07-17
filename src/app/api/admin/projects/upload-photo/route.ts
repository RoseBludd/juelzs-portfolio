import { NextRequest, NextResponse } from 'next/server';
import AWSS3Service from '@/services/aws-s3.service';
import ProjectLinkingService, { ProjectPhoto } from '@/services/project-linking.service';

export async function POST(request: NextRequest) {
  try {
    console.log('📸 Admin photo upload API called');

    const body = await request.json();
    const { projectId, fileName, fileSize, fileType, category, fileBuffer } = body;

    if (!projectId || !fileName || !fileBuffer || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, fileName, fileBuffer, category' },
        { status: 400 }
      );
    }

    console.log(`📁 Uploading photo for project: ${projectId}`);
    console.log(`📄 File: ${fileName} (${fileSize} bytes)`);
    console.log(`🏷️ Category: ${category}`);

    // Convert base64 buffer back to Buffer
    const buffer = Buffer.from(fileBuffer, 'base64');
    
    // Upload directly to S3 using manual approach since we have a buffer
    const s3Service = AWSS3Service.getInstance();
    
    // Validate file type
    const fileExtension = fileName.split('.').pop()?.toLowerCase();
    if (!['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(fileExtension || '')) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload JPG, PNG, WebP, or GIF files.' },
        { status: 400 }
      );
    }

    // Create S3 key and upload directly
    const timestamp = Date.now();
    const cleanFileName = `${timestamp}_${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const s3Key = `projects/${projectId}/photos/${cleanFileName}`;

    try {
      // Use S3 client directly for buffer upload
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
        Key: s3Key,
        Body: buffer,
        ContentType: fileType,
        Metadata: {
          'project-id': projectId,
          'category': category,
          'original-name': fileName,
          'uploaded-at': new Date().toISOString()
        }
      });

      await s3Client.send(command);
      
      // Get the URL for the uploaded photo
      const url = await s3Service.getFileUrl(s3Key);

      const photo = {
        id: `photo_${projectId}_${cleanFileName.replace(/[^a-zA-Z0-9]/g, '_')}`,
        projectId,
        filename: cleanFileName,
        s3Key,
        url,
        category: category as ProjectPhoto['category'],
        order: 0,
        uploadedAt: new Date(),
        size: buffer.length,
      };

      console.log(`✅ Photo uploaded to S3: ${s3Key}`);

      // Add photo to project linking service
      const projectLinkingService = ProjectLinkingService.getInstance();
      await projectLinkingService.addPhotoToProject(projectId, {
        projectId: photo.projectId,
        filename: photo.filename,
        s3Key: photo.s3Key,
        url: photo.url,
        category: photo.category,
        order: 0,
        size: photo.size,
      });

      console.log(`🔗 Photo linked to project: ${projectId}`);

      return NextResponse.json({
        success: true,
        photo: photo,
        message: 'Photo uploaded successfully'
      });

    } catch (s3Error) {
      console.error('❌ S3 upload failed:', s3Error);
      return NextResponse.json(
        { error: 'Failed to upload to S3' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('💥 Photo upload API error:', error);
    return NextResponse.json(
      { error: 'Internal server error during photo upload' },
      { status: 500 }
    );
  }
} 