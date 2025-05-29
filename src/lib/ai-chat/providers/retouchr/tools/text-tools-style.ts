// text-tools-style.ts

import { ToolDefinition, ToolExecutionResult } from '../../../types/providers';
import { FabricCanvas, FabricTextObject, FabricObject, TextToolResult } from './text-tools-types';

export const styleTextTool: ToolDefinition = {
  name: 'style_text',
  description: 'Style and format text objects with properties like font, size, color, weight, alignment, shadows, and rotation. This tool modifies the visual appearance of existing text objects on the canvas. It allows precise control over text styling including fonts, colors, sizes, weights, shadows, and rotational angles. Use this tool whenever a user wants to change how text looks, such as making text bold, changing its color, adding shadows, or adjusting its size. This is the ONLY tool for modifying text appearance - do not use "update_text_properties", "format_text", or similar variations. Always use the EXACT name: style_text. Note: This tool does not change the actual text content - use update_text_content for that purpose.',
  category: 'text',
  inputSchema: {
    type: 'object',
    properties: {
      objectId: {
        type: 'string',
        description: 'ID of text object to style. Optional if text is selected.'
      },
      fontSize: {
        type: 'number',
        description: 'Font size in pixels'
      },
      fontFamily: {
        type: 'string',
        description: 'Font family name'
      },
      color: {
        type: 'string',
        description: 'Text color in CSS format (e.g., "#FF0000", "red")'
      },
      fontWeight: {
        type: 'string',
        description: 'Font weight (normal, bold, 100-900)'
      },
      fontStyle: {
        type: 'string',
        description: 'Font style (normal, italic)'
      },
      textAlign: {
        type: 'string',
        description: 'Text alignment (left, center, right, justify)'
      },
      underline: {
        type: 'boolean',
        description: 'Add underline decoration'
      },
      linethrough: {
        type: 'boolean',
        description: 'Add strikethrough decoration'
      },
      // Text effect properties
      shadow: {
        type: 'object',
        description: 'Shadow effect for text (color, blur, offsetX, offsetY)'
      },
      stroke: {
        type: 'string',
        description: 'Stroke/outline color for text'
      },
      strokeWidth: {
        type: 'number',
        description: 'Width of the stroke/outline'
      },
      angle: {
        type: 'number',
        description: 'Rotation angle in degrees'
      }
    },
    required: [] // No properties are strictly required, as user might want to update only one
  },
  examples: [
    {
      description: 'Make text bold and larger, and change color',
      input: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#ff0000' // This will be mapped to 'fill'
      },
      context: 'User wants to emphasize selected text'
    },
    {
      description: 'Add shadow and outline to text',
      input: {
        shadow: { color: '#000000', blur: 5, offsetX: 2, offsetY: 2 },
        stroke: '#0000FF',
        strokeWidth: 1
      },
      context: 'Adding effects to make text stand out'
    }
  ],
  handler: async (input: any, context: { canvas?: FabricCanvas, selectedObjects?: FabricObject[], [key: string]: any }): Promise<ToolExecutionResult> => {
    try {
      const { canvas, selectedObjects } = context;
      // Exclude objectId from styles, rest are actual style properties
      const { objectId, ...styles } = input;

      if (!canvas) {
        return { success: false, error: 'No canvas available' };
      }

      let textObject: FabricTextObject | undefined;

      if (objectId) {
        textObject = canvas.getObjects().find((obj: FabricObject) => obj.id === objectId) as FabricTextObject | undefined;
      } else if (selectedObjects && selectedObjects.length > 0) {
        textObject = selectedObjects[0] as FabricTextObject; // Assuming the first selected object
      }

      if (!textObject) {
        return { success: false, error: `No text object found to style. Searched by ID: ${objectId}, Selected: ${selectedObjects?.length}` };
      }
      
      // Check if it's a text object by verifying it has a text property
      // This is a property-based check instead of type check to support any text object variant
      if (typeof textObject.text !== 'string' && !('text' in textObject)) {
        return { success: false, error: `Selected object is not a text object or has no text property.` };
      }

      const appliedStyles: any = {};

      // Apply each style that was provided
      Object.entries(styles).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          let fabricKey = key;
          let fabricValue = value;

          // Map 'color' to 'fill' for Fabric.js
          if (key === 'color') {
            fabricKey = 'fill';
          }
          // Potentially convert numeric fontWeight if schema is string but Fabric expects number
          if (key === 'fontWeight' && typeof value === 'string' && !isNaN(Number(value))) {
             fabricValue = Number(value);
          }

          if (typeof textObject.set === 'function') {
            textObject.set(fabricKey, fabricValue);
          } else {
            // Fallback for direct property assignment
            (textObject as any)[fabricKey] = fabricValue;
          }
          appliedStyles[fabricKey] = fabricValue;
        }
      });

      // Force a refresh of the object to apply effects properly
      if (textObject.setCoords) {
        textObject.setCoords();
      }
      canvas.renderAll();

      // If object has a refreshObject method (extended IText), call it to ensure proper rendering
      if (typeof (textObject as any)._refreshObject === 'function') {
        setTimeout(() => {
          (textObject as any)._refreshObject();
        }, 10);
      }

      return {
        success: true,
        data: {
          objectId: textObject.id,
          // Return the styles as passed in, not the fabricKey versions for clarity to user
          changedProperties: Object.keys(styles).filter(k => styles[k] !== undefined && styles[k] !== null),
          appliedStyles: styles // Show what was attempted to be applied
        },
        metadata: { 
          executionTime: Date.now(), 
          changedObjects: [textObject.id || 'unknown']
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to style text: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
};
