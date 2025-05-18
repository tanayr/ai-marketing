/**
 * Utility for managing temporary images in local storage
 * Only uploads images to the server when a design is saved
 */

// Local storage keys
const STORAGE_KEY_PREFIX = 'retouchr_temp_img_';
const STORAGE_INDEX_KEY = 'retouchr_temp_img_index';

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
 * Save an image to local storage
 */
export const saveImageToLocalStorage = (dataUrl: string, name: string = 'image'): LocalImage => {
  // Generate a unique ID
  const id = generateImageId();
  const key = `${STORAGE_KEY_PREFIX}${id}`;
  
  // Create the image object
  const image: LocalImage = {
    id,
    dataUrl,
    name,
    timestamp: Date.now()
  };
  
  // Save to local storage
  try {
    localStorage.setItem(key, JSON.stringify(image));
    
    // Update index
    const existingIndex = getLocalImageIndex();
    existingIndex.push(id);
    localStorage.setItem(STORAGE_INDEX_KEY, JSON.stringify(existingIndex));
    
    return image;
  } catch (error) {
    console.error('Error saving image to local storage:', error);
    throw new Error('Failed to save image to local storage');
  }
};

/**
 * Get a single image from local storage
 */
export const getImageFromLocalStorage = (id: string): LocalImage | null => {
  const key = `${STORAGE_KEY_PREFIX}${id}`;
  
  try {
    const imageJson = localStorage.getItem(key);
    if (!imageJson) return null;
    
    return JSON.parse(imageJson) as LocalImage;
  } catch (error) {
    console.error('Error retrieving image from local storage:', error);
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
 * Remove an image from local storage
 */
export const removeImageFromLocalStorage = (id: string): void => {
  const key = `${STORAGE_KEY_PREFIX}${id}`;
  
  try {
    // Remove the image
    localStorage.removeItem(key);
    
    // Update index
    const existingIndex = getLocalImageIndex();
    const updatedIndex = existingIndex.filter(imageId => imageId !== id);
    localStorage.setItem(STORAGE_INDEX_KEY, JSON.stringify(updatedIndex));
  } catch (error) {
    console.error('Error removing image from local storage:', error);
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
 * Clear all temporary images from local storage
 */
export const clearAllLocalImages = (): void => {
  const imageIds = getLocalImageIndex();
  
  // Remove all images
  imageIds.forEach(id => {
    const key = `${STORAGE_KEY_PREFIX}${id}`;
    localStorage.removeItem(key);
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
