#!/usr/bin/env node

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env') });

class SalesJobsUrlFixer {
  constructor() {
    this.projectId = 'sales-jobs';
    
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
    
    this.bucketName = process.env.AWS_S3_BUCKET || 'genius-untitled';
  }

  async getProjectResources() {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: `project-resources/${this.projectId}_resources.json`,
      });

      const response = await this.s3Client.send(command);
      const data = await response.Body.transformToString();
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading project resources:', error.message);
      throw error;
    }
  }

  async updateProjectResources(resources) {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: `project-resources/${this.projectId}_resources.json`,
        Body: JSON.stringify(resources, null, 2),
        ContentType: 'application/json',
      });

      await this.s3Client.send(command);
      console.log(`✅ Updated project resources for ${this.projectId}`);
    } catch (error) {
      console.error(`❌ Failed to update project resources:`, error.message);
      throw error;
    }
  }

  async fixPhotoUrls() {
    console.log('🔧 Fixing Photo URLs for Sales Jobs');
    console.log('====================================');
    
    const resources = await this.getProjectResources();
    console.log(`📊 Total photos: ${resources.photos.length}`);

    // Generate fresh public URLs for all photos
    const region = process.env.AWS_REGION || 'us-east-1';
    resources.photos = resources.photos.map((photo, index) => {
      const oldUrl = photo.url;
      const newUrl = `https://${this.bucketName}.s3.${region}.amazonaws.com/${photo.s3Key}`;
      
      console.log(`🔄 Photo ${index + 1}: ${photo.filename}`);
      console.log(`   Old URL: ${oldUrl.includes('?') ? 'Presigned URL (expired)' : 'Public URL'}`);
      console.log(`   New URL: Public URL (never expires)`);
      
      return {
        ...photo,
        url: newUrl
      };
    });

    // Update timestamp
    resources.lastUpdated = new Date().toISOString();

    await this.updateProjectResources(resources);
    console.log('✅ Successfully fixed all photo URLs!');

    return resources;
  }

  async verifyResults() {
    console.log('\n✅ Verification:');
    console.log('=================');
    
    const resources = await this.getProjectResources();
    
    console.log('📸 Updated photo URLs:');
    resources.photos.forEach((photo, index) => {
      console.log(`   ✅ ${index + 1}. ${photo.filename}`);
      console.log(`      URL: ${photo.url}`);
      console.log(`      Category: ${photo.category}`);
    });
  }
}

async function main() {
  const fixer = new SalesJobsUrlFixer();
  
  try {
    await fixer.fixPhotoUrls();
    await fixer.verifyResults();
    
    console.log('\n🎯 Next Steps:');
    console.log('   • Refresh your browser at /projects/sales-jobs');
    console.log('   • Click on Project Showcase tab');
    console.log('   • Photos should now display properly!');
    
  } catch (error) {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  }
}

main(); 