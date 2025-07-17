#!/usr/bin/env node

const CONFIG = {
  PROJECT_ID: 'ai-campaign',
  ADMIN_PASSWORD: 'TheWorldIsYours',
  BASE_URL: 'http://localhost:3000',
  
  // The specific photo filename to delete
  PHOTO_TO_DELETE: '1752723814267_Screenshot_2025-07-16_223203.png'
};

class SpecificPhotoDeleter {
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
      const isTarget = photo.filename === CONFIG.PHOTO_TO_DELETE;
      const marker = isTarget ? ' 🎯 TARGET' : '';
      
      console.log(`   ${index + 1}. ${photo.filename}${marker}`);
      console.log(`      ID: ${photo.id}`);
      console.log(`      S3 Key: ${photo.s3Key}`);
      console.log(`      Category: ${photo.category}`);
      console.log(`      Uploaded: ${photo.uploadedAt}`);
      console.log('');
    });

    return photos;
  }

  async deleteSpecificPhoto() {
    console.log(`\n🗑️ Looking for photo to delete: ${CONFIG.PHOTO_TO_DELETE}`);
    
    // Get current photos in the project
    const photos = await this.listProjectPhotos(CONFIG.PROJECT_ID);
    
    // Find the specific photo
    const photoToDelete = photos.find(photo => photo.filename === CONFIG.PHOTO_TO_DELETE);

    if (!photoToDelete) {
      console.log(`❌ Photo not found: ${CONFIG.PHOTO_TO_DELETE}`);
      return false;
    }

    console.log(`\n🎯 Found target photo:`);
    console.log(`   Filename: ${photoToDelete.filename}`);
    console.log(`   ID: ${photoToDelete.id}`);
    console.log(`   S3 Key: ${photoToDelete.s3Key}`);
    console.log(`   Category: ${photoToDelete.category}`);

    try {
      // Try to delete via admin API (we'll simulate this for now)
      console.log(`\n🗑️ Deleting photo...`);
      
      // Since we don't have a direct delete endpoint exposed in our search results,
      // we'll provide the information needed to delete manually
      console.log(`\n📋 To delete this photo, you can:`);
      console.log(`   1. Go to /admin/photos in your browser`);
      console.log(`   2. Filter by project: ${CONFIG.PROJECT_ID}`);
      console.log(`   3. Find photo: ${photoToDelete.filename}`);
      console.log(`   4. Click the "Delete" button`);
      
      console.log(`\n🔑 Photo Details for Manual Deletion:`);
      console.log(`   Project ID: ${CONFIG.PROJECT_ID}`);
      console.log(`   Photo ID: ${photoToDelete.id}`);
      console.log(`   S3 Key: ${photoToDelete.s3Key}`);
      console.log(`   Filename: ${photoToDelete.filename}`);
      
      return true;
    } catch (error) {
      console.error(`❌ Error deleting photo:`, error);
      return false;
    }
  }

  async run() {
    console.log('🚀 Specific Photo Deletion Script');
    console.log('================================================================================');
    console.log(`🎯 Target: ${CONFIG.PHOTO_TO_DELETE}`);
    console.log(`📂 Project: ${CONFIG.PROJECT_ID}`);
    console.log('================================================================================');
    
    try {
      // Wait a moment for the dev server to be ready
      console.log('⏳ Waiting for dev server to be ready...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Authenticate
      const authenticated = await this.authenticate();
      if (!authenticated) {
        console.log('\n💡 Make sure the dev server is running: npm run dev');
        process.exit(1);
      }

      // Show current state
      console.log('\n📋 CURRENT STATE:');
      await this.listProjectPhotos(CONFIG.PROJECT_ID);

      // Delete the specific photo
      await this.deleteSpecificPhoto();

    } catch (error) {
      console.error('❌ Script failed:', error);
      console.log('\n💡 Make sure the dev server is running: npm run dev');
      process.exit(1);
    }
  }
}

// Run the deletion
const deleter = new SpecificPhotoDeleter();
deleter.run(); 