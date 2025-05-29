"use client";

import { FabricCanvas, ToolExecutionResult } from '../types/shared-types';
import { findObjectById, validateObjectType } from '../utils/object-helper';
import { refreshTextObject, triggerLayerUpdate } from '../utils/fabric-compatibility';

/**
 * Update the content of an existing text object without affecting styling
 */
export const updateTextContent = async (
  canvas: FabricCanvas,
  objectId: string,
  text: string
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

    if (!text && text !== '') {
      return {
        success: false,
        error: 'Text content is required (can be empty string)',
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

    // Validate that the object is a text object
    if (!validateObjectType(object, ['text', 'i-text', 'enhanced-text', 'advanced-text'])) {
      return {
        success: false,
        error: `Object with ID ${objectId} is not a text object`,
        data: {}
      };
    }

    // Update the text content
    // We use setText when available for EnhancedText/AdvancedText, otherwise direct property update
    if (object && typeof object.setText === 'function') {
      object.setText(text);
    } else if (object && typeof object.set === 'function') {
      object.set('text', text);
    }
    
    // Refresh the object for proper rendering
    if (object) {
      refreshTextObject(object);
    }
    
    // Update layer system
    if (canvas && object) {
      triggerLayerUpdate(canvas, object);
    }
    
    // Render the canvas
    if (canvas.renderAll) {
      canvas.renderAll();
    }

    return {
      success: true,
      data: {
        message: 'Text content updated successfully',
        objectId: objectId
      }
    };
  } catch (error) {
    console.error('Error updating text content:', error);
    return {
      success: false,
      error: `Error updating text content: ${error instanceof Error ? error.message : String(error)}`,
      data: {}
    };
  }
};
