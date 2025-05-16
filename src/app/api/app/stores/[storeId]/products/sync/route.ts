import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { stores } from "@/db/schema";
import withOrganizationAuthRequired from "@/lib/auth/withOrganizationAuthRequired";
import { OrganizationRole } from "@/db/schema/organization";
import { shopifyProductsAPI } from "@/lib/external-api/services/shopify-products";
import { transformProducts } from "@/lib/transformers/shopify-products";
import { shopifyProducts } from "@/db/schema/shopify-products";
import { productVariants } from "@/db/schema/product-variants";
import crypto from "crypto";

/**
 * POST handler for syncing products for a specific store
 * Accessible by any member of the organization
 */
export const POST = withOrganizationAuthRequired(async (req, context) => {
  try {
    const organization = await context.session.organization;
    const params = await context.params;
    const storeId = params.storeId as string;

    // Validate storeId is provided
    if (!storeId || typeof storeId !== "string") {
      return NextResponse.json(
        { error: "Store ID is required" },
        { status: 400 }
      );
    }

    // Verify the store exists and belongs to the organization
    const storeQuery = await db
      .select()
      .from(stores)
      .where(
        eq(stores.id, storeId as string)
      );

    const store = storeQuery[0];
    
    if (!store) {
      return NextResponse.json(
        { error: "Store not found" },
        { status: 404 }
      );
    }

    if (store.organizationId !== organization.id) {
      return NextResponse.json(
        { error: "You do not have permission to sync products for this store" },
        { status: 403 }
      );
    }

    // Fetch products from RapidAPI
    const productsResponse = await shopifyProductsAPI.getProductsByStoreUrl(store.url);
    
    // Transform products to our data model
    const transformedData = transformProducts(productsResponse, storeId as string);
    
    if (transformedData.length === 0) {
      return NextResponse.json(
        { message: "No products found for this store" },
        { status: 200 }
      );
    }

    // Begin transaction to ensure data consistency
    // First, delete existing products for this store
    await db.delete(shopifyProducts).where(eq(shopifyProducts.storeId, storeId as string));
    
    // Insert new products and variants
    const insertedProducts = [];
    
    for (const item of transformedData) {
      // Insert product
      const productId = crypto.randomUUID();
      const [newProduct] = await db
        .insert(shopifyProducts)
        .values({
          id: productId,
          ...item.product,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      insertedProducts.push(newProduct);
      
      // Insert variants for this product
      if (item.variants.length > 0) {
        await db
          .insert(productVariants)
          .values(
            item.variants.map(variant => ({
              id: crypto.randomUUID(),
              productId: productId,
              ...variant,
              createdAt: new Date(),
              updatedAt: new Date()
            }))
          );
      }
    }
    
    // Update store's lastSyncedAt timestamp
    await db
      .update(stores)
      .set({ lastSyncedAt: new Date(), updatedAt: new Date() })
      .where(eq(stores.id, storeId as string));
    
    return NextResponse.json({
      message: `Successfully synced ${insertedProducts.length} products`,
      productCount: insertedProducts.length,
    });
  } catch (error: any) {
    console.error("Error syncing products:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to sync products",
        details: error.message || String(error)
      },
      { status: 500 }
    );
  }
}, OrganizationRole.enum.user);
