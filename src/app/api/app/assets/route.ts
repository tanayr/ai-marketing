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
    const user = await context.session.user;
    
    // Get the organization ID from the session
    const sessionOrgId = organization.id;
    
    // Double-check with the header (if present)
    const headerOrgId = req.headers.get('X-Organization-ID');
    
    // If header is present and doesn't match session, log a warning
    if (headerOrgId && headerOrgId !== sessionOrgId) {
      console.warn(`Organization ID mismatch: session=${sessionOrgId}, header=${headerOrgId}`);
    }
    
    // Log organization info for debugging
    console.log(`Fetching assets for organization: ${organization.id}, user: ${user.id}`);
    
    const { searchParams } = new URL(req.url);
    
    // Parse query parameters for filtering
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const studioTool = searchParams.get('studioTool');
    const search = searchParams.get('search');

    // Build the query with all conditions in one go to avoid TypeScript errors
    const conditions = [];
    
    // Always filter by organization ID - this is required
    conditions.push(eq(assets.organizationId, sessionOrgId));
    
    // Apply additional filters if provided with proper type handling
    if (type) {
      const validTypes = ['image', 'video', 'content'];
      if (validTypes.includes(type)) {
        conditions.push(eq(assets.type, type as any));
      }
    }
    
    if (status) {
      const validStatuses = ['draft', 'ready'];
      if (validStatuses.includes(status)) {
        conditions.push(eq(assets.status, status as any));
      }
    }
    
    if (studioTool) {
      const validStudioTools = [
        'image_editor', 'video_editor', 'banner_creator', 
        'social_post_creator', 'ad_copy_generator', 'retouchr'
      ];
      if (validStudioTools.includes(studioTool)) {
        conditions.push(eq(assets.studioTool, studioTool as any));
      }
    }
    
    if (search) {
      conditions.push(like(assets.name, `%${search}%`));
    }
    
    // Apply all filters using and() on the conditions array and order by most recently updated
    const results = await db
      .select()
      .from(assets)
      .where(conditions.length === 1 ? conditions[0] : and(...conditions))
      .orderBy(desc(assets.updatedAt));
    
    console.log(`Found ${results.length} assets for organization: ${organization.id}`);
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching assets:', error);
    // Log any organization ID issues
    if (error instanceof Error) {
      console.error(`Organization context error: ${error.message}`);
    }
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
