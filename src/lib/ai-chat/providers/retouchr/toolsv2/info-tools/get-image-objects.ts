"use client";

import { FabricCanvas, FabricObject, ToolExecutionResult } from '../types/shared-types';
import { mapFromFabricProperties } from '../utils/fabric-compatibility';

/**
 * Get all image objects from the canvas
 * 
 * This tool returns a list of all image objects on the canvas
 * with their essential properties.
 */
export const getImageObjects = async (
  canvas: FabricCanvas,
  includeProperties: boolean = false
): Promise<ToolExecutionResult> => {
  try {
    // Validate inputs
    if (!canvas) {
      return {
        success: false,
        message: 'Canvas is not available',
      };
    }

    // Get all objects from the canvas
    const allObjects = canvas.getObjects();
    if (!allObjects || allObjects.length === 0) {
      return {
        success: true,
        message: 'No objects found on canvas',
        images: [],
      };
    }

    // Filter for image objects only
    const imageObjects = allObjects.filter(obj => 
      obj.type === 'image' || 
      obj.type === 'photo' || 
      (obj.isType && obj.isType('image'))
    );

    if (!imageObjects || imageObjects.length === 0) {
      return {
        success: true,
        message: 'No image objects found on canvas',
        images: [],
      };
    }

    // Map image objects to simplified structures
    const images = imageObjects.map((obj: FabricObject) => {
      // Basic properties for any return
      const basicProps = {
        id: obj.id || '',
        type: obj.type || 'image',
        left: obj.left || 0,
        top: obj.top || 0,
        width: obj.width || 0,
        height: obj.height || 0,
        scaleX: obj.scaleX || 1,
        scaleY: obj.scaleY || 1,
        angle: obj.angle || 0,
        originX: obj.originX || 'left',
        originY: obj.originY || 'top',
        visible: obj.visible !== false, // Default to true if undefined
      };

      // If detailed properties are requested
      if (includeProperties) {
        return mapFromFabricProperties(obj);
      }
      
      return basicProps;
    });

    return {
      success: true,
      message: `Found ${images.length} image objects on canvas`,
      images: images,
    };
  } catch (error) {
    console.error('Error getting image objects:', error);
    return {
      success: false,
      message: `Error getting image objects: ${error instanceof Error ? error.message : String(error)}`,
      images: [],
    };
  }
};
