import { db } from '@/db';
import { assets } from '@/db/schema';
import { eq, and, desc, like } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import withOrganizationAuthRequired from '@/lib/auth/withOrganizationAuthRequired';
import { OrganizationRole } from '@/db/schema/organization';

/**
 * GET handler for fetching all assets for the current organization
 * Accessible by any member of the organization
 */
export const GET = withOrganizationAuthRequired(async (req: NextRequest, context) => {
  try {
    const organization = await context.session.organization;
    const { searchParams } = new URL(req.url);
    
    // Parse query parameters for filtering
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const studioTool = searchParams.get('studioTool');
    const search = searchParams.get('search');

    // Build query with filters
    let query = db
      .select()
      .from(assets)
      .where(eq(assets.organizationId, organization.id));

    // Apply additional filters if provided with proper type handling
    if (type) {
      // Safe filtering approach that avoids type errors
      const validTypes = ['image', 'video', 'content'];
      if (validTypes.includes(type)) {
        // Only apply the filter if the type is valid
        query = query.where(eq(assets.type, type as any));
      }
    }
    
    if (status) {
      // Safe filtering approach for status
      const validStatuses = ['draft', 'ready'];
      if (validStatuses.includes(status)) {
        query = query.where(eq(assets.status, status as any));
      }
    }
    
    if (studioTool) {
      // Safe filtering approach for studioTool
      const validStudioTools = [
        'image_editor', 'video_editor', 'banner_creator', 
        'social_post_creator', 'ad_copy_generator'
      ];
      if (validStudioTools.includes(studioTool)) {
        query = query.where(eq(assets.studioTool, studioTool as any));
      }
    }
    
    if (search) {
      query = query.where(like(assets.name, `%${search}%`));
    }
    
    // Order by most recently updated
    query = query.orderBy(desc(assets.updatedAt));
    
    const results = await query;
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching assets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assets' }, 
      { status: 500 }
    );
  }
}, OrganizationRole.enum.user);

/**
 * POST handler for creating a new asset
 * Accessible by any member of the organization
 */
export const POST = withOrganizationAuthRequired(async (req: NextRequest, context) => {
  try {
    const user = await context.session.user;
    const organization = await context.session.organization;
    
    const payload = await req.json();
    
    // Basic validation
    if (!payload.name || !payload.type || !payload.studioTool) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type, and studioTool are required' },
        { status: 400 }
      );
    }
    
    // Create asset
    const [newAsset] = await db
      .insert(assets)
      .values({
        name: payload.name,
        type: payload.type,
        studioTool: payload.studioTool,
        status: payload.status || 'draft',
        thumbnail: payload.thumbnail,
        content: payload.content || {},
        organizationId: organization.id,
        productId: payload.productId,
        notes: payload.notes,
        createdById: user.id,
        lastEditedById: user.id,
      })
      .returning();
    
    return NextResponse.json(newAsset);
  } catch (error) {
    console.error('Error creating asset:', error);
    return NextResponse.json(
      { error: 'Failed to create asset' }, 
      { status: 500 }
    );
  }
}, OrganizationRole.enum.user);
