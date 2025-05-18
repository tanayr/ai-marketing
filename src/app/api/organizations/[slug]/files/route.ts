import { NextRequest, NextResponse } from 'next/server';
import withOrganizationAuthRequired from '@/lib/auth/withOrganizationAuthRequired';
import { UploadsService } from '@/lib/uploads/uploads-service';
import { OrganizationRole } from '@/db/schema/organization';
import { db } from '@/db';
import { assets } from '@/db/schema/assets';
import { eq, and } from 'drizzle-orm';

/**
 * API endpoint to get all files for an organization
 */
export const GET = withOrganizationAuthRequired(async (_req: NextRequest, context) => {
  try {
    // Get organization from context
    const organization = await context.session.organization;
    
    // Get all regular uploads for the organization
    const uploadedFiles = await UploadsService.getUploadsForOrganization(organization.id);
    
    // Get all assets (studio outputs) for the organization
    const rawAssetFiles = await db
      .select({
        id: assets.id,
        fileName: assets.name,
        fileUrl: assets.thumbnail,
        contentType: assets.type,
        filePath: assets.studioTool,
        createdAt: assets.createdAt,
        userId: assets.createdById,
        fileType: assets.type,
        studioTool: assets.studioTool,
      })
      .from(assets)
      .where(eq(assets.organizationId, organization.id));
      
    // Add the isAsset flag to the result
    const assetFiles = rawAssetFiles.map(asset => ({
      ...asset,
      isAsset: true
    }));
    
    // Mark uploaded files to distinguish them from assets
    const formattedUploadedFiles = uploadedFiles.map(file => ({
      ...file,
      isAsset: false,
      fileType: 'upload',
      studioTool: null,
    }));
    
    // Combine both types of files and sort by creation date (newest first)
    const allFiles = [...formattedUploadedFiles, ...assetFiles].sort((a, b) => {
      // Safely handle date comparison with fallback for null/invalid dates
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA; // Newest first
    });
    
    return NextResponse.json({ files: allFiles });
  } catch (error) {
    console.error('Error fetching organization files:', error);
    return NextResponse.json(
      { error: 'Failed to fetch files', details: (error as Error).message },
      { status: 500 }
    );
  }
}, OrganizationRole.enum.user);

/**
 * API endpoint to delete a file from an organization
 */
export const DELETE = withOrganizationAuthRequired(async (req: NextRequest, context) => {
  try {
    // Get organization from context
    const organization = await context.session.organization;
    
    // Get file ID and type from request
    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get('fileId');
    const isAsset = searchParams.get('isAsset') === 'true';
    
    if (!fileId) {
      return NextResponse.json({ error: 'No file ID provided' }, { status: 400 });
    }
    
    // Delete based on the file type
    if (isAsset) {
      // Delete the asset from the assets table
      const [deletedAsset] = await db
        .delete(assets)
        .where(and(
          eq(assets.id, fileId),
          eq(assets.organizationId, organization.id)
        ))
        .returning();
      
      if (!deletedAsset) {
        return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
      }
      
      return NextResponse.json({ success: true, file: deletedAsset });
    } else {
      // Delete the regular upload
      const deletedFile = await UploadsService.deleteUpload(fileId, organization.id);
      
      return NextResponse.json({ success: true, file: deletedFile });
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { error: 'Failed to delete file', details: (error as Error).message },
      { status: 500 }
    );
  }
}, OrganizationRole.enum.user);
