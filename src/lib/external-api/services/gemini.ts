import { geminiAIConfig } from '../config';

export interface GeminiImageGenerationOptions {
  // Based on OpenAI options and common Imagen params
  prompt: string;
  referenceImageB64?: string; // Base64 encoded image data
  referenceImageGcsUri?: string; // GCS URI for the image
  numberOfImages?: number;
  aspectRatio?: string; // e.g., "1:1", "16:9"
  responseFormat?: 'b64_json'; // For consistency, though Imagen returns it by default
  // Add other Imagen 4 specific parameters as needed from docs
  // e.g., quality, style, seed, safetySettings etc.
}

export interface GeminiImageGenerationResponse {
  // Based on Imagen API response structure
  predictions: Array<{
    bytesBase64Encoded?: string;
    mimeType?: string;
    // Potentially other fields like safetyAttributes
  }>;
}

export class GeminiService {
  private apiKey: string;
  private baseUrl: string;
  private defaultModel: string;
  private projectId: string;
  private location: string; // Extracted from baseUrl or configured

  constructor() {
    this.apiKey = geminiAIConfig.apiKey;
    this.baseUrl = geminiAIConfig.baseUrl; // e.g., https://us-central1-aiplatform.googleapis.com/v1
    this.defaultModel = geminiAIConfig.defaultModel;
    this.projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || ''; // User needs to set this

    // Extract location from baseUrl, e.g., "us-central1"
    // This is a simplistic extraction, assumes format like https://LOCATION-aiplatform.googleapis.com
    const urlParts = this.baseUrl.match(/https:\/\/([a-z0-9-]+)-aiplatform\.googleapis\.com/);
    this.location = urlParts ? urlParts[1] : 'us-central1'; // Default if extraction fails

    if (!this.projectId) {
      console.warn('GOOGLE_CLOUD_PROJECT_ID environment variable is not set. GeminiService may not work.');
    }
  }

  /**
   * Generate an image using a prompt and an optional reference image.
   * This method assumes the model supports image editing/reference capabilities.
   */
  async generateImageWithReference(options: GeminiImageGenerationOptions): Promise<GeminiImageGenerationResponse> {
    const modelToUse = this.defaultModel; // Or allow override via options
    // Full endpoint: projects/PROJECT_ID/locations/LOCATION/publishers/google/models/MODEL_ID:predict
    const endpoint = `${this.baseUrl}/projects/${this.projectId}/locations/${this.location}/publishers/google/models/${modelToUse}:predict`;

    const instances: any[] = [{ prompt: options.prompt }];
    if (options.referenceImageB64) {
      instances[0].image = { bytesBase64Encoded: options.referenceImageB64 };
    } else if (options.referenceImageGcsUri) {
      instances[0].image = { gcsUri: options.referenceImageGcsUri };
    }
    // If neither is provided, it's a text-to-image call.
    // If the model *requires* an image for an "edit" mode, this needs to be handled.

    const parameters: Record<string, any> = {
      sampleCount: options.numberOfImages || 1,
      // Ensure this is 'b64_json' equivalent by how Imagen returns data.
      // Imagen returns base64 by default if no storageUri is provided.
    };

    if (options.aspectRatio) {
      parameters.aspectRatio = options.aspectRatio;
    }
    
    // Add other parameters as needed, e.g., editConfig for specific edit modes if applicable
    // if (instances[0].image) { // If it's an image-to-image/edit task
    //   parameters.editConfig = { editMode: "your_chosen_edit_mode" }; // e.g., "mask-free" - check model compatibility
    // }

    const requestBody = {
      instances,
      parameters,
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`, // This might need to be an gcloud access token
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API Error (${response.status}): ${errorText} at ${endpoint}`);
      }

      return await response.json() as GeminiImageGenerationResponse;
    } catch (error) {
      console.error('Error generating image with Gemini:', error);
      throw error;
    }
  }
}

// Export a singleton instance for use throughout the application
export const geminiService = new GeminiService();
