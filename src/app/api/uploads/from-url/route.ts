import { NextRequest, NextResponse } from 'next/server';
import withOrganizationAuthRequired from '@/lib/auth/withOrganizationAuthRequired';
import uploadFile from '@/lib/s3/uploadFile';
import { OrganizationRole } from '@/db/schema/organization';
import { UploadsService } from '@/lib/uploads/uploads-service';

/**
 * API endpoint for uploading files from URLs
 * 
 * Accepts JSON with:
 * - url: Source URL to download from
 * - path: (Optional) S3 path prefix
 * - filename: (Optional) Custom filename
 */
export const POST = withOrganizationAuthRequired(async (req: NextRequest, context) => {
  try {
    // Get user and organization from context
    const user = await context.session.user;
    const organization = await context.session.organization;
    
    const { url, path = 'uploads/from-url', filename } = await req.json();
    
    if (!url) {
      return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
    }
    
    // Fetch the file from the URL
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch from URL: ${response.statusText}`);
    }
    
    // Get the content type and filename
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const guessedFilename = filename || url.split('/').pop() || `file-${Date.now()}`;
    
    // Convert to buffer
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Upload to S3
    const s3Result = await uploadFile(
      buffer,
      contentType,
      path,
      guessedFilename
    );
    
    // Save file record to the database
    const [fileRecord] = await UploadsService.saveUpload({
      organizationId: organization.id,
      userId: user.id,
      fileName: guessedFilename,
      fileKey: s3Result.key,
      fileUrl: s3Result.url,
      contentType,
      filePath: path,
      fileSize: String(buffer.length),
    });
    
    return NextResponse.json({
      ...s3Result,
      id: fileRecord.id,
    });
  } catch (error) {
    console.error('URL upload error:', error);
    return NextResponse.json(
      { error: 'URL upload failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}, OrganizationRole.enum.user);
