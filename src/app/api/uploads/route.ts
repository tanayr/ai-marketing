import { NextRequest, NextResponse } from 'next/server';
import withOrganizationAuthRequired from '@/lib/auth/withOrganizationAuthRequired';
import uploadFile from '@/lib/s3/uploadFile';
import { OrganizationRole } from '@/db/schema/organization';
import { UploadsService } from '@/lib/uploads/uploads-service';

/**
 * API endpoint for direct file uploads
 * 
 * Accepts multipart/form-data with:
 * - file: File to upload
 * - path: (Optional) S3 path prefix
 */
export const POST = withOrganizationAuthRequired(async (req: NextRequest, context) => {
  try {
    // Get user and organization from context
    const user = await context.session.user;
    const organization = await context.session.organization;
    
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    // Get path or use default
    const path = (formData.get('path') as string) || 'uploads/general';
    
    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Upload the file to S3
    const s3Result = await uploadFile(
      buffer,
      file.type,
      path,
      file.name
    );
    
    // Save file record to the database
    const [fileRecord] = await UploadsService.saveUpload({
      organizationId: organization.id,
      userId: user.id,
      fileName: file.name,
      fileKey: s3Result.key,
      fileUrl: s3Result.url,
      contentType: file.type,
      filePath: path,
      fileSize: String(buffer.length),
    });
    
    return NextResponse.json({
      ...s3Result,
      id: fileRecord.id,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}, OrganizationRole.enum.user);
