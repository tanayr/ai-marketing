import { db } from '@/db';
import { assets } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import withOrganizationAuthRequired from '@/lib/auth/withOrganizationAuthRequired';
import { OrganizationRole } from '@/db/schema/organization';

/**
 * GET handler to fetch a specific asset by ID
 * Accessible by any member of the organization
 */
export const GET = withOrganizationAuthRequired(async (req: NextRequest, context) => {
  try {
    const organization = await context.session.organization;
    const { params } = await context.params;
    const assetId = params.id as string;
    
    // Fetch the asset, ensuring it belongs to the current organization
    const asset = await db.query.assets.findFirst({
      where: and(
        eq(assets.id, assetId),
        eq(assets.organizationId, organization.id)
      )
    });
    
    if (!asset) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(asset);
  } catch (error) {
    console.error('Error fetching asset:', error);
    return NextResponse.json(
      { error: 'Failed to fetch asset' },
      { status: 500 }
    );
  }
}, OrganizationRole.enum.user);

/**
 * PUT handler to update an existing asset
 * Accessible by any member of the organization
 */
export const PUT = withOrganizationAuthRequired(async (req: NextRequest, context) => {
  try {
    const user = await context.session.user;
    const organization = await context.session.organization;
    const { params } = await context.params;
    const assetId = params.id as string;
    
    // Verify the asset exists and belongs to this organization
    const existingAsset = await db.query.assets.findFirst({
      where: and(
        eq(assets.id, assetId),
        eq(assets.organizationId, organization.id)
      )
    });
    
    if (!existingAsset) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      );
    }
    
    // Parse update data
    const updateData = await req.json();
    
    // Update the asset
    const [updatedAsset] = await db
      .update(assets)
      .set({
        name: updateData.name !== undefined ? updateData.name : existingAsset.name,
        type: updateData.type !== undefined ? updateData.type : existingAsset.type,
        studioTool: updateData.studioTool !== undefined ? updateData.studioTool : existingAsset.studioTool,
        status: updateData.status !== undefined ? updateData.status : existingAsset.status,
        thumbnail: updateData.thumbnail !== undefined ? updateData.thumbnail : existingAsset.thumbnail,
        content: updateData.content !== undefined ? updateData.content : existingAsset.content,
        productId: updateData.productId !== undefined ? updateData.productId : existingAsset.productId,
        notes: updateData.notes !== undefined ? updateData.notes : existingAsset.notes,
        lastEditedById: user.id,
        updatedAt: new Date(),
      })
      .where(eq(assets.id, assetId))
      .returning();
    
    return NextResponse.json(updatedAsset);
  } catch (error) {
    console.error('Error updating asset:', error);
    return NextResponse.json(
      { error: 'Failed to update asset' },
      { status: 500 }
    );
  }
}, OrganizationRole.enum.user);

/**
 * DELETE handler to remove an asset
 * Accessible by admin or owner roles only
 */
export const DELETE = withOrganizationAuthRequired(async (req: NextRequest, context) => {
  try {
    const organization = await context.session.organization;
    const { params } = await context.params;
    const assetId = params.id as string;
    
    // Verify the asset exists and belongs to this organization
    const existingAsset = await db.query.assets.findFirst({
      where: and(
        eq(assets.id, assetId),
        eq(assets.organizationId, organization.id)
      )
    });
    
    if (!existingAsset) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      );
    }
    
    // Delete the asset
    await db
      .delete(assets)
      .where(eq(assets.id, assetId));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting asset:', error);
    return NextResponse.json(
      { error: 'Failed to delete asset' },
      { status: 500 }
    );
  }
}, OrganizationRole.enum.admin);
