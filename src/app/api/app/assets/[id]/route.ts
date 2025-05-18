import { db } from '@/db';
import { assets } from '@/db/schema/assets';
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
    // Extract id from path segments to ensure we always get it
    const id = req.nextUrl.pathname.split('/').pop();
    const assetId = id as string;
    
    // Fetch the asset, ensuring it belongs to the current organization
    const result = await db
      .select()
      .from(assets)
      .where(
        and(
          eq(assets.id, assetId),
          eq(assets.organizationId, organization.id)
        )
      );
    
    const asset = result[0];
    
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
 * PUT handler to update a specific asset
 * Accessible by organization members with user role or higher
 */
export const PUT = withOrganizationAuthRequired(async (req: NextRequest, context) => {
  try {
    const organization = await context.session.organization;
    const user = await context.session.user;
    // Extract id from path segments to ensure we always get it
    const id = req.nextUrl.pathname.split('/').pop();
    const assetId = id as string;
    
    // Parse the request body
    const body = await req.json();
    
    // Verify the asset exists and belongs to the organization
    const existingAsset = await db
      .select()
      .from(assets)
      .where(
        and(
          eq(assets.id, assetId),
          eq(assets.organizationId, organization.id)
        )
      );
    
    if (!existingAsset.length) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      );
    }
    
    // Update the asset
    const [updatedAsset] = await db
      .update(assets)
      .set({
        ...body,
        lastEditedById: user.id,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(assets.id, assetId),
          eq(assets.organizationId, organization.id)
        )
      )
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
 * Accessible by any member of the organization
 */
export const DELETE = withOrganizationAuthRequired(async (req: NextRequest, context) => {
  try {
    const organization = await context.session.organization;
    // Extract id from path segments to ensure we always get it
    const id = req.nextUrl.pathname.split('/').pop();
    const assetId = id as string;
    
    // Delete the asset, ensuring it belongs to the current organization
    const [deletedAsset] = await db
      .delete(assets)
      .where(
        and(
          eq(assets.id, assetId),
          eq(assets.organizationId, organization.id)
        )
      )
      .returning();
    
    if (!deletedAsset) {
      return NextResponse.json(
        { error: 'Asset not found or already deleted' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting asset:', error);
    return NextResponse.json(
      { error: 'Failed to delete asset' },
      { status: 500 }
    );
  }
}, OrganizationRole.enum.user);
