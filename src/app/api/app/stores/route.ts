import { shopifyStoreAPI } from '@/lib/external-api/services/shopify-store';
import { transformStoreInfo } from '@/lib/transformers/shopify-store';
import { stores } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/db';
import withOrganizationAuthRequired from '@/lib/auth/withOrganizationAuthRequired';
import { OrganizationRole } from '@/db/schema/organization';

/**
 * GET handler for fetching all stores for the current organization
 * Accessible by any member of the organization
 */
export const GET = withOrganizationAuthRequired(async (req, context) => {
  try {
    const organization = await context.session.organization;
    
    // Fetch stores from the database for the current organization
    const organizationStores = await db
      .select()
      .from(stores)
      .where(eq(stores.organizationId, organization.id));
    
    return NextResponse.json(organizationStores);
  } catch (error) {
    console.error('Error fetching stores:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stores' }, 
      { status: 500 }
    );
  }
}, OrganizationRole.enum.user);

/**
 * POST handler for adding a new Shopify store
 * Accessible by any member of the organization
 */
export const POST = withOrganizationAuthRequired(async (req, context) => {
  try {
    const { url } = await req.json();
    const organization = await context.session.organization;
    
    // Validate the URL format
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'Invalid URL provided' }, 
        { status: 400 }
      );
    }
    
    // Get store info from RapidAPI
    const storeResponse = await shopifyStoreAPI.getStoreInfo(url);
    
    // Validate the response structure
    if (!storeResponse || !storeResponse.domain_info) {
      return NextResponse.json(
        { error: 'Invalid store data returned from API' },
        { status: 422 }
      );
    }
    
    // Transform the response to our data model
    const storeData = transformStoreInfo(storeResponse, url);
    
    // Save the new store to the database
    const [newStore] = await db
      .insert(stores)
      .values({
        id: crypto.randomUUID(),
        organizationId: organization.id,
        name: storeData.name,
        url: storeData.url,
        icon: storeData.icon,
        category: storeData.category,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    
    return NextResponse.json(newStore);
  } catch (error: any) {
    console.error('Error adding store:', error);
    
    // Handle specific error types
    if (error.name === 'RapidAPIError') {
      return NextResponse.json(
        { error: 'Failed to fetch store information' }, 
        { status: error.status || 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to add store' }, 
      { status: 500 }
    );
  }
}, OrganizationRole.enum.user);
