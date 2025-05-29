"use client";

import { FabricCanvas, ToolExecutionResult } from '../types/shared-types';
import { getTextClass, mapToFabricProperties, refreshTextObject, triggerLayerUpdate } from '../utils/fabric-compatibility';

/**
 * Add a new text object to the canvas
 * 
 * This tool creates a new text object with the specified content, position,
 * font size, and color. It supports enhanced text features when available.
 */
export const addText = async (
  canvas: FabricCanvas,
  text: string,
  x: number,
  y: number,
  fontSize: number,
  color: string,
  additionalProperties?: Record<string, any>
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

    if (text === undefined || text === null) {
      return {
        success: false,
        error: 'Text content is required',
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

    if (fontSize === undefined || fontSize === null || isNaN(fontSize) || fontSize <= 0) {
      return {
        success: false,
        error: 'Valid fontSize is required (must be greater than 0)',
        data: {}
      };
    }

    if (!color) {
      return {
        success: false,
        error: 'Color is required',
        data: {}
      };
    }

    // Prepare properties, mapping any alias properties to fabric properties
    const baseProps = {
      left: x,
      top: y,
      fontSize: fontSize,
      fill: color, // fill is used by fabric.js instead of color
      selectable: true,
      editable: true,
    };

    // Merge with additional properties if provided
    const allProps = additionalProperties 
      ? { ...baseProps, ...mapToFabricProperties(additionalProperties) }
      : baseProps;

    // Try to use enhanced text if available
    const TextClass = getTextClass(canvas);
    
    // Create the text object
    let textObject;
    
    if (TextClass) {
      // Use the appropriate text class
      textObject = new TextClass(text, allProps);
    } else {
      // Fallback to standard Fabric.js IText
      if (typeof window !== 'undefined' && (window as any).fabric) {
        textObject = new (window as any).fabric.IText(text, allProps);
      } else {
        return {
          success: false,
          error: 'Could not create text object - fabric.js not available',
          data: {}
        };
      }
    }

    // Generate a unique ID for the object if it doesn't have one
    if (!textObject.id) {
      textObject.id = `text_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    }

    // Add the object to the canvas
    canvas.add(textObject);
    
    // Set as the active object
    canvas.setActiveObject(textObject);
    
    // Refresh the object for proper rendering
    refreshTextObject(textObject);
    
    // Update layer system
    triggerLayerUpdate(canvas, textObject);
    
    // Render the canvas
    canvas.renderAll();

    return {
      success: true,
      data: {
        message: 'Text added successfully',
        objectId: textObject.id,
        left: textObject.left,
        top: textObject.top
      }
    };
  } catch (error) {
    console.error('Error adding text:', error);
    return {
      success: false,
      error: `Error adding text: ${error instanceof Error ? error.message : String(error)}`,
      data: {}
    };
  }
};
