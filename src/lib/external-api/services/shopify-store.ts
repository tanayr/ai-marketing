import { RapidAPIClient } from '../rapid-api-client';
import { rapidAPIConfig } from '../config';

/**
 * Response type for Shopify store info from RapidAPI
 */
export interface ShopifyStoreResponse {
  domain_info: {
    title?: string;
    site_name?: string;
    logo?: string;
    image?: string; // Some responses use image instead of logo
    description?: string;
    storeId?: string;
    accessToken?: string;
    locale?: string;
    storeCurrency?: string;
    storeCountry?: string;
    shopId?: string;
    creationDate?: string;
    availableProducts?: number;
    url?: string;
    socialMedia?: Array<{ social: string; url: string }>;
    emails?: string[];
    addresses?: any[];
    phoneNumbers?: string[];
    // Other fields may be present but we only defined what we've seen
  };
}

/**
 * Service for Shopify store-related API calls
 */
export class ShopifyStoreAPI {
  private client: RapidAPIClient;

  constructor() {
    this.client = new RapidAPIClient(rapidAPIConfig.shopify);
  }

  /**
   * Get information about a Shopify store by URL
   */
  async getStoreInfo(storeUrl: string): Promise<ShopifyStoreResponse> {
    const encodedUrl = encodeURIComponent(storeUrl);
    return await this.client.fetch<ShopifyStoreResponse>(`/store/info?url=${encodedUrl}`);
  }
}

// Export a singleton instance for use throughout the application
export const shopifyStoreAPI = new ShopifyStoreAPI();
