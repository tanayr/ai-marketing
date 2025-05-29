"use client";

import { FabricCanvas, ToolExecutionResult } from '../types/shared-types';
import { findObjectById } from '../utils/object-helper';

/**
 * Delete an object from the canvas by ID
 * 
 * This tool permanently removes an object from the canvas.
 * It also updates the layer system to reflect the deletion.
 */
export const deleteObject = async (
  canvas: FabricCanvas,
  objectId: string
): Promise<ToolExecutionResult> => {
  try {
    // Validate inputs
    if (!canvas) {
      return {
        success: false,
        error: 'Canvas is not available',
        data: {}
      };
    }

    if (!objectId) {
      return {
        success: false,
        error: 'Object ID is required',
        data: {}
      };
    }

    // Find the object by ID
    const object = findObjectById(canvas, objectId);
    if (!object) {
      return {
        success: false,
        error: `Object with ID ${objectId} not found`,
        data: {}
      };
    }

    // Capture object type for the response message
    const objectType = object.type || 'object';

    // Remove the object from the canvas
    canvas.remove(object);
    
    // Notify the layer system about the removal
    if (canvas.fire) {
      canvas.fire('object:removed', { target: object });
    }
    
    // Render the canvas
    canvas.renderAll();

    return {
      success: true,
      data: {
        message: `Successfully deleted ${objectType} with ID ${objectId}`,
        deletedObjectId: objectId
      }
    };
  } catch (error) {
    console.error('Error deleting object:', error);
    return {
      success: false,
      error: `Error deleting object: ${error instanceof Error ? error.message : String(error)}`,
      data: {}
    };
  }
};
