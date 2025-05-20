/**
 * Type definitions for the Lookr Studio
 */

// Prediction options for FashnAI API
export interface PredictionOptions {
  category?: 'auto' | 'tops' | 'bottoms' | 'one-pieces';
  segmentation_free?: boolean;
  moderation_level?: 'conservative' | 'permissive' | 'none';
  garment_photo_type?: 'auto' | 'flat-lay' | 'model';
  mode?: 'performance' | 'balanced' | 'quality';
  seed?: number;
  num_samples?: number;
  output_format?: 'png' | 'jpeg';
  return_base64?: boolean;
}

// Response from the create prediction API
export interface PredictionResponse {
  id: string;
  error: string | null;
}

// Status response from the prediction API
export interface PredictionStatusResponse {
  id: string;
  status: 'starting' | 'in_queue' | 'processing' | 'completed' | 'failed';
  output?: string[];
  error: string | null;
  // Extended properties for internal use
  assetId?: string;
  internalUrl?: string;
}

// Avatar definition for the Lookr Studio
export interface Avatar {
  id: string;
  name: string;
  imageUrl: string;
  examples?: string[]; // URLs to example images
  metadata?: Record<string, any>;
}

// Product image source (upload or existing asset)
export interface ProductSource {
  type: 'upload' | 'asset';
  id?: string; // Asset ID if type is 'asset'
  name: string;
  url: string;
  localStorageKey?: string; // Key in localStorage if type is 'upload'
}

// Format of saved predictions in localStorage
export interface SavedPrediction {
  id: string;
  productSource: ProductSource;
  avatarId: string;
  createdAt: string;
  status: PredictionStatusResponse['status'];
  resultUrl?: string;
  outputUrls?: string[]; // Store all output URLs from the API response
  assetId?: string; // ID of the asset created from this prediction
  internalUrl?: string; // Internal URL to use instead of external FashnAI URL
}
