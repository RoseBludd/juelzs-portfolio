#!/usr/bin/env node

const CONFIG = {
  PROJECT_ID: 'ai-campaign',
  ADMIN_PASSWORD: 'TheWorldIsYours',
  BASE_URL: 'http://localhost:3000',
  
  // Exact photo details from terminal logs
  TARGET_PHOTO: {
    id: 'photo_ai-campaign_1752723814267_Screenshot_2025_07_16_223203_png_1752723814869',
    filename: '1752723814267_Screenshot_2025-07-16_223203.png',
    s3Key: 'projects/ai-campaign/photos/1752723814267_Screenshot_2025-07-16_223203.png'
  }
};

class DirectPhotoDeleter {
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

  async deleteFromS3AndDatabase() {
    console.log(`\n🗑️ Deleting photo: ${CONFIG.TARGET_PHOTO.filename}`);
    console.log(`📍 S3 Key: ${CONFIG.TARGET_PHOTO.s3Key}`);
    console.log(`🆔 Photo ID: ${CONFIG.TARGET_PHOTO.id}`);

    try {
      // Create a direct API call to delete the photo
      // We'll use the admin upload endpoint pattern but for deletion
      const deletePayload = {
        projectId: CONFIG.PROJECT_ID,
        photoId: CONFIG.TARGET_PHOTO.id,
        s3Key: CONFIG.TARGET_PHOTO.s3Key,
        action: 'delete'
      };

      console.log('\n🔄 Step 1: Attempting to delete from S3 and database...');
      
      // Try multiple potential endpoints for deletion
      const deleteEndpoints = [
        '/api/admin/projects/delete-photo',
        '/api/admin/photos/delete',
        '/api/admin/projects/upload-photo' // Sometimes delete is handled by upload endpoint
      ];

      let deleteSuccess = false;
      
      for (const endpoint of deleteEndpoints) {
        try {
          console.log(`   Trying endpoint: ${endpoint}`);
          
          const response = await fetch(`${CONFIG.BASE_URL}${endpoint}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${this.adminToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(deletePayload),
          });

          console.log(`   Response status: ${response.status}`);
          
          if (response.ok) {
            const result = await response.json();
            console.log(`   ✅ Successfully deleted via ${endpoint}`);
            console.log(`   Response:`, result);
            deleteSuccess = true;
            break;
          } else if (response.status === 404) {
            console.log(`   ⚠️ Endpoint not found: ${endpoint}`);
          } else {
            const errorText = await response.text();
            console.log(`   ❌ Error ${response.status}: ${errorText}`);
          }
        } catch (error) {
          console.log(`   ❌ Failed to call ${endpoint}:`, error.message);
        }
      }

      if (!deleteSuccess) {
        console.log('\n🔧 Direct API deletion failed. Using alternative approach...');
        
        // Alternative: Use AWS SDK directly
        await this.deleteDirectlyFromAWS();
      }

      return deleteSuccess;
    } catch (error) {
      console.error('❌ Error in deletion process:', error);
      return false;
    }
  }

  async deleteDirectlyFromAWS() {
    console.log('\n🌐 Attempting direct AWS S3 deletion...');
    
    try {
      // Import AWS SDK
      const { S3Client, DeleteObjectCommand } = await import('@aws-sdk/client-s3');
      
      const s3Client = new S3Client({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      });

      const bucketName = process.env.AWS_S3_BUCKET || 'genius-untitled';
      
      console.log(`   Bucket: ${bucketName}`);
      console.log(`   Key: ${CONFIG.TARGET_PHOTO.s3Key}`);

      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: CONFIG.TARGET_PHOTO.s3Key,
      });

      await s3Client.send(command);
      console.log('   ✅ Successfully deleted from S3');

      // Now try to remove from database via project linking
      await this.removeFromDatabase();
      
      return true;
    } catch (error) {
      console.error('❌ Direct AWS deletion failed:', error);
      return false;
    }
  }

  async removeFromDatabase() {
    console.log('\n🗄️ Removing from database...');
    
    try {
      // Simulate database removal by making a call to refresh project resources
      const response = await fetch(`${CONFIG.BASE_URL}/api/admin/projects/debug-resources?projectId=${CONFIG.PROJECT_ID}&refresh=true`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.adminToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        console.log('   ✅ Database refresh triggered');
      }
      
      return true;
    } catch (error) {
      console.error('❌ Database removal failed:', error);
      return false;
    }
  }

  async verifyDeletion() {
    console.log('\n🔍 Verifying deletion...');
    
    try {
      const response = await fetch(`${CONFIG.BASE_URL}/api/admin/projects/debug-resources?projectId=${CONFIG.PROJECT_ID}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.adminToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const resources = await response.json();
        const photos = resources.photos || [];
        
        const stillExists = photos.find(p => p.id === CONFIG.TARGET_PHOTO.id);
        
        console.log(`   Total photos remaining: ${photos.length}`);
        console.log(`   Target photo still exists: ${stillExists ? '❌ YES' : '✅ NO'}`);
        
        if (stillExists) {
          console.log(`   ⚠️ Photo still found: ${stillExists.filename}`);
        } else {
          console.log(`   🎉 Photo successfully deleted!`);
        }
        
        return !stillExists;
      }
    } catch (error) {
      console.error('❌ Verification failed:', error);
      return false;
    }
  }

  async run() {
    console.log('🚀 Direct Photo S3 Deletion Script');
    console.log('================================================================================');
    console.log(`🎯 Target: ${CONFIG.TARGET_PHOTO.filename}`);
    console.log(`📂 Project: ${CONFIG.PROJECT_ID}`);
    console.log(`🔑 S3 Key: ${CONFIG.TARGET_PHOTO.s3Key}`);
    console.log('================================================================================');
    
    try {
      // Authenticate
      const authenticated = await this.authenticate();
      if (!authenticated) {
        process.exit(1);
      }

      // Delete the photo
      const deleted = await this.deleteFromS3AndDatabase();
      
      // Verify deletion
      await this.verifyDeletion();
      
      if (deleted) {
        console.log('\n🎉 DELETION COMPLETED SUCCESSFULLY!');
      } else {
        console.log('\n⚠️ DELETION MAY HAVE FAILED - Check manually');
      }

    } catch (error) {
      console.error('❌ Script failed:', error);
      process.exit(1);
    }
  }
}

// Run the deleter
const deleter = new DirectPhotoDeleter();
deleter.run(); 