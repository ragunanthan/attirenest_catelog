#!/usr/bin/env node

/**
 * Migration Script: Vercel Blob -> Cloudflare R2
 *
 * Usage:
 *   1. Direct migration by downloading (if store is unblocked or accessible via token):
 *      node --env-file=.env scripts/migrate-to-r2.mjs --migrate
 *
 *   2. Migration from a local directory of images:
 *      node --env-file=.env scripts/migrate-to-r2.mjs --from-dir ./images-backup
 *
 *   3. Dry run (inspect what would change without modifying database):
 *      node --env-file=.env scripts/migrate-to-r2.mjs --dry-run
 *
 *   4. URL replacement only (if files were already transferred to R2):
 *      node --env-file=.env scripts/migrate-to-r2.mjs --replace-domains
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

// Read arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isMigrate = args.includes('--migrate');
const isReplaceOnly = args.includes('--replace-domains');
const dirArgIndex = args.indexOf('--from-dir');
const localDirPath = dirArgIndex !== -1 ? args[dirArgIndex + 1] : null;

const {
  MONGODB_URI,
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET_NAME,
  R2_PUBLIC_URL,
  BLOB_READ_WRITE_TOKEN,
} = process.env;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is required.');
  process.exit(1);
}

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME || !R2_PUBLIC_URL) {
  console.error('❌ Cloudflare R2 environment variables are missing.');
  console.error('Please ensure R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, and R2_PUBLIC_URL are set.');
  process.exit(1);
}

const cleanPublicUrl = R2_PUBLIC_URL.replace(/\/+$/, '');

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

function getMimeType(filePathOrUrl) {
  const ext = path.extname(filePathOrUrl.split('?')[0]).toLowerCase();
  switch (ext) {
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.webp': return 'image/webp';
    case '.gif': return 'image/gif';
    case '.svg': return 'image/svg+xml';
    case '.avif': return 'image/avif';
    default: return 'image/jpeg';
  }
}

async function uploadBufferToR2(buffer, key, mimeType) {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      CacheControl: 'public, max-age=31536000, immutable',
    })
  );
  return `${cleanPublicUrl}/${key}`;
}

async function main() {
  console.log(`Connecting to MongoDB...`);
  await mongoose.connect(MONGODB_URI);
  console.log(`Connected successfully.`);

  const collection = mongoose.connection.collection('products');
  const products = await collection.find({}).toArray();

  console.log(`Found ${products.length} products in MongoDB.`);

  let totalImages = 0;
  let vercelImages = 0;
  for (const p of products) {
    if (Array.isArray(p.images)) {
      totalImages += p.images.length;
      vercelImages += p.images.filter((img) => img.includes('blob.vercel-storage.com')).length;
    }
  }

  console.log(`Total image URLs: ${totalImages}`);
  console.log(`Vercel Blob image URLs: ${vercelImages}`);

  if (vercelImages === 0) {
    console.log('✅ No Vercel Blob image URLs found in MongoDB. Everything is already migrated!');
    await mongoose.disconnect();
    return;
  }

  if (isDryRun || (!isMigrate && !localDirPath && !isReplaceOnly)) {
    console.log('\n--- DRY RUN SUMMARY ---');
    console.log(`Products needing update: ${products.filter(p => p.images?.some(img => img.includes('blob.vercel-storage.com'))).length}`);
    console.log(`To execute migration:`);
    console.log(`  Option 1: Re-map URLs directly to R2 (if files are already moved):`);
    console.log(`    node --env-file=.env scripts/migrate-to-r2.mjs --replace-domains`);
    console.log(`  Option 2: Download from Vercel & upload to R2 (if store unblocked):`);
    console.log(`    node --env-file=.env scripts/migrate-to-r2.mjs --migrate`);
    console.log(`  Option 3: Upload from local folder & update DB:`);
    console.log(`    node --env-file=.env scripts/migrate-to-r2.mjs --from-dir ./path-to-images`);
    await mongoose.disconnect();
    return;
  }

  // OPTION: Replace domains only
  if (isReplaceOnly) {
    console.log('\nReplacing Vercel domains with Cloudflare R2 CDN URL in database...');
    let updatedProducts = 0;
    for (const p of products) {
      if (!Array.isArray(p.images)) continue;
      let changed = false;
      const newImages = p.images.map((img) => {
        if (img.includes('blob.vercel-storage.com')) {
          changed = true;
          // Extract pathname (e.g. /products/...)
          try {
            const parsed = new URL(img);
            return `${cleanPublicUrl}${parsed.pathname}`;
          } catch {
            return img;
          }
        }
        return img;
      });

      if (changed) {
        await collection.updateOne({ _id: p._id }, { $set: { images: newImages } });
        updatedProducts++;
      }
    }
    console.log(`✅ Updated ${updatedProducts} products to Cloudflare R2 URLs.`);
    await mongoose.disconnect();
    return;
  }

  // OPTION: Migrate from local directory
  if (localDirPath) {
    if (!fs.existsSync(localDirPath)) {
      console.error(`❌ Local directory not found: ${localDirPath}`);
      await mongoose.disconnect();
      return;
    }

    const files = fs.readdirSync(localDirPath);
    console.log(`Found ${files.length} files in ${localDirPath}.`);

    let uploadedCount = 0;
    for (const p of products) {
      if (!Array.isArray(p.images)) continue;
      const newImages = [];
      let productChanged = false;

      for (const imgUrl of p.images) {
        if (!imgUrl.includes('blob.vercel-storage.com')) {
          newImages.push(imgUrl);
          continue;
        }

        // Try to find matching file in directory by filename
        const oldFilename = path.basename(new URL(imgUrl).pathname);
        const matchedFile = files.find((f) => f === oldFilename || oldFilename.includes(f) || f.includes(oldFilename));

        if (matchedFile) {
          const filePath = path.join(localDirPath, matchedFile);
          const buffer = fs.readFileSync(filePath);
          const mime = getMimeType(matchedFile);
          const key = `products/${matchedFile}`;
          const newUrl = await uploadBufferToR2(buffer, key, mime);
          newImages.push(newUrl);
          uploadedCount++;
          productChanged = true;
          console.log(`Uploaded & mapped: ${matchedFile} -> ${newUrl}`);
        } else {
          newImages.push(imgUrl);
        }
      }

      if (productChanged) {
        await collection.updateOne({ _id: p._id }, { $set: { images: newImages } });
      }
    }

    console.log(`\n✅ Uploaded ${uploadedCount} images and updated MongoDB records.`);
    await mongoose.disconnect();
    return;
  }

  // OPTION: Direct download & re-upload
  if (isMigrate) {
    console.log('\nAttempting to download images and re-upload to Cloudflare R2...');
    let successfulUploads = 0;
    let failedDownloads = 0;

    for (const p of products) {
      if (!Array.isArray(p.images)) continue;
      const newImages = [];
      let productChanged = false;

      for (const imgUrl of p.images) {
        if (!imgUrl.includes('blob.vercel-storage.com')) {
          newImages.push(imgUrl);
          continue;
        }

        try {
          const headers = {};
          if (BLOB_READ_WRITE_TOKEN) {
            headers['Authorization'] = `Bearer ${BLOB_READ_WRITE_TOKEN}`;
          }

          const res = await fetch(imgUrl, { headers });
          if (!res.ok) {
            console.warn(`Failed to fetch ${imgUrl}: ${res.status} ${res.statusText}`);
            newImages.push(imgUrl);
            failedDownloads++;
            continue;
          }

          const arrayBuffer = await res.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const pathname = new URL(imgUrl).pathname.replace(/^\/+/, '');
          const mime = res.headers.get('content-type') || getMimeType(pathname);

          const r2Url = await uploadBufferToR2(buffer, pathname, mime);
          newImages.push(r2Url);
          successfulUploads++;
          productChanged = true;
          console.log(`Migrated: ${pathname} -> ${r2Url}`);
        } catch (err) {
          console.error(`Error migrating ${imgUrl}:`, err.message);
          newImages.push(imgUrl);
          failedDownloads++;
        }
      }

      if (productChanged) {
        await collection.updateOne({ _id: p._id }, { $set: { images: newImages } });
      }
    }

    console.log(`\nMigration completed:`);
    console.log(`  Successfully transferred to R2: ${successfulUploads}`);
    console.log(`  Failed downloads: ${failedDownloads}`);
    if (failedDownloads > 0) {
      console.log(`\n⚠️ Note: Some files returned 403/Forbidden from Vercel because the store is blocked.`);
      console.log(`If you have the images locally, run:`);
      console.log(`  node --env-file=.env scripts/migrate-to-r2.mjs --from-dir ./path-to-folder`);
    }

    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error('Fatal error during migration:', err);
  process.exit(1);
});
