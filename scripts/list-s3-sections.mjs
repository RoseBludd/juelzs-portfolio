// Load environment variables early
import { config as loadEnv } from 'dotenv';
loadEnv();

import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

const DEFAULT_PREFIXES = [
  '',
  'meetings/',
  'projects/',
  'video-thumbnails/',
  'overall-leadership-analysis/',
  'architecture-analysis/',
  'project-resources/',
  'journal/'
];

function maskSecret(value) {
  if (!value) return '';
  if (value.length <= 4) return '***';
  return `${value.slice(0, 2)}***${value.slice(-2)}`;
}

async function listPrefix(s3, bucket, prefix) {
  try {
    const results = {
      prefix,
      prefixes: [],
      objects: [],
      truncated: false
    };

    const command = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix || undefined,
      Delimiter: '/',
      MaxKeys: 100
    });

    const res = await s3.send(command);
    results.prefixes = (res.CommonPrefixes || []).map(p => p.Prefix);
    results.objects = (res.Contents || []).map(o => ({
      Key: o.Key,
      Size: o.Size,
      LastModified: o.LastModified
    }));
    results.truncated = Boolean(res.IsTruncated);

    return results;
  } catch (e) {
    return { prefix, error: e.name || e.code || e.message || String(e) };
  }
}

async function main() {
  const region = process.env.AWS_REGION || 'us-east-1';
  const bucket = process.env.AWS_S3_BUCKET;
  const prefixes = process.argv.slice(2).length > 0 ? process.argv.slice(2) : DEFAULT_PREFIXES;

  const envInfo = {
    AWS_REGION: region,
    AWS_S3_BUCKET: bucket || '[not set]',
    AWS_S3_MEETINGS_PATH: process.env.AWS_S3_MEETINGS_PATH || 'meetings',
    AWS_ACCESS_KEY_ID: maskSecret(process.env.AWS_ACCESS_KEY_ID),
    AWS_SECRET_ACCESS_KEY: maskSecret(process.env.AWS_SECRET_ACCESS_KEY)
  };

  if (!bucket) {
    console.log(JSON.stringify({ env: envInfo, error: 'AWS_S3_BUCKET not set' }, null, 2));
    return;
  }

  const s3 = new S3Client({
    region,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  });

  const results = [];
  for (const p of prefixes) {
    // eslint-disable-next-line no-await-in-loop
    results.push(await listPrefix(s3, bucket, p));
  }

  console.log(JSON.stringify({ env: envInfo, region, bucket, results }, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});



