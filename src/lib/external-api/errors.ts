/**
 * Custom error class for RapidAPI-related errors
 */
export class RapidAPIError extends Error {
  status: number;
  responseText: string;

  constructor(message: string, status: number = 500, responseText: string = '') {
    super(message);
    this.name = 'RapidAPIError';
    this.status = status;
    this.responseText = responseText;
  }
}
