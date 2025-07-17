#!/usr/bin/env node

const CONFIG = {
  WRONG_PROJECT_ID: 'internal-messaging-app', // Project that got the wrong photos
  ADMIN_PASSWORD: 'TheWorldIsYours',
  BASE_URL: 'http://localhost:3000',
  
  // The 6 photos that were uploaded to the wrong project (based on the timestamps from the log)
  PHOTOS_TO_REMOVE: [
    'Screenshot_2025-07-16_222251',
    'Screenshot_2025-07-16_222325', 
    'Screenshot_2025-07-16_222409',
    'Screenshot_2025-07-16_222433',
    'Screenshot_2025-07-16_222444',
    'Screenshot_2025-07-16_222516'
  ]
};

class DuplicatePhotoCleanup {
  constructor() {
    this.adminToken = null;
  }

  async authenticate() {
    console.log('🔐 Authenticating as admin...');
    
    try {
      const response = await fetch(`${CONFIG.BASE_URL}/api/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: CONFIG.ADMIN_PASSWORD,
        }),
      });

      if (!response.ok) {
        throw new Error('Authentication failed');
      }

      const result = await response.json();
      this.adminToken = result.token;
      console.log('✅ Admin authentication successful');
      return true;
    } catch (error) {
      console.error('❌ Authentication failed:', error);
      return false;
    }
  }

  async getProjectResources(projectId) {
    try {
      const response = await fetch(`${CONFIG.BASE_URL}/api/admin/projects/debug-resources?projectId=${projectId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.adminToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get project resources: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting project resources:', error);
      return { photos: [] };
    }
  }

  async listProjectPhotos(projectId) {
    console.log(`\n📸 Listing photos for project: ${projectId}`);
    
    const resources = await this.getProjectResources(projectId);
    const photos = resources.photos || [];
    
    console.log(`   Total photos: ${photos.length}`);
    
    if (photos.length === 0) {
      console.log('   No photos found.');
      return [];
    }

    photos.forEach((photo, index) => {
      console.log(`   ${index + 1}. ${photo.filename}`);
      console.log(`      ID: ${photo.id}`);
      console.log(`      S3 Key: ${photo.s3Key}`);
      console.log(`      Uploaded: ${photo.uploadedAt}`);
      console.log('');
    });

    return photos;
  }

  async removePhotoFromProject(projectId, photoId, s3Key) {
    try {
      // For now, we'll use a direct approach since there might not be a specific API endpoint
      // Let's try to delete using the S3 key pattern
      
      console.log(`   🗑️ Attempting to delete photo ${photoId} with S3 key: ${s3Key}`);
      
      // Since we don't have a direct delete API, let's create a simple approach
      // We'll manually construct the delete request
      
      // For safety, we'll just log what we would delete
      console.log(`   📝 Would delete: ${s3Key}`);
      console.log(`   📝 From project: ${projectId}`);
      console.log(`   📝 Photo ID: ${photoId}`);
      
      return true; // For now, return true to show the process
    } catch (error) {
      console.error(`Error removing photo ${photoId}:`, error);
      return false;
    }
  }

  async removeDuplicatePhotos() {
    console.log(`\n🧹 Starting cleanup of duplicate photos from ${CONFIG.WRONG_PROJECT_ID}...`);
    
    // Get current photos in the wrong project
    const photos = await this.listProjectPhotos(CONFIG.WRONG_PROJECT_ID);
    
    // Filter photos that match our duplicate filenames
    const photosToRemove = photos.filter(photo => {
      return CONFIG.PHOTOS_TO_REMOVE.some(filename => 
        photo.filename.includes(filename)
      );
    });

    console.log(`\n🎯 Found ${photosToRemove.length} photos to remove:`);
    photosToRemove.forEach((photo, index) => {
      console.log(`   ${index + 1}. ${photo.filename}`);
    });

    if (photosToRemove.length === 0) {
      console.log('✅ No duplicate photos found to remove.');
      return;
    }

    console.log('\n⚠️ DRY RUN MODE - Photos to be removed:');
    photosToRemove.forEach((photo, index) => {
      console.log(`\n${index + 1}. ${photo.filename}`);
      console.log(`   S3 Key: ${photo.s3Key}`);
      console.log(`   Photo ID: ${photo.id}`);
    });

    console.log('\n📋 CLEANUP SUMMARY:');
    console.log(`   🎯 Found ${photosToRemove.length} duplicate photos to remove`);
    console.log(`   📂 From project: ${CONFIG.WRONG_PROJECT_ID}`);
    console.log('\n💡 To actually delete these photos, you can:');
    console.log('   1. Use the admin interface at /admin/photos');
    console.log('   2. Filter by project "internal-messaging-app"');
    console.log('   3. Delete the screenshots that contain "222" timestamps');
  }

  async run() {
    console.log('🚀 Duplicate Photo Cleanup Script');
    console.log('================================================================================');
    
    try {
      // Wait a moment for the dev server to be ready
      console.log('⏳ Waiting for dev server to be ready...');
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Authenticate
      const authenticated = await this.authenticate();
      if (!authenticated) {
        console.log('\n💡 Make sure the dev server is running: npm run dev');
        process.exit(1);
      }

      // List current photos before cleanup
      console.log('\n📋 CURRENT STATE:');
      await this.listProjectPhotos(CONFIG.WRONG_PROJECT_ID);

      // Show what would be removed
      await this.removeDuplicatePhotos();

    } catch (error) {
      console.error('❌ Script failed:', error);
      console.log('\n💡 Make sure the dev server is running: npm run dev');
      process.exit(1);
    }
  }
}

// Run the cleanup
const cleanup = new DuplicatePhotoCleanup();
cleanup.run(); 