import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import AWSS3Service from '@/services/aws-s3.service';

export async function POST(request: NextRequest) {
  // Check admin authentication
  const isAuthenticated = await checkAdminAuth();
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('📎 Journal file upload API called');

    const body = await request.json();
    const { fileName, fileSize, fileType, fileBuffer, fileCategory = 'document' } = body;

    if (!fileName || !fileBuffer) {
      return NextResponse.json(
        { error: 'Missing required fields: fileName, fileBuffer' },
        { status: 400 }
      );
    }

    console.log(`📁 Uploading file: ${fileName} (${fileSize} bytes)`);
    console.log(`🏷️ File type: ${fileType}, Category: ${fileCategory}`);

    // Convert base64 buffer back to Buffer
    const buffer = Buffer.from(fileBuffer, 'base64');
    
    // Validate file type based on category
    const fileExtension = fileName.split('.').pop()?.toLowerCase();
    let allowedExtensions: string[] = [];
    let s3Folder = '';

    switch (fileCategory) {
      case 'image':
        allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'];
        s3Folder = 'images';
        break;
      case 'diagram':
        allowedExtensions = ['jpg', 'jpeg', 'png', 'svg', 'pdf', 'drawio', 'mermaid'];
        s3Folder = 'diagrams';
        break;
      case 'document':
        allowedExtensions = ['pdf', 'doc', 'docx', 'txt', 'md', 'json', 'yaml', 'yml'];
        s3Folder = 'documents';
        break;
      case 'code':
        allowedExtensions = ['js', 'ts', 'py', 'java', 'cpp', 'cs', 'go', 'rs', 'sql', 'sh', 'json', 'yaml', 'xml'];
        s3Folder = 'code';
        break;
      case 'screenshot':
        allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
        s3Folder = 'screenshots';
        break;
      default:
        allowedExtensions = ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx', 'txt', 'md'];
        s3Folder = 'misc';
    }

    if (!allowedExtensions.includes(fileExtension || '')) {
      return NextResponse.json(
        { 
          error: `Invalid file type for ${fileCategory}. Allowed types: ${allowedExtensions.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Create S3 key for journal files
    const timestamp = Date.now();
    const cleanFileName = `${timestamp}_${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const s3Key = `journal/${s3Folder}/${cleanFileName}`;

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
          'file-category': fileCategory,
          'original-name': fileName,
          'uploaded-at': new Date().toISOString(),
          'uploaded-by': 'journal-system'
        }
      });

      await s3Client.send(command);
      
      // Get the URL for the uploaded file
      const s3Service = AWSS3Service.getInstance();
      const url = await s3Service.getFileUrl(s3Key);

      const uploadedFile = {
        id: `journal_file_${timestamp}`,
        filename: cleanFileName,
        originalName: fileName,
        s3Key,
        url,
        fileType,
        fileCategory,
        size: buffer.length,
        uploadedAt: new Date().toISOString()
      };

      console.log(`✅ File uploaded to S3: ${s3Key}`);

      return NextResponse.json({
        success: true,
        file: uploadedFile,
        message: 'File uploaded successfully'
      });

    } catch (s3Error) {
      console.error('❌ S3 upload failed:', s3Error);
      return NextResponse.json(
        { error: 'Failed to upload to S3' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('💥 Journal file upload API error:', error);
    return NextResponse.json(
      { error: 'Internal server error during file upload' },
      { status: 500 }
    );
  }
}
