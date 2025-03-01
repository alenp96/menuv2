// Remove the Node.js path import
// import * as path from 'path';
// Remove the Node.js crypto import
// import { randomUUID } from 'crypto';

// Use browser-compatible imports for AWS SDK
import { S3Client } from '@aws-sdk/client-s3';
import { GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
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
  console.log('Initializing S3 client with region:', process.env.AWS_S3_REGION);
  console.log('S3 bucket:', process.env.AWS_S3_FILES_BUCKET);
  
  try {
    s3Client = new S3Client({
      region: process.env.AWS_S3_REGION,
      credentials: {
        accessKeyId: process.env.AWS_S3_IAM_ACCESS_KEY!,
        secretAccessKey: process.env.AWS_S3_IAM_SECRET_KEY!,
      },
    });
    console.log('S3 client initialized successfully');
  } catch (error) {
    console.error('Error initializing S3 client:', error);
  }
}

type MenuItemImageUpload = {
  fileType: string;
  fileName: string;
  userId: string;
  menuId: string;
  itemId: string;
};

export const getMenuItemImageUploadURL = async ({ fileName, fileType, userId, menuId, itemId }: MenuItemImageUpload) => {
  // We don't need to check for browser environment here because this function
  // is only called from the server-side operation, not directly from the browser
  if (!s3Client) {
    console.error('S3 client not initialized');
    throw new Error('S3 client not initialized');
  }

  try {
    console.log('Generating upload URL for:', { fileName, fileType, userId, menuId, itemId });
    
    const key = getMenuItemImageKey(fileName, userId, menuId, itemId);
    console.log('Generated S3 key:', key);
    
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_FILES_BUCKET,
      Key: key,
      ContentType: fileType,
    });
    
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    console.log('Generated signed URL for upload');
    
    // Construct the public URL for the image
    // Try a more compatible URL format without the region in the domain
    const publicUrl = `https://${process.env.AWS_S3_FILES_BUCKET}.s3.amazonaws.com/${key}`;
    console.log('Public URL:', publicUrl);
    
    return { uploadUrl, key, publicUrl };
  } catch (error) {
    console.error('Error generating upload URL:', error);
    throw error;
  }
};

export const getMenuItemImageDownloadURL = async ({ key }: { key: string }) => {
  // We don't need to check for browser environment here because this function
  // is only called from the server-side operation, not directly from the browser
  if (!s3Client) {
    console.error('S3 client not initialized');
    throw new Error('S3 client not initialized');
  }

  try {
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_FILES_BUCKET,
      Key: key,
    });
    return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  } catch (error) {
    console.error('Error generating download URL:', error);
    throw error;
  }
};

// Generate a unique key for the menu item image
function getMenuItemImageKey(fileName: string, userId: string, menuId: string, itemId: string) {
  // Use our browser-compatible function instead of path.extname
  const ext = getFileExtension(fileName);
  // Use our browser-compatible UUID function instead of randomUUID
  const uuid = generateUUID();
  return `menu-images/${userId}/${menuId}/${itemId}/${uuid}.${ext}`;
}

// Extract S3 key from a public URL
export const extractKeyFromPublicUrl = (publicUrl: string): string | null => {
  try {
    const bucketName = process.env.AWS_S3_FILES_BUCKET;
    // Match URLs in the format: https://bucket-name.s3.amazonaws.com/key
    const regex = new RegExp(`https://${bucketName}\\.s3\\.amazonaws\\.com/(.+)`);
    const match = publicUrl.match(regex);
    
    if (match && match[1]) {
      return match[1];
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting key from URL:', error);
    return null;
  }
};

// Delete an image from S3
export const deleteMenuItemImage = async (imageUrl: string): Promise<boolean> => {
  if (!s3Client) {
    console.error('S3 client not initialized');
    throw new Error('S3 client not initialized');
  }

  try {
    const key = extractKeyFromPublicUrl(imageUrl);
    
    if (!key) {
      console.error('Could not extract key from URL:', imageUrl);
      return false;
    }
    
    console.log('Deleting image with key:', key);
    
    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_FILES_BUCKET,
      Key: key,
    });
    
    await s3Client.send(command);
    console.log('Image deleted successfully');
    
    return true;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
};

// Allowed image types
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// Validate image file
export const validateImageFile = (file: File) => {
  if (!file) {
    return { valid: false, error: 'No file selected' };
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { 
      valid: false, 
      error: `Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}` 
    };
  }

  // 5MB max file size
  const MAX_FILE_SIZE = 5 * 1024 * 1024;
  if (file.size > MAX_FILE_SIZE) {
    return { 
      valid: false, 
      error: `File size too large. Maximum size: ${MAX_FILE_SIZE / (1024 * 1024)}MB` 
    };
  }

  return { valid: true, error: null };
}; 