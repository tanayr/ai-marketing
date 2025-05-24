/**
 * Utility for managing temporary images in local storage
 * Only uploads images to the server when a design is saved
 */

// Local storage keys
const STORAGE_KEY_PREFIX = 'retouchr_temp_img_';
const STORAGE_INDEX_KEY = 'retouchr_temp_img_index';

// Size limits and quality settings
const MAX_UNCOMPRESSED_SIZE = 1024 * 1024; // 1MB - if larger, compress
const MAX_STORAGE_SIZE = 4 * 1024 * 1024; // 4MB - maximum size to store
const COMPRESSION_QUALITY = 0.6; // JPEG compression quality

// In-memory fallback storage for images too large for localStorage
const MEMORY_STORAGE: Record<string, LocalImage> = {};

// Types
interface LocalImage {
  id: string;
  dataUrl: string;
  name: string;
  timestamp: number;
}

/**
 * Generate a unique ID for a local image
 */
const generateImageId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Estimate the size of a string in bytes
 */
const estimateSize = (str: string): number => {
  // Each character in a string is 2 bytes in JavaScript
  return str.length * 2;
};

/**
 * Compress an image data URL
 */
const compressImage = async (dataUrl: string, quality: number = COMPRESSION_QUALITY): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // Create a canvas to draw the compressed image
      const canvas = document.createElement('canvas');
      
      // Set dimensions (could downscale here for very large images)
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw image to canvas
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0);
      
      // Convert to compressed JPEG
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image for compression'));
    };
    
    img.src = dataUrl;
  });
};

/**
 * Save an image to local storage or memory fallback
 */
export const saveImageToLocalStorage = async (dataUrl: string, name: string = 'image'): Promise<LocalImage> => {
  // Generate a unique ID
  const id = generateImageId();
  const key = `${STORAGE_KEY_PREFIX}${id}`;
  
  // Estimate initial size
  const initialSize = estimateSize(dataUrl);
  
  // Determine if compression is needed
  let finalDataUrl = dataUrl;
  let useMemoryFallback = false;
  
  try {
    // Compress large images
    if (initialSize > MAX_UNCOMPRESSED_SIZE) {
      try {
        finalDataUrl = await compressImage(dataUrl);
        console.log(`Compressed image from ~${Math.round(initialSize/1024)}KB to ~${Math.round(estimateSize(finalDataUrl)/1024)}KB`);
      } catch (compressError) {
        console.warn('Image compression failed, using original:', compressError);
      }
    }
    
    // Create the image object
    const image: LocalImage = {
      id,
      dataUrl: finalDataUrl,
      name,
      timestamp: Date.now()
    };
    
    // Check if the compressed image is still too large for localStorage
    const finalSize = estimateSize(finalDataUrl);
    if (finalSize > MAX_STORAGE_SIZE) {
      // Image is too large for localStorage, store in memory
      useMemoryFallback = true;
      MEMORY_STORAGE[id] = image;
      console.log(`Image too large for localStorage (~${Math.round(finalSize/1024)}KB), using in-memory storage`);
    } else {
      // Store in localStorage
      localStorage.setItem(key, JSON.stringify(image));
    }
    
    // Update index regardless of storage method
    const existingIndex = getLocalImageIndex();
    existingIndex.push(id);
    localStorage.setItem(STORAGE_INDEX_KEY, JSON.stringify(existingIndex));
    
    return image;
  } catch (error) {
    console.error('Error saving image:', error);
    
    // Last resort: if localStorage failed, try memory fallback
    if (!useMemoryFallback) {
      useMemoryFallback = true;
      const fallbackImage: LocalImage = {
        id,
        dataUrl: finalDataUrl,
        name,
        timestamp: Date.now()
      };
      
      MEMORY_STORAGE[id] = fallbackImage;
      
      // Update index
      const existingIndex = getLocalImageIndex();
      existingIndex.push(id);
      localStorage.setItem(STORAGE_INDEX_KEY, JSON.stringify(existingIndex));
      
      return fallbackImage;
    }
    
    throw new Error('Failed to save image to storage');
  }
};

/**
 * Get a single image from storage (localStorage or memory fallback)
 */
export const getImageFromLocalStorage = (id: string): LocalImage | null => {
  // First check memory fallback
  if (MEMORY_STORAGE[id]) {
    return MEMORY_STORAGE[id];
  }
  
  // Then check localStorage
  const key = `${STORAGE_KEY_PREFIX}${id}`;
  
  try {
    const imageJson = localStorage.getItem(key);
    if (!imageJson) return null;
    
    return JSON.parse(imageJson) as LocalImage;
  } catch (error) {
    console.error('Error retrieving image from storage:', error);
    return null;
  }
};

/**
 * Get all locally stored images
 */
export const getAllLocalImages = (): LocalImage[] => {
  const imageIds = getLocalImageIndex();
  
  return imageIds
    .map(id => getImageFromLocalStorage(id))
    .filter((img): img is LocalImage => img !== null);
};

/**
 * Remove an image from storage (localStorage or memory fallback)
 */
export const removeImageFromLocalStorage = (id: string): void => {
  const key = `${STORAGE_KEY_PREFIX}${id}`;
  
  try {
    // Remove from localStorage if it exists there
    localStorage.removeItem(key);
    
    // Remove from memory storage if it exists there
    if (MEMORY_STORAGE[id]) {
      delete MEMORY_STORAGE[id];
    }
    
    // Update index
    const existingIndex = getLocalImageIndex();
    const updatedIndex = existingIndex.filter(imageId => imageId !== id);
    localStorage.setItem(STORAGE_INDEX_KEY, JSON.stringify(updatedIndex));
  } catch (error) {
    console.error('Error removing image from storage:', error);
  }
};

/**
 * Get the index of all local images
 */
const getLocalImageIndex = (): string[] => {
  try {
    const indexJson = localStorage.getItem(STORAGE_INDEX_KEY);
    if (!indexJson) return [];
    
    return JSON.parse(indexJson) as string[];
  } catch (error) {
    console.error('Error retrieving image index from local storage:', error);
    return [];
  }
};

/**
 * Clear all temporary images from storage (localStorage and memory fallback)
 */
export const clearAllLocalImages = (): void => {
  const imageIds = getLocalImageIndex();
  
  // Remove all images
  imageIds.forEach(id => {
    const key = `${STORAGE_KEY_PREFIX}${id}`;
    localStorage.removeItem(key);
    
    // Also clear from memory storage
    if (MEMORY_STORAGE[id]) {
      delete MEMORY_STORAGE[id];
    }
  });
  
  // Clear index
  localStorage.removeItem(STORAGE_INDEX_KEY);
};

/**
 * Convert a File to a dataURL
 */
export const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const result = e.target?.result as string;
      resolve(result);
    };
    
    reader.onerror = (e) => {
      reject(e);
    };
    
    reader.readAsDataURL(file);
  });
};
