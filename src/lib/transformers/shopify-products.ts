import { ShopifyProduct, ShopifyProductsResponse } from "../external-api/services/shopify-products";
import { ShopifyProduct as DBShopifyProduct } from "@/db/schema/shopify-products";
import type { ProductVariant } from "@/db/schema/product-variants";

/**
 * Transformed product information ready for database storage
 */
export interface TransformedProductData {
  product: Omit<DBShopifyProduct, "id" | "createdAt" | "updatedAt">;
  variants: Omit<ProductVariant, "id" | "productId" | "createdAt" | "updatedAt">[];
}

/**
 * Transform RapidAPI Shopify product response into our application's data model
 */
export function transformProducts(
  response: ShopifyProductsResponse,
  storeId: string
): TransformedProductData[] {
  if (!response.products || !Array.isArray(response.products)) {
    return [];
  }
  
  return response.products.map(product => transformSingleProduct(product, storeId));
}

/**
 * Transform a single product from the API response
 */
export function transformSingleProduct(
  product: ShopifyProduct,
  storeId: string
): TransformedProductData {
  // Transform the base product
  const transformedProduct = {
    storeId,
    shopifyProductId: String(product.id),
    title: product.title,
    productType: product.product_type || null,
    vendor: product.vendor || null,
    status: 'active', // Default value, may need to be determined from data
    description: product.body_html || null,
    tags: product.tags ? product.tags.join(',') : null,
    handle: product.handle || null,
    options: product.options?.map(option => ({
      name: option.name,
      position: option.position,
      values: option.values
    })) || [],
    images: product.images?.map(image => ({
      id: String(image.id),
      position: image.position,
      src: image.src,
      width: image.width,
      height: image.height,
      variant_ids: image.variant_ids?.map(id => String(id))
    })) || [],
    shopifyCreatedAt: new Date(product.created_at),
    shopifyUpdatedAt: new Date(product.updated_at)
  };

  // Transform variants
  const transformedVariants = product.variants?.map(variant => {
    const featuredImage = variant.featured_image || 
                          product.images?.find(img => img.variant_ids?.includes(variant.id));
    
    return {
      shopifyVariantId: String(variant.id),
      title: variant.title,
      price: variant.price,
      compareAtPrice: variant.compare_at_price || null,
      sku: variant.sku || null,
      option1: variant.option1 || null,
      option2: variant.option2 || null,
      option3: variant.option3 || null,
      grams: variant.grams || 0,
      requiresShipping: variant.requires_shipping,
      taxable: variant.taxable,
      available: variant.available,
      position: variant.position,
      featuredImageId: featuredImage ? String(featuredImage.id) : null,
      featuredImageSrc: featuredImage ? featuredImage.src : null,
      // Add timestamps for the database schema compatibility
      shopifyCreatedAt: new Date(variant.created_at),
      shopifyUpdatedAt: new Date(variant.updated_at)
    };
  }) || [];

  return {
    product: transformedProduct,
    variants: transformedVariants
  };
}
