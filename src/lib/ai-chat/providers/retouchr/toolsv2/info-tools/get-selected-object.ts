"use client";

import { FabricCanvas, ToolExecutionResult } from '../types/shared-types';
import { mapFromFabricProperties } from '../utils/fabric-compatibility';

/**
 * Get details about the currently selected object(s) on the canvas
 * 
 * This function properly extracts and returns information about the selected object,
 * including special handling for enhanced-text and advanced-text objects.
 */
export const getSelectedObject = async (
  canvas: FabricCanvas,
  includeProperties: boolean = false
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

    // Get the active object from the canvas
    const activeObject = canvas.getActiveObject();
    
    if (!activeObject) {
      return {
        success: true,
        data: {
          selectedObject: null,
          message: 'No object currently selected on canvas'
        }
      };
    }

    // Check if it's a selection group
    if (activeObject.type === 'activeSelection') {
      // Get the objects in the selection
      const objects = (activeObject as any).getObjects();
      
      if (!objects || objects.length === 0) {
        return {
          success: true,
          data: {
            selectedObject: null,
            message: 'Empty selection group selected'
          }
        };
      }
      
      // Map objects to simplified structures
      const selectionObjects = objects.map((obj: any) => {
        // Basic properties
        const basicProps = {
          id: obj.id || '',
          type: obj.type || 'object',
          left: obj.left || 0,
          top: obj.top || 0,
          width: obj.width || 0,
          height: obj.height || 0,
        };
        
        // If detailed properties are requested
        if (includeProperties) {
          return mapFromFabricProperties(obj);
        }
        
        return basicProps;
      });
      
      return {
        success: true,
        data: {
          isMultipleSelection: true,
          selectedObjects: selectionObjects,
          message: `Multiple objects selected (${selectionObjects.length})`
        }
      };
    }
    
    // Single object selected
    const object = activeObject;
    
    // Extract object ID with enhanced handling for all object types
    let objectId = '';
    
    // Try different ways to access the ID based on object type
    if (object._id) {
      // Some custom objects store ID in _id
      objectId = object._id;
    } else if (object.get && typeof object.get === 'function') {
      // Try using the get method if available
      try {
        const id = object.get('id');
        if (id) objectId = id;
      } catch (e) {
        // Ignore get() errors
      }
    } else if (object.id) {
      // Standard ID property
      objectId = object.id;
    } else if (object.name) {
      // Fallback to name as ID
      objectId = object.name;
    }
    
    // If we still don't have an ID, generate one and assign it to the object
    // This ensures all objects have IDs for future operations
    if (!objectId) {
      objectId = `obj_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      // Assign the generated ID to the object
      object.id = objectId;
    }
    
    // Get text content for text objects to help identify them
    let textContent = '';
    if ((object.type === 'advanced-text' || object.type === 'enhanced-text' || 
         object.type === 'i-text' || object.type === 'text') && object.text) {
      textContent = object.text.substring(0, 20) + (object.text.length > 20 ? '...' : '');
    }
    
    // Handle advanced text properties if present
    const advancedTextProps: Record<string, any> = {};
    if (object.type === 'advanced-text' || object.textShadow || object.textOutline || object.textGradient) {
      if (object.textShadow) advancedTextProps.textShadow = object.textShadow;
      if (object.textOutline) advancedTextProps.textOutline = object.textOutline;
      if (object.textGradient) advancedTextProps.textGradient = object.textGradient;
    }
    
    // Handle enhanced text properties
    const enhancedTextProps: Record<string, any> = {};
    if (object.type === 'enhanced-text' || object.padding !== undefined || object.borderRadius !== undefined) {
      if (object.padding !== undefined) enhancedTextProps.padding = object.padding;
      if (object.borderRadius !== undefined) enhancedTextProps.borderRadius = object.borderRadius;
    }
    
    // Basic properties for any return
    const basicProps = {
      id: objectId,
      type: object.type || 'object',
      left: object.left || 0,
      top: object.top || 0,
      width: object.width || 0,
      height: object.height || 0,
      scaleX: object.scaleX || 1,
      scaleY: object.scaleY || 1,
      angle: object.angle || 0,
      originX: object.originX || 'left',
      originY: object.originY || 'top',
      text: textContent || undefined,
      ...advancedTextProps,
      ...enhancedTextProps
    };
    
    // If detailed properties are requested
    const selectedObject = includeProperties 
      ? mapFromFabricProperties(object)
      : basicProps;
    
    return {
      success: true,
      data: {
        isMultipleSelection: false,
        selectedObject: selectedObject,
        message: `Selected object: ${object.type || 'object'}${textContent ? ` "${textContent}"` : ''} (ID: ${objectId})`
      }
    };
  } catch (error) {
    console.error('Error getting selected object:', error);
    return {
      success: false,
      error: `Error getting selected object: ${error instanceof Error ? error.message : String(error)}`,
      data: {
        selectedObject: null
      }
    };
  }
};
