// Configuration for external APIs
export const rapidAPIConfig = {
  shopify: {
    host: process.env.RAPIDAPI_SHOPIFY_HOST || 'shopify-stores-info.p.rapidapi.com',
    key: process.env.RAPIDAPI_KEY || '',
    baseUrl: 'https://shopify-stores-info.p.rapidapi.com',
  },
};
