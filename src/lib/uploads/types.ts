/**
 * Common types for file uploads across studios
 */

export interface FileUploadResponse {
  key: string;         // S3 object key
  url: string;         // Public URL to the file
  contentType: string; // MIME type
  filename: string;    // Original filename
  path: string;        // S3 path without filename
}

export interface FileUploadOptions {
  path?: string;       // Custom S3 path
  onProgress?: (progress: number) => void;
  onSuccess?: (response: FileUploadResponse) => void;
  onError?: (error: Error) => void;
  maxSizeMB?: number;  // Max file size
  acceptedTypes?: string[]; // Accepted MIME types
}

export interface UrlToFileOptions {
  path?: string;
  filename?: string;
  onSuccess?: (response: FileUploadResponse) => void;
  onError?: (error: Error) => void;
}
