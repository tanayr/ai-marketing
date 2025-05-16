import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { stores } from "@/db/schema";
import { shopifyProducts } from "@/db/schema/shopify-products";
import { productVariants } from "@/db/schema/product-variants";
import withOrganizationAuthRequired from "@/lib/auth/withOrganizationAuthRequired";
import { OrganizationRole } from "@/db/schema/organization";

/**
 * GET handler for fetching all products for a specific store
 * Accessible by any member of the organization
 */
export const GET = withOrganizationAuthRequired(async (req, context) => {
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
        { error: "You do not have permission to access products for this store" },
        { status: 403 }
      );
    }

    // Fetch products from the database
    const productsQuery = await db
      .select()
      .from(shopifyProducts)
      .where(eq(shopifyProducts.storeId, storeId as string));

    // If no products are found, return an empty array
    if (productsQuery.length === 0) {
      return NextResponse.json([]);
    }

    // Fetch variants for all products
    const productIds = productsQuery.map(product => product.id);
    const variantsQuery = await db
      .select()
      .from(productVariants)
      .where(
        // Use the in operator from drizzle-orm instead of whereIn
        eq(productVariants.productId, productIds[0])
      );
    
    // If more than one product, add more conditions
    if (productIds.length > 1) {
      const additionalVariants = await Promise.all(
        productIds.slice(1).map(id => 
          db.select()
            .from(productVariants)
            .where(eq(productVariants.productId, id))
        )
      );
      
      // Flatten the results
      additionalVariants.forEach(variants => {
        variantsQuery.push(...variants);
      });
    }

    // Group variants by productId for easier association
    const variantsByProductId: Record<string, typeof variantsQuery> = {};
    
    for (const variant of variantsQuery) {
      if (!variantsByProductId[variant.productId]) {
        variantsByProductId[variant.productId] = [];
      }
      variantsByProductId[variant.productId].push(variant);
    }

    // Combine products with their variants
    const productsWithVariants = productsQuery.map(product => ({
      ...product,
      variants: variantsByProductId[product.id] || []
    }));

    return NextResponse.json(productsWithVariants);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}, OrganizationRole.enum.user);
