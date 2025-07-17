import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env') });

// Import AWS SDK
import { S3Client, GetObjectCommand, PutObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

class FeaturedImageManager {
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

  async saveProjectResources(projectId, resources) {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: `project-resources/${projectId}_resources.json`,
        Body: JSON.stringify(resources),
        ContentType: 'application/json',
        Metadata: {
          'project-id': projectId,
          'updated-at': new Date().toISOString()
        }
      });

      await this.s3Client.send(command);
      console.log(`💾 Saved project resources for: ${projectId}`);
    } catch (error) {
      console.error('Error saving project resources to S3:', error);
      throw error;
    }
  }

  async setFeaturedImage(projectId, photoId) {
    const resources = await this.getProjectResources(projectId);
    
    // Verify the photo exists in this project
    const photo = resources.photos.find(p => p.id === photoId);
    if (!photo) {
      console.error(`❌ Photo with ID ${photoId} not found in project ${projectId}`);
      return false;
    }

    resources.featuredImageId = photoId;
    resources.lastUpdated = new Date();

    await this.saveProjectResources(projectId, resources);
    console.log(`✅ Set featured image for ${projectId}: ${photo.filename}`);
    return true;
  }

  async clearFeaturedImage(projectId) {
    const resources = await this.getProjectResources(projectId);
    
    resources.featuredImageId = undefined;
    resources.lastUpdated = new Date();

    await this.saveProjectResources(projectId, resources);
    console.log(`✅ Cleared featured image for ${projectId}`);
    return true;
  }

  async listProjectPhotos(projectId) {
    const resources = await this.getProjectResources(projectId);
    
    console.log(`\n📸 Photos for ${projectId}:`);
    console.log(`   Total photos: ${resources.photos.length}`);
    console.log(`   Featured image ID: ${resources.featuredImageId || 'None'}`);
    
    if (resources.photos.length === 0) {
      console.log('   No photos found.');
      return resources.photos;
    }

    resources.photos.forEach((photo, index) => {
      const isFeatured = resources.featuredImageId === photo.id;
      const status = isFeatured ? '⭐ FEATURED' : '';
      
      console.log(`   ${index + 1}. ${photo.filename} ${status}`);
      console.log(`      ID: ${photo.id}`);
      console.log(`      Category: ${photo.category}`);
      console.log(`      URL: ${photo.url || 'No URL'}`);
      console.log(`      S3 Key: ${photo.s3Key}`);
      console.log(`      Size: ${(photo.size / 1024).toFixed(1)} KB`);
      console.log(`      Uploaded: ${photo.uploadedAt}`);
      console.log('');
    });

    return resources.photos;
  }

  async checkPhotoAccess(projectId) {
    console.log(`\n🔍 Checking photo access for ${projectId}...`);
    
    // List photos directly from S3
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: `projects/${projectId}/photos/`,
      });

      const response = await this.s3Client.send(command);
      
      console.log(`📁 S3 Objects found: ${response.Contents?.length || 0}`);
      
      if (response.Contents && response.Contents.length > 0) {
        for (const object of response.Contents) {
          console.log(`   S3 Key: ${object.Key}`);
          console.log(`   Size: ${(object.Size / 1024).toFixed(1)} KB`);
          console.log(`   Last Modified: ${object.LastModified}`);
          
          // Try to generate a presigned URL to test access
          try {
            const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
            const getCommand = new GetObjectCommand({
              Bucket: this.bucketName,
              Key: object.Key,
            });
            const url = await getSignedUrl(this.s3Client, getCommand, { expiresIn: 3600 });
            console.log(`   ✅ Presigned URL generated: ${url.substring(0, 100)}...`);
          } catch (error) {
            console.log(`   ❌ Error generating presigned URL: ${error.message}`);
          }
          console.log('');
        }
      } else {
        console.log('   No S3 objects found in photos directory');
      }
    } catch (error) {
      console.error(`❌ Error checking S3 photos: ${error.message}`);
    }
  }

  async listAllProjectsWithPhotos() {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: 'project-resources/',
      });

      const response = await this.s3Client.send(command);
      const projects = [];

      if (response.Contents) {
        for (const object of response.Contents) {
          if (object.Key && object.Key.endsWith('_resources.json')) {
            const projectId = object.Key
              .replace('project-resources/', '')
              .replace('_resources.json', '');
            
            const resources = await this.getProjectResources(projectId);
            if (resources.photos.length > 0) {
              projects.push({
                projectId,
                photoCount: resources.photos.length,
                featuredImageId: resources.featuredImageId
              });
            }
          }
        }
      }

      console.log('\n🗂️ Projects with photos:');
      projects.forEach(project => {
        const featuredStatus = project.featuredImageId ? '⭐ Has featured' : '❌ No featured';
        console.log(`   ${project.projectId}: ${project.photoCount} photos (${featuredStatus})`);
      });

      return projects;
    } catch (error) {
      console.error('Error listing projects with photos:', error);
      return [];
    }
  }
}

async function main() {
  const manager = new FeaturedImageManager();
  
  const args = process.argv.slice(2);
  const command = args[0];
  const projectId = args[1];
  const photoId = args[2];

  console.log('🎨 Featured Image Manager');
  console.log('========================\n');

  switch (command) {
    case 'list':
      if (!projectId) {
        console.log('Usage: node set-featured-image.mjs list <project-id>');
        return;
      }
      await manager.listProjectPhotos(projectId);
      await manager.checkPhotoAccess(projectId);
      break;

    case 'set':
      if (!projectId || !photoId) {
        console.log('Usage: node set-featured-image.mjs set <project-id> <photo-id>');
        return;
      }
      await manager.setFeaturedImage(projectId, photoId);
      break;

    case 'clear':
      if (!projectId) {
        console.log('Usage: node set-featured-image.mjs clear <project-id>');
        return;
      }
      await manager.clearFeaturedImage(projectId);
      break;

    case 'check':
      if (!projectId) {
        console.log('Usage: node set-featured-image.mjs check <project-id>');
        return;
      }
      await manager.checkPhotoAccess(projectId);
      break;

    case 'all':
      await manager.listAllProjectsWithPhotos();
      break;

    case 'auto-set-dev-portal':
      console.log('🤖 Auto-setting featured image for dev-portal...');
      const photos = await manager.listProjectPhotos('dev-portal');
      if (photos.length > 0) {
        // Choose the first screenshot, interface, or any photo
        const featuredPhoto = photos.find(p => p.category === 'screenshot') ||
                             photos.find(p => p.category === 'interface') ||
                             photos[0];
        
        if (featuredPhoto) {
          await manager.setFeaturedImage('dev-portal', featuredPhoto.id);
          console.log(`✅ Auto-set featured image: ${featuredPhoto.filename}`);
        } else {
          console.log('❌ No suitable photo found for featured image');
        }
      } else {
        console.log('❌ No photos found for dev-portal project');
      }
      break;

    default:
      console.log('Available commands:');
      console.log('  list <project-id>           - List all photos for a project');
      console.log('  set <project-id> <photo-id> - Set a photo as featured');
      console.log('  clear <project-id>          - Clear featured image');
      console.log('  check <project-id>          - Check photo access and S3 status');
      console.log('  all                         - List all projects with photos');
      console.log('  auto-set-dev-portal         - Automatically set a featured image for dev-portal');
      console.log('');
      console.log('Examples:');
      console.log('  node set-featured-image.mjs list dev-portal');
      console.log('  node set-featured-image.mjs auto-set-dev-portal');
      console.log('  node set-featured-image.mjs all');
  }
}

main().catch(console.error); 