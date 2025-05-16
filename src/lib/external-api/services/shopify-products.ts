import { RapidAPIClient } from '../rapid-api-client';
import { rapidAPIConfig } from '../config';

/**
 * Response interfaces for Shopify product info from RapidAPI
 */
export interface ShopifyProductVariant {
  id: number;
  title: string;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  sku: string | null;
  requires_shipping: boolean;
  taxable: boolean;
  featured_image: {
    id: number;
    product_id: number;
    position: number;
    created_at: string;
    updated_at: string;
    alt: string | null;
    width: number;
    height: number;
    src: string;
    variant_ids: number[];
  } | null;
  available: boolean;
  price: string;
  grams: number;
  compare_at_price: string | null;
  position: number;
  product_id: number;
  created_at: string;
  updated_at: string;
}

export interface ShopifyProductImage {
  id: number;
  product_id: number;
  position: number;
  created_at: string;
  updated_at: string;
  alt: string | null;
  width: number;
  height: number;
  src: string;
  variant_ids: number[];
}

export interface ShopifyProductOption {
  id: number;
  product_id: number;
  name: string;
  position: number;
  values: string[];
}

export interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  url: string;
  body_html: string;
  published_at: string;
  created_at: string;
  updated_at: string;
  vendor: string;
  product_type: string;
  tags: string[];
  variants: ShopifyProductVariant[];
  images: ShopifyProductImage[];
  options: ShopifyProductOption[];
}

export interface ShopifyProductsResponse {
  products: ShopifyProduct[];
}

/**
 * Service for Shopify product-related API calls
 */
export class ShopifyProductsAPI {
  private client: RapidAPIClient;

  constructor() {
    this.client = new RapidAPIClient(rapidAPIConfig.shopify);
  }

  /**
   * Get products for a Shopify store by URL
   */
  async getProductsByStoreUrl(storeUrl: string): Promise<ShopifyProductsResponse> {
    const encodedUrl = encodeURIComponent(storeUrl);
    return await this.client.fetch<ShopifyProductsResponse>(`/product/all?url=${encodedUrl}`);
  }
}

// Export a singleton instance for use throughout the application
export const shopifyProductsAPI = new ShopifyProductsAPI();
