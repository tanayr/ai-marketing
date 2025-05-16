import { stores } from '@/db/schema';
import { db } from '@/db';
import { eq, and } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import withOrganizationAuthRequired from '@/lib/auth/withOrganizationAuthRequired';
import { OrganizationRole } from '@/db/schema/organization';

/**
 * GET handler for fetching a store by ID
 * Accessible by any member of the organization
 */
export const GET = withOrganizationAuthRequired(async (req, context) => {
  try {
    const organization = await context.session.organization;
    const params = await context.params;
    const storeId = params.storeId as string;
    
    // Validate the storeId
    if (!storeId || typeof storeId !== "string") {
      return NextResponse.json(
        { error: 'Store ID is required' }, 
        { status: 400 }
      );
    }
    
    // Fetch the store from the database for the current organization
    const [store] = await db
      .select()
      .from(stores)
      .where(
        and(
          eq(stores.id, storeId),
          eq(stores.organizationId, organization.id)
        )
      ).limit(1);
    
    if (!store) {
      return NextResponse.json(
        { error: 'Store not found' }, 
        { status: 404 }
      );
    }
    
    return NextResponse.json(store);
  } catch (error) {
    console.error('Error fetching store:', error);
    return NextResponse.json(
      { error: 'Failed to fetch store' }, 
      { status: 500 }
    );
  }
}, OrganizationRole.enum.user);
