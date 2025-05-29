/**
 * Type definitions for OpenAI API interactions
 */

// Basic image generation options
export interface ImageGenerationOptions {
  model?: string;
  size?: string;
  style?: string;
  quality?: string;
  responseFormat?: 'url' | 'b64_json';
  n?: number;
  stream?: boolean;
  partialImages?: number;
  referenceImage?: string; // URL of reference image
}

// Responses API content types
export type ResponsesContentItem = 
  | { type: 'input_text'; text: string }
  | { type: 'input_image'; image_url: string }
  | { type: 'input_image'; file_id: string };

// Responses API specific options
export interface ResponsesApiOptions {
  model: string;
  input: Array<{
    role: string;
    content: ResponsesContentItem[];
  }>;
  tools: Array<{
    type: string;
    partial_images?: number;
  }>;
  stream: boolean;
}

// Standard image generation response
export interface ImageGenerationResponse {
  created: number;
  data: Array<{
    url?: string;
    b64_json?: string;
  }>;
}

// Streaming event response
export interface StreamingEvent {
  type: string;
  // Event types for partial images
  partial_image_index?: number;
  partial_image_b64?: string;
  image_b64?: string;
  
  // Other fields from the OpenAI Response API
  content?: {
    image_b64?: string;
  };
  status?: string;
  result?: string;
  
  // Response object from final completed event
  response?: {
    id?: string;
    output?: Array<{
      type: string;
      status?: string;
      content?: {
        image_b64?: string;
      };
      result?: string;
    }>;
  };
}

// Image processing result
export interface ImageProcessingResult {
  url: string;
  id: string;
  assetData: any;
}
