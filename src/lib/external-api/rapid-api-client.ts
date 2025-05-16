import { RapidAPIError } from './errors';

interface RapidAPIConfig {
  host: string;
  key: string;
  baseUrl: string;
}

/**
 * Generic client for making RapidAPI HTTP requests
 */
export class RapidAPIClient {
  private config: RapidAPIConfig;

  constructor(config: RapidAPIConfig) {
    this.config = config;
  }

  /**
   * Make a fetch request to a RapidAPI endpoint with appropriate headers
   */
  async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;
    
    const headers = {
      'x-rapidapi-host': this.config.host,
      'x-rapidapi-key': this.config.key,
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        throw new RapidAPIError(
          `API call failed: ${response.status}`,
          response.status,
          await response.text()
        );
      }

      return await response.json();
    } catch (error) {
      // Handle and transform errors for consistent error reporting
      if (error instanceof RapidAPIError) {
        throw error;
      }
      throw new RapidAPIError('API request failed', 500, String(error));
    }
  }
}
