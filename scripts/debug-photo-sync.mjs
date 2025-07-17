#!/usr/bin/env node

const CONFIG = {
  PROJECT_ID: 'ai-campaign',
  ADMIN_PASSWORD: 'TheWorldIsYours',
  BASE_URL: 'http://localhost:3000',
  
  // The specific photo we're looking for
  TARGET_PHOTO: '1752723814267_Screenshot_2025-07-16_223203.png'
};

class PhotoSyncDebugger {
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

  async checkDatabasePhotos() {
    console.log('\n🗄️ Checking database photos...');
    
    try {
      const response = await fetch(`${CONFIG.BASE_URL}/api/admin/projects/debug-resources?projectId=${CONFIG.PROJECT_ID}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.adminToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get project resources: ${response.status}`);
      }

      const resources = await response.json();
      const photos = resources.photos || [];
      
      console.log(`   Database photos: ${photos.length}`);
      
      if (photos.length > 0) {
        photos.forEach((photo, index) => {
          const isTarget = photo.filename === CONFIG.TARGET_PHOTO;
          const marker = isTarget ? ' 🎯 TARGET' : '';
          console.log(`   ${index + 1}. ${photo.filename}${marker}`);
        });
      }
      
      return photos;
    } catch (error) {
      console.error('❌ Error checking database photos:', error);
      return [];
    }
  }

  async checkProjectPage() {
    console.log('\n🌐 Checking project page directly...');
    
    try {
      const response = await fetch(`${CONFIG.BASE_URL}/projects/${CONFIG.PROJECT_ID}`, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get project page: ${response.status}`);
      }

      const html = await response.text();
      
      // Check if the target photo appears in the HTML
      const hasTargetPhoto = html.includes(CONFIG.TARGET_PHOTO);
      const hasPhotos = html.includes('Project Showcase') || html.includes('photos');
      
      console.log(`   Project page loaded: ✅`);
      console.log(`   Contains target photo: ${hasTargetPhoto ? '✅' : '❌'}`);
      console.log(`   Has photo sections: ${hasPhotos ? '✅' : '❌'}`);
      
      if (hasTargetPhoto) {
        // Extract photo URLs from the HTML
        const photoMatches = html.match(/1752\d+_Screenshot[^"']*/g);
        if (photoMatches) {
          console.log(`   Found ${photoMatches.length} photos in HTML:`);
          photoMatches.forEach((match, index) => {
            const isTarget = match.includes(CONFIG.TARGET_PHOTO.replace('.png', ''));
            const marker = isTarget ? ' 🎯 TARGET' : '';
            console.log(`     ${index + 1}. ${match}${marker}`);
          });
        }
      }
      
      return hasTargetPhoto;
    } catch (error) {
      console.error('❌ Error checking project page:', error);
      return false;
    }
  }

  async clearProjectCache() {
    console.log('\n🧹 Clearing project cache...');
    
    try {
      // Try to clear any project-specific cache
      const cacheEndpoints = [
        `/api/admin/projects?action=refresh&projectId=${CONFIG.PROJECT_ID}`,
        `/api/admin/projects/refresh/${CONFIG.PROJECT_ID}`
      ];
      
      for (const endpoint of cacheEndpoints) {
        try {
          const response = await fetch(`${CONFIG.BASE_URL}${endpoint}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${this.adminToken}`,
              'Content-Type': 'application/json',
            },
          });
          console.log(`   Cache clear attempt ${endpoint}: ${response.status}`);
        } catch {
          // Ignore errors for cache clearing
        }
      }
      
      console.log('   ✅ Cache clear attempts completed');
    } catch (error) {
      console.error('❌ Error clearing cache:', error);
    }
  }

  async resyncProjectPhotos() {
    console.log('\n🔄 Attempting to resync project photos...');
    
    try {
      // Force refresh project data
      const response = await fetch(`${CONFIG.BASE_URL}/projects/${CONFIG.PROJECT_ID}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
      });
      
      if (response.ok) {
        console.log('   ✅ Project page refreshed');
      }
      
      // Wait a moment then check database again
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const freshPhotos = await this.checkDatabasePhotos();
      
      return freshPhotos;
    } catch (error) {
      console.error('❌ Error resyncing photos:', error);
      return [];
    }
  }

  async run() {
    console.log('🚀 Photo Sync Debugger');
    console.log('================================================================================');
    console.log(`🎯 Target Photo: ${CONFIG.TARGET_PHOTO}`);
    console.log(`📂 Project: ${CONFIG.PROJECT_ID}`);
    console.log('================================================================================');
    
    try {
      // Wait for dev server
      console.log('⏳ Waiting for dev server...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Authenticate
      const authenticated = await this.authenticate();
      if (!authenticated) {
        console.log('\n💡 Make sure the dev server is running: npm run dev');
        process.exit(1);
      }

      // Step 1: Check database
      const dbPhotos = await this.checkDatabasePhotos();

      // Step 2: Check project page
      const pageHasPhoto = await this.checkProjectPage();

      // Step 3: Clear cache and resync
      await this.clearProjectCache();
      const freshPhotos = await this.resyncProjectPhotos();

      // Final summary
      console.log('\n📋 SUMMARY:');
      console.log(`   Database photos: ${dbPhotos.length}`);
      console.log(`   Page shows photo: ${pageHasPhoto ? '✅' : '❌'}`);
      console.log(`   After resync: ${freshPhotos.length} photos`);
      
      if (pageHasPhoto && dbPhotos.length === 0) {
        console.log('\n⚠️ DISCREPANCY DETECTED:');
        console.log('   - Photo appears in UI but not in database');
        console.log('   - This suggests a caching or sync issue');
        console.log('\n💡 Solutions:');
        console.log('   1. Hard refresh the browser (Ctrl+F5)');
        console.log('   2. Clear browser cache');
        console.log('   3. Wait a few minutes for cache to expire');
        console.log('   4. Restart the development server');
      }
      
      if (freshPhotos.length > 0) {
        const targetPhoto = freshPhotos.find(p => p.filename === CONFIG.TARGET_PHOTO);
        if (targetPhoto) {
          console.log('\n🎯 TARGET PHOTO FOUND:');
          console.log(`   ID: ${targetPhoto.id}`);
          console.log(`   S3 Key: ${targetPhoto.s3Key}`);
          console.log(`   To delete: Visit /admin/photos and delete manually`);
        }
      }

    } catch (error) {
      console.error('❌ Script failed:', error);
      process.exit(1);
    }
  }
}

// Run the debugger
const photoDebugger = new PhotoSyncDebugger();
photoDebugger.run(); 