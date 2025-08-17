import { S3Client } from '@aws-sdk/client-s3';

// Create S3 client with conditional initialization
export const createS3Client = () => {
if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.warn('AWS credentials not found in environment variables');
    return null;
}

if (!process.env.AWS_S3_BUCKET) {
    console.warn('AWS S3 bucket name not found in environment variables');
    return null;
}

  return new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
};

// Initialize S3 client
export const s3Client = createS3Client();

export const S3_BUCKET = process.env.AWS_S3_BUCKET;
