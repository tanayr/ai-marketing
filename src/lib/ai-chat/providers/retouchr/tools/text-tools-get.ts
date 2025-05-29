// text-tools-get.ts

import { ToolDefinition, ToolExecutionResult } from '../../../types/providers';
import { FabricCanvas, FabricTextObject, FabricObject, TextToolResult } from './text-tools-types';

export const getTextObjectsTool: ToolDefinition = {
  name: 'get_text_objects',
  description: 'Get all text objects on the canvas with their properties and content. Useful for understanding existing text before making changes.',
  category: 'text',
  inputSchema: {
    type: 'object',
    properties: {}, // No input properties needed
    required: []
  },
  examples: [
    {
      description: 'List all text on canvas',
      input: {},
      context: 'User asks "what text is on the canvas?" or before editing text'
    }
  ],
  handler: async (input: any, context: { canvas?: FabricCanvas, [key: string]: any }): Promise<ToolExecutionResult> => {
    try {
      const { canvas } = context;
      if (!canvas) {
        return { success: false, error: 'No canvas available' };
      }

      const allObjects = canvas.getObjects();
      
      // Use property-based detection instead of type-based filtering
      // This finds any object with a 'text' property that contains a string
      const textObjects: FabricTextObject[] = allObjects.filter((obj: FabricObject) => {
        // Check if it has a text property that's a string or accessible via getter
        return (
          (typeof obj.text === 'string') || 
          // Try getter if available
          (typeof obj.get === 'function' && typeof obj.get('text') === 'string')
        );
      }) as FabricTextObject[];

      const textData = textObjects.map((obj: FabricTextObject) => {
        // Get text content using fallbacks
        const textContent = obj.text || 
                          (typeof obj.get === 'function' ? obj.get('text') : '') || 
                          '';
        
        return {
          id: obj.id || `generated-${Math.random().toString(36).substr(2, 9)}`,
          type: obj.type || 'text',
          text: textContent,
          fontSize: obj.fontSize,
          fontFamily: obj.fontFamily,
          fill: obj.fill, // Color property in Fabric.js
          fontWeight: obj.fontWeight,
          fontStyle: obj.fontStyle,
          textAlign: obj.textAlign,
          underline: obj.underline,
          linethrough: obj.linethrough,
          left: obj.left,
          top: obj.top,
          // Include text effect properties if they exist
          shadow: obj.shadow,
          stroke: obj.stroke,
          strokeWidth: obj.strokeWidth,
          angle: obj.angle,
          name: obj.name || (textContent && textContent.length > 20 ? 
                        `${textContent.substring(0, 20)}...` : 
                        textContent) || 'Unnamed Text'
        };
      });

      return {
        success: true,
        data: {
          totalTextObjects: textObjects.length,
          textObjects: textData
        },
        metadata: { 
          executionTime: Date.now(), 
          changedObjects: [] // This tool doesn't change objects
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to get text objects: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
};
