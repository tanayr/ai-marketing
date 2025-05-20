import { PredictionOptions, PredictionResponse, PredictionStatusResponse } from '@/components/studio/lookr/types';

/**
 * Custom error class for FashnAI-related errors
 */
export class FashnAIError extends Error {
  status: number;
  responseText: string;

  constructor(message: string, status: number = 500, responseText: string = '') {
    super(message);
    this.name = 'FashnAIError';
    this.status = status;
    this.responseText = responseText;
  }
}

/**
 * Client for making FashnAI API requests
 */
export class FashnAIClient {
  private apiKey: string;
  private baseUrl: string = 'https://api.fashn.ai/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Make a fetch request to a FashnAI endpoint with appropriate headers
   */
  private async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        throw new FashnAIError(
          `API call failed: ${response.status}`,
          response.status,
          await response.text()
        );
      }

      return await response.json();
    } catch (error) {
      // Handle and transform errors for consistent error reporting
      if (error instanceof FashnAIError) {
        throw error;
      }
      throw new FashnAIError('API request failed', 500, String(error));
    }
  }

  /**
   * Create a new try-on prediction
   */
  async createPrediction(
    modelImage: string,
    garmentImage: string,
    options: PredictionOptions = {}
  ): Promise<PredictionResponse> {
    const body = {
      model_image: modelImage,
      garment_image: garmentImage,
      ...options
    };

    return this.fetch<PredictionResponse>('/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  }

  /**
   * Get the status of a prediction
   */
  async getPredictionStatus(predictionId: string): Promise<PredictionStatusResponse> {
    return this.fetch<PredictionStatusResponse>(`/status/${predictionId}`);
  }
}
