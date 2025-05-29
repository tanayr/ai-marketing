"use client";

import { FabricCanvas, ToolExecutionResult } from '../types/shared-types';
import { findObjectById } from '../utils/object-helper';

// Create standardized response objects for consistency
const createSuccessResponse = (data: Record<string, any>): ToolExecutionResult => ({
  success: true,
  data,
  metadata: {
    executionTime: Date.now(),
    changedObjects: []
  }
});

const createErrorResponse = (errorMessage: string): ToolExecutionResult => ({
  success: false,
  error: errorMessage,
  data: {},
  metadata: {
    executionTime: Date.now(),
    changedObjects: []
  }
});

/**
 * Get detailed size and position information for an object
 * 
 * This tool returns the object's dimensions (width, height, scale) and position,
 * along with the canvas dimensions to help the AI make better positioning calculations.
 */
export const getObjectSize = async (
  canvas: FabricCanvas,
  objectId: string
): Promise<ToolExecutionResult> => {
  try {
    // Validate inputs
    if (!canvas) {
      return createErrorResponse('Canvas is not available');
    }
    
    if (!objectId) {
      return createErrorResponse('Object ID is required');
    }

    // Find the object by ID
    const object = findObjectById(canvas, objectId);
    if (!object) {
      return createErrorResponse(`Object with ID ${objectId} not found`);
    }

    // Get canvas dimensions safely
    const canvasWidth = typeof canvas.getWidth === 'function' ? canvas.getWidth() : 
                       (canvas.width !== undefined ? canvas.width : 0);
    const canvasHeight = typeof canvas.getHeight === 'function' ? canvas.getHeight() : 
                        (canvas.height !== undefined ? canvas.height : 0);
    
    // Get object dimensions safely with fallbacks
    const width = object.width !== undefined ? object.width : 0;
    const height = object.height !== undefined ? object.height : 0;
    const scaleX = object.scaleX !== undefined ? object.scaleX : 1;
    const scaleY = object.scaleY !== undefined ? object.scaleY : 1;
    
    // Calculate actual dimensions after scaling
    const scaledWidth = width * scaleX;
    const scaledHeight = height * scaleY;

    return createSuccessResponse({
      message: 'Object size information retrieved',
      objectId,
      object: {
        width,
        height,
        scaleX,
        scaleY,
        scaledWidth,
        scaledHeight,
        left: object.left !== undefined ? object.left : 0,
        top: object.top !== undefined ? object.top : 0,
        originX: object.originX || 'left',
        originY: object.originY || 'top',
        angle: object.angle !== undefined ? object.angle : 0
      },
      canvas: {
        width: canvasWidth,
        height: canvasHeight
      }
    });
  } catch (error) {
    console.error('Error in getObjectSize:', error);
    return createErrorResponse(`Error getting object size: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
