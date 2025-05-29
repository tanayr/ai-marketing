"use client";

import { FabricCanvas, ToolExecutionResult } from '../types/shared-types';
import { findObjectById } from '../utils/object-helper';
import { refreshTextObject, triggerLayerUpdate } from '../utils/fabric-compatibility';

/**
 * Move an object to a new position on the canvas
 * 
 * This tool moves an object to the specified coordinates, accounting for
 * the object's origin (originX and originY) for precise positioning.
 * For example, if originX is 'center', the x coordinate refers to the center
 * of the object, not its left edge.
 */
export const moveObject = async (
  canvas: FabricCanvas,
  objectId: string,
  x: number,
  y: number,
  respectAlignment: boolean = true
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

    if (x === undefined || x === null || isNaN(x)) {
      return {
        success: false,
        error: 'Valid X coordinate is required',
        data: {}
      };
    }

    if (y === undefined || y === null || isNaN(y)) {
      return {
        success: false,
        error: 'Valid Y coordinate is required',
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

    // Get current origin settings (default to 'left' and 'top' if not specified)
    const originX = object.originX || 'left';
    const originY = object.originY || 'top';
    
    // If respectAlignment is true, we need to adjust the coordinates
    // based on the object's origin settings
    if (respectAlignment) {
      let adjustedX = x;
      let adjustedY = y;
      
      // Adjust X based on originX
      if (originX === 'center') {
        // No adjustment needed - x is already the center
      } else if (originX === 'right') {
        // Convert right-aligned x to left-aligned x
        adjustedX = x - (object.width || 0) * (object.scaleX || 1);
      }
      
      // Adjust Y based on originY
      if (originY === 'center') {
        // No adjustment needed - y is already the center
      } else if (originY === 'bottom') {
        // Convert bottom-aligned y to top-aligned y
        adjustedY = y - (object.height || 0) * (object.scaleY || 1);
      }
      
      // Set the new position
      if (typeof object.set === 'function') {
        object.set({
          left: adjustedX,
          top: adjustedY
        });
      }
    } else {
      // Simply set the coordinates without adjustment
      if (typeof object.set === 'function') {
        object.set({
          left: x,
          top: y
        });
      }
    }
    
    // Update object coordinates
    if (object && typeof object.setCoords === 'function') {
      object.setCoords();
    }
    
    // For text objects, make sure they render correctly
    if (object && object.type && typeof object.type.includes === 'function' && object.type.includes('text')) {
      refreshTextObject(object);
    }
    
    // Update layer system
    if (canvas && object) {
      triggerLayerUpdate(canvas, object);
    }
    
    // Render the canvas
    if (canvas && typeof canvas.renderAll === 'function') {
      canvas.renderAll();
    }

    return {
      success: true,
      data: {
        message: 'Object moved successfully',
        objectId: objectId,
        newPosition: {
          x: object.left,
          y: object.top,
          originX: object.originX,
          originY: object.originY
        }
      }
    };
  } catch (error) {
    console.error('Error moving object:', error);
    return {
      success: false,
      error: `Error moving object: ${error instanceof Error ? error.message : String(error)}`,
      data: {}
    };
  }
};
