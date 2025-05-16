import { ShopifyStoreResponse } from "../external-api/services/shopify-store";
import { Store } from "@/db/schema/stores";

/**
 * Transformed store information ready for database storage
 */
export interface TransformedStoreInfo {
  name: string;
  url: string;
  icon: string | null;
  category: string | null;
  description: string | null;
}

/**
 * Transform RapidAPI Shopify store response into our application's data model
 */
export function transformStoreInfo(
  response: ShopifyStoreResponse, 
  originalUrl: string
): TransformedStoreInfo {
  const { domain_info } = response;
  
  // Extract store icon (prefer logo, fallback to image)
  const storeIcon = domain_info.logo || domain_info.image || null;
  
  // Build a clean store name (site_name is often more accurate than title)
  const storeName = domain_info.site_name || domain_info.title || "Shopify Store";
  
  // Use the URL provided by the user instead of what might be in the response
  // This ensures we store what the user actually entered
  
  return {
    name: storeName,
    url: originalUrl,
    icon: storeIcon,
    category: null, // Category would need to be added by the user or determined from products
    description: domain_info.description || null,
  };
}
