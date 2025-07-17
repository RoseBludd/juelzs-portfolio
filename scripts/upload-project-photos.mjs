#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// Configuration - Update these for different projects
const CONFIG = {
  PROJECT_ID: 'sales-jobs', // Change this for different projects
  PHOTO_CATEGORY: 'interface', // interface maps to admin view in the gallery
  ADMIN_PASSWORD: 'TheWorldIsYours',
  
  // Sales Jobs Screenshots - New batch
  SCREENSHOT_PATHS: [
    "C:\\Users\\GENIUS\\Pictures\\Screenshots\\Screenshot 2025-07-16 213605.png",
    "C:\\Users\\GENIUS\\Pictures\\Screenshots\\Screenshot 2025-07-16 213735.png",
    "C:\\Users\\GENIUS\\Pictures\\Screenshots\\Screenshot 2025-07-16 213822.png",
    "C:\\Users\\GENIUS\\Pictures\\Screenshots\\Screenshot 2025-07-16 213951.png"
  ]
};

class ProjectPhotoUploader {
  constructor(config = CONFIG) {
    this.config = config;
    this.uploadResults = [];
    this.failedUploads = [];
  }

  async validateEnvironment() {
    console.log('🔍 Validating environment and prerequisites...');
    
    if (!this.config.ADMIN_PASSWORD) {
      throw new Error('❌ Admin password not configured');
    }
    
    console.log('✅ Admin credentials available');
    
    // Check if all screenshot files exist
    const missingFiles = [];
    for (const filePath of this.config.SCREENSHOT_PATHS) {
      if (!fs.existsSync(filePath)) {
        missingFiles.push(filePath);
      }
    }
    
    if (missingFiles.length > 0) {
      throw new Error(`❌ Missing screenshot files:\n${missingFiles.join('\n')}`);
    }
    
    console.log(`✅ All ${this.config.SCREENSHOT_PATHS.length} screenshot files found`);
  }

  async authenticateAdmin() {
    console.log('🔐 Authenticating as admin...');
    
    try {
      const response = await fetch('http://localhost:3000/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: this.config.ADMIN_PASSWORD
        })
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Admin authentication successful');
      return data;
    } catch (error) {
      throw new Error(`❌ Failed to authenticate: ${error.message}`);
    }
  }

  createFileFromPath(filePath) {
    const fileBuffer = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);
    const mimeType = this.getMimeType(fileName);
    
    return {
      name: fileName,
      size: fileBuffer.length,
      type: mimeType,
      buffer: fileBuffer
    };
  }

  getMimeType(fileName) {
    const ext = path.extname(fileName).toLowerCase();
    const mimeTypes = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    };
    return mimeTypes[ext] || 'image/png';
  }

  async uploadSinglePhoto(filePath, index) {
    const fileName = path.basename(filePath);
    console.log(`📸 Uploading ${index + 1}/${this.config.SCREENSHOT_PATHS.length}: ${fileName}`);
    
    try {
      const file = this.createFileFromPath(filePath);
      
      const uploadPayload = {
        projectId: this.config.PROJECT_ID,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        category: this.config.PHOTO_CATEGORY,
        fileBuffer: file.buffer.toString('base64')
      };

      const response = await fetch('http://localhost:3000/api/admin/projects/upload-photo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(uploadPayload)
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} - ${await response.text()}`);
      }

      const result = await response.json();
      
      this.uploadResults.push({
        success: true,
        fileName,
        filePath,
        photoId: result.photo?.id,
        s3Key: result.photo?.s3Key,
        url: result.photo?.url
      });

      console.log(`   ✅ Successfully uploaded: ${fileName}`);
      console.log(`   📍 S3 Key: ${result.photo?.s3Key}`);
      console.log(`   🔗 URL: ${result.photo?.url?.substring(0, 80)}...`);
      
      return result;
    } catch (error) {
      console.error(`   ❌ Failed to upload ${fileName}: ${error.message}`);
      
      this.failedUploads.push({
        fileName,
        filePath,
        error: error.message
      });
      
      return null;
    }
  }

  async uploadAllPhotos() {
    console.log(`\n🚀 Starting bulk upload of ${this.config.SCREENSHOT_PATHS.length} screenshots...`);
    console.log(`📂 Target project: ${this.config.PROJECT_ID}`);
    console.log(`🏷️ Category: ${this.config.PHOTO_CATEGORY}`);
    console.log('─'.repeat(80));

    for (let i = 0; i < this.config.SCREENSHOT_PATHS.length; i++) {
      await this.uploadSinglePhoto(this.config.SCREENSHOT_PATHS[i], i);
      
      // Add a small delay between uploads to avoid overwhelming the server
      if (i < this.config.SCREENSHOT_PATHS.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  async verifyUploads() {
    console.log('\n🔍 Verifying photos appear in project showcase...');
    
    try {
      const response = await fetch(`http://localhost:3000/projects/${this.config.PROJECT_ID}`);
      
      if (response.ok) {
        console.log(`✅ Project page accessible at /projects/${this.config.PROJECT_ID}`);
        console.log(`🎯 Visit the Project Showcase tab to see your uploaded photos`);
      } else {
        console.log(`⚠️ Could not verify project page (${response.status})`);
      }
      
      return true;
    } catch (error) {
      console.error(`❌ Failed to verify project page: ${error.message}`);
      return false;
    }
  }

  printSummary() {
    console.log('\n' + '='.repeat(80));
    console.log('📋 UPLOAD SUMMARY');
    console.log('='.repeat(80));
    
    console.log(`✅ Successful uploads: ${this.uploadResults.length}`);
    console.log(`❌ Failed uploads: ${this.failedUploads.length}`);
    console.log(`📊 Total processed: ${this.config.SCREENSHOT_PATHS.length}`);
    
    if (this.uploadResults.length > 0) {
      console.log('\n🎉 Successfully uploaded files:');
      this.uploadResults.forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.fileName}`);
      });
    }
    
    if (this.failedUploads.length > 0) {
      console.log('\n⚠️ Failed uploads:');
      this.failedUploads.forEach((failed, index) => {
        console.log(`   ${index + 1}. ${failed.fileName}`);
        console.log(`      ❌ Error: ${failed.error}`);
      });
    }
    
    console.log('\n🎯 Next Steps:');
    console.log('   • Visit /admin/projects to verify uploads in the admin interface');
    console.log(`   • Check /projects/${this.config.PROJECT_ID} Project Showcase tab to see photos`);
    console.log('   • Photos are stored in S3 and linked to the project for showcase');
    
    console.log('\n📝 To upload more photos:');
    console.log('   • Update SCREENSHOT_PATHS in this script');
    console.log('   • Change PROJECT_ID and PHOTO_CATEGORY if needed');
    console.log('   • Run: node scripts/upload-project-photos.mjs');
  }

  async run() {
    try {
      console.log('🚀 Project Photo Upload Script');
      console.log('=' .repeat(80));
      
      await this.validateEnvironment();
      await this.authenticateAdmin();
      await this.uploadAllPhotos();
      await this.verifyUploads();
      
      this.printSummary();
      
      if (this.failedUploads.length === 0) {
        console.log('\n🎉 All screenshots uploaded successfully!');
        process.exit(0);
      } else {
        console.log('\n⚠️ Some uploads failed. Please review the errors above.');
        process.exit(1);
      }
      
    } catch (error) {
      console.error(`\n💥 Script failed: ${error.message}`);
      process.exit(1);
    }
  }

  // Static helper for quick project configuration
  static createConfig(projectId, category, screenshotPaths) {
    return {
      ...CONFIG,
      PROJECT_ID: projectId,
      PHOTO_CATEGORY: category,
      SCREENSHOT_PATHS: screenshotPaths
    };
  }
}

// Run the uploader if this script is executed directly
if (process.argv[1] && process.argv[1].endsWith('upload-project-photos.mjs')) {
  const uploader = new ProjectPhotoUploader();
  uploader.run();
}

export default ProjectPhotoUploader; 