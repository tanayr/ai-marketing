import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import s3 from "./client";

/**
 * Generates a presigned URL for client-side uploads to S3
 */
export const getUploadUrl = async (
  contentType: string,
  path: string,
  filename: string
) => {
  // Clean path and generate a unique key
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const key = `${cleanPath}/${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  
  const putObjectParams = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    ContentType: contentType
  };
  
  const command = new PutObjectCommand(putObjectParams);
  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
  
  // Generate URL - use CloudFront if available, otherwise direct S3 URL
  let url;
  if (process.env.AWS_CLOUDFRONT_URL) {
    // Use CloudFront URL if available
    url = `${process.env.AWS_CLOUDFRONT_URL}/${key}`;
  } else {
    // Fallback to direct S3 URL
    url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  }

  return {
    uploadUrl,
    key,
    url,
    contentType,
    filename
  };
};

export default getUploadUrl;
