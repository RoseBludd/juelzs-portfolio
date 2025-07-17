import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env') });

// Import AWS SDK
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

class PhotoDebugger {
  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
    this.bucketName = process.env.AWS_S3_BUCKET || 'genius-untitled';
  }

  async getProjectResources(projectId) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: `project-resources/${projectId}_resources.json`,
      });

      const response = await this.s3Client.send(command);
      
      if (response.Body) {
        const data = await response.Body.transformToString();
        const parsed = JSON.parse(data);
        
        // Convert date strings back to Date objects
        parsed.lastUpdated = new Date(parsed.lastUpdated);
        parsed.photos = parsed.photos.map(p => ({
          ...p,
          uploadedAt: new Date(p.uploadedAt)
        }));
        
        return parsed;
      }
    } catch {
      console.log(`📄 No existing resources found for project: ${projectId}`);
      
      // Return empty resources structure
      return {
        projectId,
        photos: [],
        linkedVideos: [],
        lastUpdated: new Date(),
      };
    }
  }

  async debugPhotoCategories(projectId) {
    console.log(`🔍 Debugging photo categories for ${projectId}...`);
    
    const resources = await this.getProjectResources(projectId);
    const photos = resources.photos;
    
    console.log(`\n📊 Photo Category Analysis:`);
    console.log(`   Total photos: ${photos.length}`);
    
    // Group by category
    const byCategory = photos.reduce((acc, photo) => {
      acc[photo.category] = acc[photo.category] || [];
      acc[photo.category].push(photo);
      return acc;
    }, {});
    
    console.log(`\n📂 Photos by Category:`);
    Object.entries(byCategory).forEach(([category, categoryPhotos]) => {
      console.log(`   ${category}: ${categoryPhotos.length} photos`);
      categoryPhotos.forEach((photo, index) => {
        console.log(`     ${index + 1}. ${photo.filename}`);
      });
    });
    
    // Test view filters
    console.log(`\n🎯 View Filter Testing:`);
    
    const viewFilters = {
      'all': [],
      'admin': ['interface', 'dashboard', 'admin'],
      'developer': ['screenshot', 'diagram', 'analytics', 'architecture'],
      'mobile': ['mobile', 'responsive'],
      'demo': ['demo', 'workflow'],
      'api': ['api', 'integration', 'docs']
    };
    
    Object.entries(viewFilters).forEach(([viewName, categories]) => {
      let filteredPhotos;
      if (viewName === 'all') {
        filteredPhotos = photos;
      } else {
        filteredPhotos = photos.filter(photo => categories.includes(photo.category));
      }
      
      console.log(`   ${viewName} view: ${filteredPhotos.length} photos`);
      if (filteredPhotos.length > 0) {
        filteredPhotos.forEach((photo, index) => {
          console.log(`     ${index + 1}. ${photo.filename} (${photo.category})`);
        });
      }
    });
    
    // Check featured image
    console.log(`\n⭐ Featured Image:`);
    if (resources.featuredImageId) {
      const featuredPhoto = photos.find(p => p.id === resources.featuredImageId);
      if (featuredPhoto) {
        console.log(`   ${featuredPhoto.filename} (${featuredPhoto.category})`);
      } else {
        console.log(`   ❌ Featured image ID not found: ${resources.featuredImageId}`);
      }
    } else {
      console.log(`   ❌ No featured image set`);
    }
    
    return { photos, byCategory, viewFilters };
  }
}

async function main() {
  const photoDebugger = new PhotoDebugger();
  
  console.log('🐛 Photo Categories Debugger');
  console.log('============================\n');
  
  await photoDebugger.debugPhotoCategories('dev-portal');
}

main().catch(console.error); 