import { NextResponse } from "next/server";
import { db } from "@/db";
import { stores } from "@/db/schema";
import { shopifyProducts } from "@/db/schema/shopify-products";
import { eq } from "drizzle-orm";
import withOrganizationAuthRequired from "@/lib/auth/withOrganizationAuthRequired";
import { OrganizationRole } from "@/db/schema/organization";

/**
 * GET handler for fetching all products across all stores for the current organization
 * Accessible by any member of the organization
 */
export const GET = withOrganizationAuthRequired(async (req, context) => {
  try {
    const organization = await context.session.organization;
    
    // Fetch all stores for the current organization
    const organizationStores = await db
      .select()
      .from(stores)
      .where(eq(stores.organizationId, organization.id));
    
    if (organizationStores.length === 0) {
      return NextResponse.json([]);
    }
    
    // Fetch products from all stores
    const allProducts = [];
    
    for (const store of organizationStores) {
      const storeProducts = await db
        .select()
        .from(shopifyProducts)
        .where(eq(shopifyProducts.storeId, store.id));
      
      // Add store information to each product
      const productsWithStoreInfo = storeProducts.map(product => ({
        ...product,
        store: {
          id: store.id,
          name: store.name,
          url: store.url,
          icon: store.icon
        }
      }));
      
      allProducts.push(...productsWithStoreInfo);
    }
    
    return NextResponse.json(allProducts);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" }, 
      { status: 500 }
    );
  }
}, OrganizationRole.enum.user);
