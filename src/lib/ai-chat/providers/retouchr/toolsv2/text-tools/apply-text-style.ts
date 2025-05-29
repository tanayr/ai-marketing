"use client";

import { FabricCanvas, FabricTextObject, ToolExecutionResult } from '../types/shared-types';
import { findObjectById, validateObjectType } from '../utils/object-helper';
import { getTextClass, isAdvancedText, isEnhancedText, mapToFabricProperties, refreshTextObject, triggerLayerUpdate } from '../utils/fabric-compatibility';

/**
 * Apply styles to a text object on the canvas
 * 
 * This tool allows applying a comprehensive set of text styling properties
 * including font, color, alignment, and advanced effects like shadows,
 * outlines, and gradients.
 */
/**
 * Normalize text properties to ensure consistent handling of property names and formats
 */
const normalizeTextProperties = (properties: Record<string, any>): void => {
  // Handle different names for the same property
  if (properties.color !== undefined && properties.fill === undefined) {
    properties.fill = properties.color;
  }
  
  if (properties.fill !== undefined && properties.color === undefined) {
    properties.color = properties.fill;
  }
  
  // Handle CSS gradient as fill (should have been converted in adapter, but just in case)
  if (typeof properties.fill === 'string' && properties.fill.includes('linear-gradient') && !properties.textGradient) {
    console.warn('CSS gradient detected in text styling, but not converted by adapter');
  }
  
  // Ensure textGradient has all required properties
  if (properties.textGradient) {
    if (!properties.textGradient.type) properties.textGradient.type = 'linear';
    if (!properties.textGradient.angle && properties.textGradient.angle !== 0) properties.textGradient.angle = 90;
    if (!properties.textGradient.colors || !Array.isArray(properties.textGradient.colors)) {
      console.warn('Invalid textGradient colors, must be an array');
    }
  }
};

export const applyTextStyle = async (
  canvas: FabricCanvas,
  objectId: string,
  properties: Record<string, any>
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

    if (!properties || Object.keys(properties).length === 0) {
      return {
        success: false,
        error: 'At least one styling property is required',
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

    // Convert any alias properties to fabric properties
    const fabricProperties = mapToFabricProperties(properties);
    
    // Add logging to help debug property transformations
    console.log('Original properties:', properties);
    console.log('Mapped fabric properties:', fabricProperties);
    
    // Normalize properties to ensure consistent handling
    normalizeTextProperties(fabricProperties);
    
    // Check for advanced properties that might require object conversion
    const advancedProps = {
      textShadow: fabricProperties.textShadow,
      textOutline: fabricProperties.textOutline,
      textGradient: fabricProperties.textGradient,
    };
    
    const enhancedProps = {
      padding: fabricProperties.padding,
      borderRadius: fabricProperties.borderRadius,
    };
    
    console.log('Advanced properties detected:', advancedProps);
    console.log('Enhanced properties detected:', enhancedProps);
    
    const hasAdvancedProps = Object.values(advancedProps).some(val => val !== undefined);
    const hasEnhancedProps = Object.values(enhancedProps).some(val => val !== undefined);
    
    // Check if we need to convert the object to enhanced/advanced text
    if ((hasAdvancedProps && !isAdvancedText(object)) || 
        (hasEnhancedProps && !isEnhancedText(object))) {
      // We need to convert to the appropriate text class
      const requireAdvanced = hasAdvancedProps;
      const TextClass = getTextClass(canvas, requireAdvanced);
      
      if (TextClass) {
        // Get current text content
        const textContent = (object as FabricTextObject).text || 
                          (object as any).get?.('text') || 
                          '';
        
        // Merge current properties with new properties
        const currentProps = object.toObject();
        const newProps = {
          ...currentProps,
          ...fabricProperties,
        };
        
        // Create new text object with the appropriate class
        const newObject = new TextClass(textContent, newProps);
        
        // Set ID to match original object
        newObject.id = object.id;
        
        // Replace on canvas
        canvas.remove(object);
        canvas.add(newObject);
        canvas.setActiveObject(newObject);
        
        // Refresh the object
        refreshTextObject(newObject);
        
        // Update layer system
        triggerLayerUpdate(canvas, newObject);
        
        if (canvas.renderAll) {
          canvas.renderAll();
        }
        
        return {
          success: true,
          data: {
            message: 'Text style applied successfully with object conversion',
            objectId: newObject.id,
            convertedTo: requireAdvanced ? 'advanced-text' : 'enhanced-text'
          }
        };
      }
    }
    
    // Apply properties to the existing object
    if (object && typeof object.set === 'function') {
      object.set(fabricProperties);
    }
    
    // Handle gradient separately if provided (direct application for advanced text)
    if (fabricProperties.textGradient && object.setGradient && typeof object.setGradient === 'function') {
      object.setGradient(fabricProperties.textGradient);
    }
    
    // Refresh the object
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
        message: 'Text style applied successfully',
        objectId: objectId,
        appliedProperties: Object.keys(properties)
      }
    };
  } catch (error) {
    console.error('Error applying text style:', error);
    return {
      success: false,
      error: `Error applying text style: ${error instanceof Error ? error.message : String(error)}`,
      data: {}
    };
  }
};
