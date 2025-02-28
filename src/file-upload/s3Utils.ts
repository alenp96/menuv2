// import * as path from 'path';
// import { randomUUID } from 'crypto';
import { S3Client } from '@aws-sdk/client-s3';
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Add a browser-compatible UUID generation function
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Add a browser-compatible function to get file extension
function getFileExtension(filename: string) {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
}

// Create S3 client only on the server side
let s3Client: S3Client | null = null;

// Only initialize S3 client if we're in a server environment
if (typeof window === 'undefined') {
  s3Client = new S3Client({
    region: process.env.AWS_S3_REGION,
    credentials: {
      accessKeyId: process.env.AWS_S3_IAM_ACCESS_KEY!,
      secretAccessKey: process.env.AWS_S3_IAM_SECRET_KEY!,
    },
  });
}

type S3Upload = {
  fileType: string;
  fileName: string;
  userId: string;
};

export const getUploadFileSignedURLFromS3 = async ({ fileName, fileType, userId }: S3Upload) => {
  // Return mock values if we're in a browser environment
  if (!s3Client || typeof window !== 'undefined') {
    console.warn('S3 client not available in browser environment');
    return { 
      uploadUrl: 'https://example.com/upload', 
      key: 'mock-key'
    };
  }

  const key = getS3Key(fileName, userId);
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_FILES_BUCKET,
    Key: key,
    ContentType: fileType,
  });
  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  return { uploadUrl, key };
};

export const getDownloadFileSignedURLFromS3 = async ({ key }: { key: string }) => {
  // Return mock values if we're in a browser environment
  if (!s3Client || typeof window !== 'undefined') {
    console.warn('S3 client not available in browser environment');
    return 'https://example.com/download';
  }

  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_FILES_BUCKET,
    Key: key,
  });
  return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
};

function getS3Key(fileName: string, userId: string) {
  // Use our browser-compatible function instead of path.extname
  const ext = getFileExtension(fileName);
  // Use our browser-compatible UUID function instead of randomUUID
  return `${userId}/${generateUUID()}.${ext}`;
}
