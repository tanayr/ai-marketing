import { openAIConfig } from '../config';

export interface ImageGenerationOptions {
  model?: string;
  size?: string;
  style?: string;
  quality?: string;
  responseFormat?: 'url' | 'b64_json';
  n?: number;
}

export interface ImageGenerationResponse {
  created: number;
  data: Array<{
    url?: string;
    b64_json?: string;
  }>;
}

/**
 * Service for OpenAI API interactions
 */
export class OpenAIService {
  private apiKey: string;
  private baseUrl: string;
  
  constructor() {
    this.apiKey = openAIConfig.apiKey;
    this.baseUrl = openAIConfig.baseUrl;
  }
  
  /**
   * Generate an image using provided prompt
   */
  async generateImage(prompt: string, options: ImageGenerationOptions = {}) {
    const endpoint = `${this.baseUrl}/images/generations`;
    const model = options.model || openAIConfig.defaultModel;
    
    // Base request body that works for all models
    const requestBody: Record<string, any> = {
      model: model,
      prompt: prompt,
      n: options.n || 1,
      size: options.size || '1024x1024',
    };
    
    // Add model-specific parameters
    if (model === 'gpt-image-1') {
      // gpt-image-1 doesn't support response_format parameter
      // It always returns base64 images
    } else if (model === 'dall-e-3' || model === 'dall-e-2') {
      // These models support response_format, style and quality parameters
      requestBody.response_format = options.responseFormat || 'url';
      
      if (model === 'dall-e-3') {
        requestBody.style = options.style || 'vivid';
        requestBody.quality = options.quality || 'standard';
      }
    }
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API Error (${response.status}): ${errorText}`);
      }
      
      return await response.json() as ImageGenerationResponse;
    } catch (error) {
      console.error('Error generating image:', error);
      throw error;
    }
  }
}

// Export a singleton instance for use throughout the application
export const openAIService = new OpenAIService();
