// Verify featured project images listed on /projects exist in S3
import { config as loadEnv } from 'dotenv';
loadEnv();

import { S3Client, ListObjectsV2Command, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

function pickFeaturedPhoto(resources) {
  const photos = Array.isArray(resources?.photos) ? resources.photos : [];
  if (photos.length === 0) return undefined;

  // Prefer explicit featured
  if (resources.featuredImageId) {
    const byId = photos.find(p => p.id === resources.featuredImageId);
    if (byId) return byId;
  }

  // Fallback order
  const preferredOrder = ['screenshot', 'interface'];
  for (const cat of preferredOrder) {
    const match = photos.find(p => p.category === cat);
    if (match) return match;
  }
  return photos[0];
}

async function main() {
  const region = process.env.AWS_REGION || 'us-east-1';
  const bucket = process.env.AWS_S3_BUCKET;
  if (!bucket) {
    console.error('AWS_S3_BUCKET not set');
    process.exit(1);
  }

  const s3 = new S3Client({
    region,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  });

  const listCmd = new ListObjectsV2Command({
    Bucket: bucket,
    Prefix: 'project-resources/',
    MaxKeys: 1000
  });

  const listRes = await s3.send(listCmd);
  const keys = (listRes.Contents || [])
    .map(o => o.Key)
    .filter(Boolean)
    .filter(k => k.endsWith('_resources.json'));

  const results = [];
  for (const key of keys) {
    const projectId = key.replace('project-resources/', '').replace('_resources.json', '');
    try {
      const getRes = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
      const text = await getRes.Body.transformToString();
      const resources = JSON.parse(text);
      const featured = pickFeaturedPhoto(resources);
      if (!featured) {
        results.push({ projectId, status: 'no_photos', key });
        continue;
      }

      const head = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: featured.s3Key }));
      const url = `https://${bucket}.s3.${region}.amazonaws.com/${featured.s3Key}`;
      results.push({
        projectId,
        status: 'ok',
        featured: {
          s3Key: featured.s3Key,
          contentType: head.ContentType || null,
          contentLength: head.ContentLength || null,
          url
        }
      });
    } catch (e) {
      results.push({ projectId, status: 'error', key, error: e.name || e.code || e.message || String(e) });
    }
  }

  const summary = {
    bucket,
    region,
    totalProjects: keys.length,
    ok: results.filter(r => r.status === 'ok').length,
    no_photos: results.filter(r => r.status === 'no_photos').length,
    errors: results.filter(r => r.status === 'error').length
  };

  console.log(JSON.stringify({ summary, results }, null, 2));
}

main().catch(err => { console.error(err); process.exit(1); });



