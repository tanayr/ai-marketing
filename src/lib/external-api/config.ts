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

// Gemini AI API configuration
export const geminiAIConfig = {
  apiKey: process.env.GEMINI_API_KEY || '',
  baseUrl: 'https://us-central1-aiplatform.googleapis.com/v1', // Vertex AI base URL
  defaultModel: 'imagen-4.0-generate-preview-05-20', // Specific model for Imagegen 4
};
