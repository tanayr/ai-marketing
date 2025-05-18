import { useState } from 'react';
import { FileUploadOptions, FileUploadResponse, UrlToFileOptions } from './types';

/**
 * React hook for file uploads with support for both direct uploads 
 * and URL-based uploads
 */
export function useFileUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const [uploadResponse, setUploadResponse] = useState<FileUploadResponse | null>(null);
  
  // Upload file directly to backend
  const uploadFile = async (file: File, options: FileUploadOptions = {}) => {
    try {
      setIsUploading(true);
      setError(null);
      setProgress(0);
      
      // Validate file size
      if (options.maxSizeMB && file.size > options.maxSizeMB * 1024 * 1024) {
        throw new Error(`File exceeds maximum size of ${options.maxSizeMB}MB`);
      }
      
      // Validate file type
      if (options.acceptedTypes && options.acceptedTypes.length > 0 && 
          !options.acceptedTypes.includes(file.type)) {
        throw new Error(`File type ${file.type} not accepted`);
      }
      
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      if (options.path) formData.append('path', options.path);
      
      // Upload file
      const response = await fetch('/api/uploads', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Upload failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      setUploadResponse(data);
      
      if (options.onSuccess) {
        options.onSuccess(data);
      }
      
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown upload error');
      setError(error);
      if (options.onError) options.onError(error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };
  
  // Upload from URL
  const uploadFromUrl = async (url: string, options: UrlToFileOptions = {}) => {
    try {
      setIsUploading(true);
      setError(null);
      
      const response = await fetch('/api/uploads/from-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          url,
          path: options.path,
          filename: options.filename 
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `URL upload failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      setUploadResponse(data);
      
      if (options.onSuccess) {
        options.onSuccess(data);
      }
      
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown upload error');
      setError(error);
      if (options.onError) options.onError(error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };
  
  const reset = () => {
    setIsUploading(false);
    setProgress(0);
    setError(null);
    setUploadResponse(null);
  };
  
  return {
    uploadFile,
    uploadFromUrl,
    reset,
    isUploading,
    progress,
    error,
    uploadResponse
  };
}
