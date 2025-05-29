"use client";

import { FabricCanvas, ToolExecutionResult } from '../types/shared-types';
import { findObjectById, validateObjectType } from '../utils/object-helper';
import { getTextClass, isAdvancedText, refreshTextObject, triggerLayerUpdate } from '../utils/fabric-compatibility';

interface PresetStyle {
  name: string;
  description: string;
  properties: Record<string, any>;
  advancedProperties?: Record<string, any>;
}

// Preset styles collection
const presetStyles: Record<string, PresetStyle> = {
  'heading1': {
    name: 'Heading 1',
    description: 'Large bold heading for main titles',
    properties: {
      fontSize: 42,
      fontWeight: 'bold',
      fontFamily: 'Arial',
      textAlign: 'center',
      fill: '#333333',
    }
  },
  'heading2': {
    name: 'Heading 2',
    description: 'Medium sized heading for sections',
    properties: {
      fontSize: 32,
      fontWeight: 'bold',
      fontFamily: 'Arial',
      textAlign: 'left',
      fill: '#333333',
    }
  },
  'body': {
    name: 'Body Text',
    description: 'Standard body text for content',
    properties: {
      fontSize: 18,
      fontWeight: 'normal',
      fontFamily: 'Arial',
      textAlign: 'left',
      fill: '#333333',
      lineHeight: 1.2,
    }
  },
  'quote': {
    name: 'Quote',
    description: 'Stylized text for quotes',
    properties: {
      fontSize: 24,
      fontStyle: 'italic',
      fontFamily: 'Georgia',
      textAlign: 'center',
      fill: '#555555',
      padding: 20,
      backgroundColor: '#f0f0f0',
      borderRadius: 10,
    }
  },
  'callout': {
    name: 'Callout',
    description: 'Eye-catching callout with background',
    properties: {
      fontSize: 20,
      fontWeight: 'bold',
      fontFamily: 'Arial',
      textAlign: 'center',
      fill: '#ffffff',
      padding: 15,
      backgroundColor: '#3498db',
      borderRadius: 5,
    }
  },
  'colorful': {
    name: 'Colorful',
    description: 'Colorful text with gradient',
    properties: {
      fontSize: 36,
      fontWeight: 'bold',
      fontFamily: 'Arial',
      textAlign: 'center',
    },
    advancedProperties: {
      textGradient: {
        type: 'linear',
        angle: 90,
        colors: ['#ff4500', '#ff8c00', '#ffd700']
      }
    }
  },
  'shadow': {
    name: 'Shadow',
    description: 'Text with drop shadow effect',
    properties: {
      fontSize: 32,
      fontWeight: 'bold',
      fontFamily: 'Arial',
      textAlign: 'center',
      fill: '#333333',
    },
    advancedProperties: {
      textShadow: {
        offsetX: 3,
        offsetY: 3,
        blur: 5,
        color: 'rgba(0,0,0,0.3)'
      }
    }
  },
  'outline': {
    name: 'Outline',
    description: 'Text with outline effect',
    properties: {
      fontSize: 36,
      fontWeight: 'bold',
      fontFamily: 'Arial',
      textAlign: 'center',
      fill: '#ffffff',
    },
    advancedProperties: {
      textOutline: {
        width: 2,
        color: '#000000'
      }
    }
  },
  'futuristic': {
    name: 'Futuristic',
    description: 'Modern tech-inspired text style',
    properties: {
      fontSize: 28,
      fontWeight: 'bold',
      fontFamily: 'Consolas, monospace',
      textAlign: 'center',
      fill: '#00ffcc',
      letterSpacing: 10,
      textTransform: 'uppercase',
      padding: 15,
      backgroundColor: '#222222',
      borderRadius: 0,
    }
  },
  'handwritten': {
    name: 'Handwritten',
    description: 'Casual handwritten style',
    properties: {
      fontSize: 32,
      fontFamily: 'Comic Sans MS, cursive',
      fontStyle: 'italic',
      textAlign: 'left',
      fill: '#3a3a3a',
      letterSpacing: 2,
      lineHeight: 1.3,
    }
  }
};

/**
 * Apply a predefined style to a text object
 */
export const applyPresetStyle = async (
  canvas: FabricCanvas,
  objectId: string,
  presetName: string
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

    // Validate that the object is a text object
    if (!validateObjectType(object, ['text', 'i-text', 'enhanced-text', 'advanced-text'])) {
      return {
        success: false,
        error: `Object with ID ${objectId} is not a text object`,
        data: {}
      };
    }

    // Check if the preset exists
    if (!presetName || !presetStyles[presetName]) {
      return {
        success: false,
        error: `Preset style "${presetName}" not found. Use list_available_presets to see available options.`,
        data: {}
      };
    }

    const preset = presetStyles[presetName];
    
    // Apply basic properties
    if (object && typeof object.set === 'function') {
      object.set(preset.properties);
    }
    
    // Handle advanced properties (if any)
    if (preset.advancedProperties) {
      // Check if we need to upgrade the text object to advanced type
      const requiresAdvanced = preset.advancedProperties.textShadow !== undefined || 
                              preset.advancedProperties.textGradient !== undefined || 
                              preset.advancedProperties.textOutline !== undefined;
      
      if (requiresAdvanced && !isAdvancedText(object)) {
        // We need to convert to AdvancedText
        const AdvancedTextClass = getTextClass(canvas, true);
        
        if (!AdvancedTextClass) {
          // Apply just the basic properties if advanced text not available
          if (object && typeof object.set === 'function') {
            object.set(preset.properties);
          }
        } else {
          // Create a new AdvancedText object with the same properties
          const textContent = object.text || (typeof object.get === 'function' ? object.get('text') : '');
          const props = {
            ...(typeof object.toObject === 'function' ? object.toObject() : {}),
            ...preset.properties,
            ...(preset.advancedProperties || {}),
          };
          
          // Create new advanced text object
          const newObject = new AdvancedTextClass(textContent, props);
          
          // Set ID to match original object
          newObject.id = object.id;
          
          // Replace on canvas
          if (canvas) {
            if (typeof canvas.remove === 'function') {
              canvas.remove(object);
            }
            if (typeof canvas.add === 'function') {
              canvas.add(newObject);
            }
            if (typeof canvas.setActiveObject === 'function') {
              canvas.setActiveObject(newObject);
            }
          }
          
          // Trigger refresh
          if (newObject) {
            refreshTextObject(newObject);
          }
          
          // Update layer system
          if (canvas && newObject) {
            triggerLayerUpdate(canvas, newObject);
          }
          
          if (canvas.renderAll) {
            canvas.renderAll();
          }
          
          return {
            success: true,
            data: {
              message: `Applied "${preset.name}" preset style to text object`,
              objectId: objectId
            }
          };
        }
      } else {
        // Object is already advanced text or doesn't need advanced properties
        if (object && typeof object.set === 'function' && preset.advancedProperties) {
          object.set(preset.advancedProperties);
        }
      }
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
        message: `Applied "${preset.name}" preset style to text object`,
        objectId: objectId
      }
    };
  } catch (error) {
    console.error('Error applying preset style:', error);
    return {
      success: false,
      error: `Error applying preset style: ${error instanceof Error ? error.message : String(error)}`,
      data: {}
    };
  }
};

/**
 * Get list of available preset names
 */
export const getPresetNames = (): string[] => {
  return Object.keys(presetStyles);
};

/**
 * Get preset details by name
 */
export const getPresetDetails = (presetName: string): PresetStyle | null => {
  return presetStyles[presetName] || null;
};

/**
 * Get all preset styles
 */
export const getAllPresets = (): Record<string, PresetStyle> => {
  return presetStyles;
};
