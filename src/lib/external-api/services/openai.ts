import { openAIConfig } from '../config';
import { 
  ImageGenerationOptions, 
  ImageGenerationResponse, 
  ResponsesApiOptions, 
  StreamingEvent,
  ResponsesContentItem 
} from './openai-types';
import { imageUrlToBase64 } from './image-utils';

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
   * For gpt-image-1 models, uses the Responses API with reference image support
   */
  async generateImage(prompt: string, options: ImageGenerationOptions = {}): Promise<ImageGenerationResponse> {
    const model = options.model || openAIConfig.defaultModel;
    
    // If streaming is requested, use streaming implementation
    if (options.stream) {
      throw new Error('For streaming image generation, use streamGenerateImage() instead');
    }
    
    // Use new Responses API for gpt-image-1 with reference image
    if (model === 'gpt-image-1' && options.referenceImage) {
      return this.generateImageWithResponses(prompt, options);
    }
    
    // Legacy implementation for standard image generation
    return this.legacyGenerateImage(prompt, options);
  }
  
  /**
   * Legacy image generation method for non-gpt-image-1 models
   */
  private async legacyGenerateImage(prompt: string, options: ImageGenerationOptions = {}): Promise<ImageGenerationResponse> {
    const endpoint = `${this.baseUrl}/images/generations`;
    const model = options.model || openAIConfig.defaultModel;
    
    // Base request body
    const requestBody: Record<string, any> = {
      model: model,
      prompt: prompt,
      n: options.n || 1,
      size: options.size || '1024x1024',
    };
    
    // Add model-specific parameters for DALL-E models
    if (model === 'dall-e-3' || model === 'dall-e-2') {
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
  
  /**
   * Generate image using the new Responses API
   * Supports reference images
   */
  private async generateImageWithResponses(prompt: string, options: ImageGenerationOptions = {}): Promise<ImageGenerationResponse> {
    const endpoint = `${this.baseUrl}/responses`;
    // For image generation without streaming, we need to use gpt-4.1-mini or gpt-4.1
    // because gpt-image-1 does not support the image_generation tool
    const model = options.model === 'gpt-image-1' ? 'gpt-4.1-mini' : options.model || 'gpt-4.1-mini';
    
    // Prepare user input
    let userContent: ResponsesContentItem[] = [
      { type: 'input_text', text: prompt }
    ];
    
    // Add reference image if provided
    if (options.referenceImage) {
      try {
        const base64Image = await imageUrlToBase64(options.referenceImage);
        userContent.push({
          type: 'input_image',
          image_url: `data:image/jpeg;base64,${base64Image}`
        });
      } catch (error) {
        console.error('Error processing reference image:', error);
        throw new Error('Failed to process reference image');
      }
    }
    
    const requestBody = {
      model: model,
      input: [
        {
          role: 'user',
          content: userContent
        }
      ],
      tools: [{ type: 'image_generation' }]
    };
    
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
      
      const result = await response.json();
      
      // Extract image data from response
      const imageGenerationCalls = result.output.filter((output: any) => 
        output.type === 'image_generation_call' && output.status === 'completed'
      );
      
      if (imageGenerationCalls.length === 0) {
        throw new Error('No image was generated in the response');
      }
      
      const imageData = imageGenerationCalls[0].result;
      
      // Format to match the traditional response structure
      return {
        created: Date.now(),
        data: [{
          b64_json: imageData
        }]
      };
    } catch (error) {
      console.error('Error generating image with Responses API:', error);
      throw error;
    }
  }
  
  /**
   * Stream image generation with partial images
   * Returns a ReadableStream that emits StreamingEvent objects
   * 
   * Note: This requires gpt-4.1 model and cannot be used with gpt-image-1
   */
  async streamGenerateImage(prompt: string, options: ImageGenerationOptions = {}): Promise<ReadableStream> {
    const endpoint = `${this.baseUrl}/responses`;
    // For streaming with partial images, we need to use gpt-4.1
    // gpt-image-1 does not support the image_generation tool with partial_images
    const model = 'gpt-4.1';
    
    // Prepare user input with prompt
    const userContent: ResponsesContentItem[] = [
      { type: 'input_text', text: prompt }
    ];
    
    // Add reference image if provided
    if (options.referenceImage) {
      try {
        const base64Image = await imageUrlToBase64(options.referenceImage);
        userContent.push({
          type: 'input_image',
          image_url: `data:image/jpeg;base64,${base64Image}`
        });
      } catch (error) {
        console.error('Error processing reference image:', error);
        throw new Error('Failed to process reference image');
      }
    }
    
    // Prepare the request body according to the OpenAI documentation
    const requestBody = {
      model: model,
      input: [
        {
          role: 'user',
          content: userContent
        }
      ],
      tools: [{ 
        type: 'image_generation',
        partial_images: options.partialImages || 2
      }],
      stream: true
    };
    
    try {
      console.log('Streaming image generation with request:', JSON.stringify(requestBody, null, 2));
      
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
      
      if (!response.body) {
        throw new Error('No response body received');
      }
      
      return response.body;
    } catch (error) {
      console.error('Error streaming image generation:', error);
      throw error;
    }
  }
}

// Export a singleton instance for use throughout the application
export const openAIService = new OpenAIService();
