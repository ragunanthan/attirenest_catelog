import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3';

/**
 * Returns an instantiated AWS S3 Client targeting Cloudflare R2
 */
export function getR2Client(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      'Cloudflare R2 is not fully configured. Please ensure R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY are set in your environment.'
    );
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

/**
 * Retrieves R2 bucket name and public CDN URL from environment
 */
export function getR2Config() {
  const bucketName = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL;

  if (!bucketName) {
    throw new Error('Missing R2_BUCKET_NAME in environment variables.');
  }
  if (!publicUrl) {
    throw new Error(
      'Missing R2_PUBLIC_URL in environment variables. Set this to your Cloudflare CDN domain or pub-<id>.r2.dev URL.'
    );
  }

  return {
    bucketName,
    publicUrl: publicUrl.replace(/\/+$/, ''),
  };
}

export interface UploadR2Options {
  folder?: string;
  customFilename?: string;
  contentType?: string;
}

/**
 * Uploads a file (File, Blob, or Buffer) to Cloudflare R2 and returns its public CDN URL.
 */
export async function uploadToR2(
  file: File | Blob | Buffer,
  options?: UploadR2Options
): Promise<string> {
  const s3 = getR2Client();
  const { bucketName, publicUrl } = getR2Config();

  const folder = options?.folder || 'products';
  let originalName = 'image';
  let mimeType = options?.contentType || 'application/octet-stream';
  let buffer: Buffer;

  if (typeof File !== 'undefined' && file instanceof File) {
    originalName = file.name;
    mimeType = file.type || mimeType;
    buffer = Buffer.from(await file.arrayBuffer());
  } else if (typeof Blob !== 'undefined' && file instanceof Blob) {
    mimeType = file.type || mimeType;
    buffer = Buffer.from(await file.arrayBuffer());
  } else if (Buffer.isBuffer(file)) {
    buffer = file;
    if (options?.customFilename) {
      originalName = options.customFilename;
    }
  } else {
    throw new Error('Unsupported file payload provided to uploadToR2');
  }

  // Sanitize filename to avoid weird URL characters
  const cleanName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const randomSuffix = Math.random().toString(36).substring(2, 9);
  const key = `${folder}/${Date.now()}-${randomSuffix}-${cleanName}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      CacheControl: 'public, max-age=31536000, immutable',
    })
  );

  return `${publicUrl}/${key}`;
}

/**
 * Extracts the object key from a full public CDN URL or key path.
 */
export function extractR2Key(urlOrKey: string): string | null {
  if (!urlOrKey || typeof urlOrKey !== 'string') return null;
  const trimmed = urlOrKey.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const parsed = new URL(trimmed);
      return parsed.pathname.replace(/^\/+/, '');
    } catch {
      return trimmed.replace(/^\/+/, '');
    }
  }
  return trimmed.replace(/^\/+/, '');
}

/**
 * Deletes one or more files from Cloudflare R2 by URL or object key.
 */
export async function deleteFromR2(urlsOrKeys: string | string[]): Promise<void> {
  const items = (Array.isArray(urlsOrKeys) ? urlsOrKeys : [urlsOrKeys]).filter(Boolean);
  if (items.length === 0) return;

  const { bucketName } = getR2Config();
  const s3 = getR2Client();

  const keys = items
    .map(extractR2Key)
    .filter((k): k is string => Boolean(k && k.length > 0));

  if (keys.length === 0) return;

  if (keys.length === 1) {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: keys[0],
      })
    );
  } else {
    await s3.send(
      new DeleteObjectsCommand({
        Bucket: bucketName,
        Delete: {
          Objects: keys.map((Key) => ({ Key })),
          Quiet: true,
        },
      })
    );
  }
}

/**
 * Safely deletes an image regardless of whether it's stored on Cloudflare R2
 * or legacy Vercel Blob storage.
 */
export async function safeDeleteStorageImage(urls: string | string[]) {
  const urlList = (Array.isArray(urls) ? urls : [urls]).filter(Boolean);
  if (urlList.length === 0) return;

  const vercelUrls: string[] = [];
  const r2Urls: string[] = [];

  for (const u of urlList) {
    if (typeof u === 'string') {
      if (u.includes('blob.vercel-storage.com')) {
        vercelUrls.push(u);
      } else {
        r2Urls.push(u);
      }
    }
  }

  // Delete from Cloudflare R2
  if (r2Urls.length > 0) {
    try {
      await deleteFromR2(r2Urls);
    } catch (err) {
      console.warn('safeDeleteStorageImage: Failed to delete from Cloudflare R2:', err);
    }
  }

  // Delete from legacy Vercel Blob if token is available
  if (vercelUrls.length > 0 && process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { del } = await import('@vercel/blob');
      await del(vercelUrls);
    } catch (err) {
      console.warn('safeDeleteStorageImage: Failed to delete from Vercel Blob storage:', err);
    }
  }
}
