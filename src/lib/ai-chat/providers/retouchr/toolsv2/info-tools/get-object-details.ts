"use client";

import { FabricCanvas, FabricTextObject, ToolExecutionResult } from '../types/shared-types';
import { createSuccessResponse } from '../utils/object-helper';
import { findObjectById, isTextObject } from '../utils/object-helper';
import { mapFromFabricProperties } from '../utils/fabric-compatibility';

/**
 * Get detailed information about a specific object
 * 
 * This tool returns comprehensive details about an object, including all
 * available properties. For text objects, it includes advanced properties
 * like textShadow, textGradient, etc.
 */
export const getObjectDetails = async (
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

    // Get basic object properties
    const baseProperties = {
      id: object.id || '',
      type: object.type || 'unknown',
      left: object.left || 0,
      top: object.top || 0,
      width: object.width || 0,
      height: object.height || 0,
      scaleX: object.scaleX || 1,
      scaleY: object.scaleY || 1,
      angle: object.angle || 0,
      originX: object.originX || 'left',
      originY: object.originY || 'top',
      visible: object.visible !== false,
    };
    
    // Add additional properties based on object type
    let detailedProperties: Record<string, any> = { ...baseProperties };
    
    // For text objects, include all text-specific properties
    if (isTextObject(object)) {
      const textObj = object as FabricTextObject;
      
      // Basic text properties
      detailedProperties = {
        ...detailedProperties,
        text: textObj.text || '',
        fontSize: textObj.fontSize || 20,
        fontFamily: textObj.fontFamily || 'Arial',
        fontWeight: textObj.fontWeight || 'normal',
        fontStyle: textObj.fontStyle || 'normal',
        fill: textObj.fill || '#000000',
        textAlign: textObj.textAlign || 'left',
        lineHeight: textObj.lineHeight || 1.16,
      };
      
      // Advanced text properties
      if (textObj.padding !== undefined) {
        detailedProperties.padding = textObj.padding;
      }
      
      if (textObj.borderRadius !== undefined) {
        detailedProperties.borderRadius = textObj.borderRadius;
      }
      
      if (textObj.textBackgroundColor) {
        detailedProperties.backgroundColor = textObj.textBackgroundColor;
      }
      
      if (textObj.charSpacing !== undefined) {
        detailedProperties.letterSpacing = textObj.charSpacing;
      }
      
      if (textObj.textTransform) {
        detailedProperties.textTransform = textObj.textTransform;
      }
      
      // Advanced effect properties
      if (textObj.textShadow) {
        detailedProperties.textShadow = textObj.textShadow;
      }
      
      if (textObj.textOutline) {
        detailedProperties.textOutline = textObj.textOutline;
      }
      
      if (textObj.textGradient) {
        detailedProperties.textGradient = textObj.textGradient;
      }
    } else {
      // For non-text objects, use generic property mapping
      detailedProperties = mapFromFabricProperties(object);
    }
    
    return createSuccessResponse({
      objectDetails: detailedProperties
    });
  } catch (error) {
    console.error('Error getting object details:', error);
    return {
      success: false,
      error: `Error getting object details: ${error instanceof Error ? error.message : String(error)}`,
      data: {}
    };
  }
};
