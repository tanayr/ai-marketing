import { PutObjectCommand } from "@aws-sdk/client-s3";
import s3 from "./client";

/**
 * Uploads a file buffer to S3 and returns the object details
 */
export const uploadFile = async (
  fileBuffer: Buffer,
  contentType: string,
  path: string,
  filename: string
) => {
  // Clean path and generate a unique key
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const key = `${cleanPath}/${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  
  // Upload to S3
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
    })
  );
  
  // Generate URL - use CloudFront if available, otherwise direct S3 URL
  let url;
  if (process.env.AWS_CLOUDFRONT_URL) {
    // Use CloudFront URL if available
    url = `${process.env.AWS_CLOUDFRONT_URL}/${key}`;
  } else {
    // Fallback to direct S3 URL
    url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  }

  // Return file info including public URL
  return {
    key,
    contentType,
    filename,
    url,
    path: cleanPath
  };
};

export default uploadFile;
