"use client";

import { 
  FabricCanvas, 
  FabricObject, 
  FabricTextObject, 
  FabricImageObject,
  ToolExecutionResult 
} from '../types/shared-types';

/**
 * Find an object by ID on the canvas
 * 
 * This function handles multiple ways IDs can be stored in fabric objects.
 * NOTE: Removed references to enhanced-text and advanced-text - using unified IText approach now
 */
export const findObjectById = (canvas: FabricCanvas, objectId: string): FabricObject | null => {
  if (!canvas || !objectId) return null;
  
  try {
    // Try various ways of finding objects by ID
    return canvas.getObjects().find(obj => {
      // Check standard ID property
      if (obj.id === objectId) return true;
      
      // Check for _id property (used by some custom objects)
      if (obj._id === objectId) return true;
      
      // Try using the get method if available
      if (obj.get && typeof obj.get === 'function') {
        try {
          const id = obj.get('id');
          if (id === objectId) return true;
        } catch (e) {
          // Ignore get() errors
        }
      }
      
      // No match found
      return false;
    }) || null;
  } catch (error) {
    console.error(`Error finding object: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return null;
  }
};

/**
 * Validate that an object is of the expected type(s)
 */
export const validateObjectType = (object: FabricObject | null, validTypes: string[]): boolean => {
  if (!object) return false;
  return validTypes.includes(object.type || '');
};

/**
 * Check if object is a text object
 */
export const isTextObject = (object: FabricObject | null): object is FabricTextObject => {
  if (!object) return false;
  // NOTE: Removed enhanced-text and advanced-text references - using unified IText approach now
  return ['text', 'i-text' /* , 'enhanced-text', 'advanced-text' */].includes(object.type || '') || 
    // Property-based detection as fallback
    (typeof (object as any).text === 'string');
};

/**
 * Check if object is an image object
 */
export const isImageObject = (object: FabricObject | null): object is FabricImageObject => {
  if (!object) return false;
  return object.type === 'image';
};

/**
 * Generate a user-friendly display name for an object
 */
export const getObjectDisplayName = (object: FabricObject): string => {
  // Use existing name if available and not empty
  if (object.name && object.name.trim() !== '') return object.name;
  
  // For text objects, use truncated text content
  if (isTextObject(object) && object.text) {
    const textContent = object.text.trim();
    return textContent.length > 20 
      ? `${textContent.substring(0, 20)}...` 
      : textContent;
  }
  
  // For image objects, extract filename from src
  if (isImageObject(object)) {
    const src = object.getSrc?.() || object.src || '';
    if (src) {
      const match = src.match(/\/([^\/]+)$/);
      return match ? match[1] : `Image-${object.id?.substring(0, 6) || ''}`;
    }
  }
  
  // Default: type + id suffix
  return `${object.type || 'unknown'}-${object.id?.substring(0, 6) || ''}`;
};

/**
 * Extract key identifying property based on object type
 */
export const getIdentifyingProperty = (object: FabricObject): {
  text_snippet?: string;
  image_filename?: string;
  fill_color?: string;
  stroke_color?: string;
} => {
  if (isTextObject(object) && object.text) {
    return { 
      text_snippet: object.text.length > 30 
        ? `${object.text.substring(0, 30)}...` 
        : object.text 
    };
  }
  
  if (isImageObject(object)) {
    const src = object.getSrc?.() || object.src || '';
    if (src) {
      const match = src.match(/\/([^\/]+)$/);
      return { image_filename: match ? match[1] : 'unknown-image' };
    }
  }
  
  // For shapes and other objects
  if (object.fill && object.fill !== 'transparent') {
    return { fill_color: object.fill };
  }
  
  if (object.stroke && object.stroke !== 'transparent') {
    return { stroke_color: object.stroke };
  }
  
  return {};
};

/**
 * Get object's origin point
 */
export const getObjectOrigin = (object: FabricObject): { originX: string; originY: string } => {
  return {
    originX: object.originX || 'left',
    originY: object.originY || 'top'
  };
};

/**
 * Calculate position based on alignment and object origin
 */
export const calculateAlignedPosition = (
  canvas: FabricCanvas, 
  object: FabricObject, 
  alignment: string
): { left: number; top: number } => {
  const canvasWidth = canvas.getWidth();
  const canvasHeight = canvas.getHeight();
  const objectWidth = (object.width || 0) * (object.scaleX || 1);
  const objectHeight = (object.height || 0) * (object.scaleY || 1);
  const { originX, originY } = getObjectOrigin(object);
  
  let left = object.left || 0;
  let top = object.top || 0;
  
  // Calculate position based on alignment and origin
  switch (alignment) {
    case 'center':
      left = originX === 'center' ? canvasWidth / 2 : (canvasWidth / 2) - (objectWidth / 2);
      top = originY === 'center' ? canvasHeight / 2 : (canvasHeight / 2) - (objectHeight / 2);
      break;
    case 'top':
      left = originX === 'center' ? canvasWidth / 2 : (canvasWidth / 2) - (objectWidth / 2);
      top = originY === 'center' ? objectHeight / 2 : 0;
      break;
    case 'bottom':
      left = originX === 'center' ? canvasWidth / 2 : (canvasWidth / 2) - (objectWidth / 2);
      top = originY === 'center' ? canvasHeight - (objectHeight / 2) : canvasHeight - objectHeight;
      break;
    case 'left':
      left = originX === 'center' ? objectWidth / 2 : 0;
      top = originY === 'center' ? canvasHeight / 2 : (canvasHeight / 2) - (objectHeight / 2);
      break;
    case 'right':
      left = originX === 'center' ? canvasWidth - (objectWidth / 2) : canvasWidth - objectWidth;
      top = originY === 'center' ? canvasHeight / 2 : (canvasHeight / 2) - (objectHeight / 2);
      break;
    case 'top-left':
      left = originX === 'center' ? objectWidth / 2 : 0;
      top = originY === 'center' ? objectHeight / 2 : 0;
      break;
    case 'top-right':
      left = originX === 'center' ? canvasWidth - (objectWidth / 2) : canvasWidth - objectWidth;
      top = originY === 'center' ? objectHeight / 2 : 0;
      break;
    case 'bottom-left':
      left = originX === 'center' ? objectWidth / 2 : 0;
      top = originY === 'center' ? canvasHeight - (objectHeight / 2) : canvasHeight - objectHeight;
      break;
    case 'bottom-right':
      left = originX === 'center' ? canvasWidth - (objectWidth / 2) : canvasWidth - objectWidth;
      top = originY === 'center' ? canvasHeight - (objectHeight / 2) : canvasHeight - objectHeight;
      break;
  }
  
  return { left, top };
};

/**
 * Standard error response format
 */
export const createErrorResponse = (message: string): ToolExecutionResult => {
  return {
    success: false,
    error: message,
    data: {}
  };
};

/**
 * Standard success response format
 */
export const createSuccessResponse = (
  data: Record<string, any>, 
  changedObjects: string[] = []
): ToolExecutionResult => {
  return {
    success: true,
    data,
    metadata: {
      executionTime: Date.now(),
      changedObjects
    }
  };
};
