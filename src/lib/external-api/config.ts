// Configuration for external APIs
export const rapidAPIConfig = {
  shopify: {
    host: process.env.RAPIDAPI_SHOPIFY_HOST || 'shopify-stores-info.p.rapidapi.com',
    key: process.env.RAPIDAPI_KEY || '',
    baseUrl: 'https://shopify-stores-info.p.rapidapi.com',
  },
};

// OpenAI API configuration
export const openAIConfig = {
  apiKey: process.env.OPENAI_API_KEY || '',
  baseUrl: 'https://api.openai.com/v1',
  defaultModel: 'gpt-image-1', // Most capable model for image generation
};
