/**
 * Utilities for image processing and conversion
 */
// Using built-in fetch API

/**
 * Converts an image URL to base64 string
 * @param imageUrl URL of the image to convert
 * @returns Promise resolving to base64 string
 */
export async function imageUrlToBase64(imageUrl: string): Promise<string> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return buffer.toString('base64');
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw error;
  }
}

/**
 * Determines the MIME type from a base64 image or defaults to image/png
 * @param base64Image Base64 encoded image data
 * @returns MIME type string
 */
export function getMimeTypeFromBase64(base64Image: string): string {
  // Simple check for common image signatures
  if (base64Image.startsWith('/9j/')) {
    return 'image/jpeg';
  } else if (base64Image.startsWith('iVBORw0KGgo')) {
    return 'image/png';
  } else if (base64Image.startsWith('R0lGODlh')) {
    return 'image/gif';
  } else if (base64Image.startsWith('UklGR')) {
    return 'image/webp';
  }
  
  // Default to PNG if can't determine
  return 'image/png';
}

/**
 * Creates a data URL from a base64 string and mime type
 * @param base64 Base64 encoded image data
 * @param mimeType MIME type of the image
 * @returns Data URL string
 */
export function createDataUrl(base64: string, mimeType: string = 'image/png'): string {
  return `data:${mimeType};base64,${base64}`;
}

/**
 * Extracts base64 data from a data URL
 * @param dataUrl Data URL string
 * @returns Base64 encoded string
 */
export function extractBase64FromDataUrl(dataUrl: string): string {
  if (!dataUrl) return '';
  const matches = dataUrl.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
  if (matches && matches.length === 3) {
    return matches[2];
  }
  return dataUrl; // Return original if not a data URL
}

/**
 * Validates if an image URL is accessible
 * @param url Image URL to validate
 * @returns Promise resolving to boolean indicating if image is valid
 */
export async function validateImageUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    const contentType = response.headers.get('content-type') || '';
    return response.ok && contentType.startsWith('image/');
  } catch (error) {
    return false;
  }
}
