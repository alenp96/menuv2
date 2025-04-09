import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION,
  credentials: {
    accessKeyId: process.env.AWS_S3_IAM_ACCESS_KEY,
    secretAccessKey: process.env.AWS_S3_IAM_SECRET_KEY,
  },
});

export async function generateS3UploadUrl(key, contentType) {
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_FILES_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  return signedUrl;
} 