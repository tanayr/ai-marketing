"use client";

import { CanvasObjectInfo, CanvasState, FabricCanvas, FabricTextObject, ToolExecutionResult } from '../types/shared-types';
import { getIdentifyingProperty, getObjectDisplayName, isTextObject } from '../utils/object-helper';
import { createSuccessResponse } from '../utils/object-helper';

/**
 * Get current canvas state including all objects
 * 
 * This tool provides a lean list of all objects on the canvas with their
 * essential properties, suitable for understanding the current state
 * before making further changes.
 */
export const getCanvasState = async (
  canvas: FabricCanvas
): Promise<ToolExecutionResult> => {
  try {
    // Validate canvas
    if (!canvas) {
      return {
        success: false,
        error: 'Canvas is not available',
        data: {}
      };
    }

    // Get all objects from the canvas
    const objects = canvas.getObjects();
    
    // Get canvas properties
    const width = canvas.getWidth();
    const height = canvas.getHeight();
    const backgroundColor = canvas.backgroundColor || 'transparent';
    
    // Map objects to lean info objects
    const objectInfos: CanvasObjectInfo[] = objects.map(obj => {
      // Get basic object properties
      const objectInfo: CanvasObjectInfo = {
        id: obj.id || '',
        type: obj.type || 'unknown',
        name: getObjectDisplayName(obj),
        left: obj.left || 0,
        top: obj.top || 0,
        width: (obj.width || 0) * (obj.scaleX || 1),
        height: (obj.height || 0) * (obj.scaleY || 1),
        isVisible: obj.visible !== false,
        ...getIdentifyingProperty(obj)
      };
      
      // Add text snippet for text objects
      if (isTextObject(obj)) {
        const textObj = obj as FabricTextObject;
        objectInfo.text_snippet = textObj.text?.substring(0, 30) || '';
        if (textObj.text && textObj.text.length > 30) {
          objectInfo.text_snippet += '...';
        }
      }
      
      return objectInfo;
    });

    // Prepare the response data
    const canvasState: CanvasState = {
      canvas_properties: {
        width,
        height,
        background_color: backgroundColor
      },
      objects: objectInfos
    };

    // Return success response
    return createSuccessResponse({
      canvasState,
      objectCount: objects.length
    });
  } catch (error) {
    console.error('Error getting canvas state:', error);
    return {
      success: false,
      error: `Error getting canvas state: ${error instanceof Error ? error.message : String(error)}`,
      data: {}
    };
  }
};
