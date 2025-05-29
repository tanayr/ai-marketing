// text-tools-add.ts

import { ToolDefinition, ToolExecutionResult } from '../../../types/providers';
import { nanoid } from 'nanoid';
import { ITextOptions, FabricCanvas, FabricTextObject, TextToolResult } from './text-tools-types';

// Declaration for the global fabric object if it's not imported
// This helps TypeScript understand that 'fabric' might exist globally.
declare const fabric: any;

export const addTextTool: ToolDefinition = {
  name: 'add_text',
  description: 'Add new text object to the canvas at specified position with formatting options. This is the primary tool for adding text content.',
  category: 'text',
  inputSchema: {
    type: 'object',
    properties: {
      text: {
        type: 'string',
        description: 'The text content to add'
      },
      x: {
        type: 'number',
        description: 'X position (left) in pixels. Default: 100'
      },
      y: {
        type: 'number',
        description: 'Y position (top) in pixels. Default: 100'
      },
      fontSize: {
        type: 'number',
        description: 'Font size in pixels. Default: 24'
      },
      fontFamily: {
        type: 'string',
        description: 'Font family name. Default: "Arial"'
      },
      color: {
        type: 'string',
        description: 'Text color in CSS format. Default: "#000000"'
      },
      fontWeight: {
        type: 'string',
        description: 'Font weight (normal, bold). Default: "normal"'
      },
      fontStyle: {
        type: 'string',
        description: 'Font style (normal, italic). Default: "normal"'
      },
      textAlign: {
        type: 'string',
        description: 'Text alignment (left, center, right). Default: "left"'
      }
    },
    required: ['text']
  },
  examples: [
    {
      description: 'Add a simple heading',
      input: {
        text: 'Welcome to Our Store',
        x: 200,
        y: 50,
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333333'
      },
      context: 'User wants to add a prominent heading'
    },
    {
      description: 'Add body text',
      input: {
        text: 'This is some descriptive text',
        x: 100,
        y: 200,
        fontSize: 16,
        fontFamily: 'Georgia'
      },
      context: 'Adding content text to the design'
    }
  ],
  handler: async (input: any, context: { canvas?: FabricCanvas, [key: string]: any }): Promise<ToolExecutionResult> => {
    try {
      const { canvas } = context;
      if (!canvas) {
        return { success: false, error: 'No canvas available' };
      }

      const {
        text,
        x,
        y,
        fontSize,
        fontFamily,
        color,
        fontWeight,
        fontStyle,
        textAlign
      } = input;

      // Get canvas dimensions for default positioning if not specified
      const canvasWidth = canvas.getWidth ? canvas.getWidth() : (canvas.width || 800);
      const canvasHeight = canvas.getHeight ? canvas.getHeight() : (canvas.height || 600);
      
      // Generate a unique ID in a format compatible with the layer system
      const objectId = `layer-${Date.now()}-${nanoid(6)}`;
      
      // Prepare text properties using our unified ITextOptions
      const textProps: ITextOptions = {
        id: objectId,
        left: x !== undefined ? x : canvasWidth / 2,
        top: y !== undefined ? y : canvasHeight / 2,
        fontSize: fontSize || 24,
        fontFamily: fontFamily || 'Arial',
        fill: color || '#000000',
        fontWeight: fontWeight || 'normal',
        fontStyle: fontStyle || 'normal',
        textAlign: textAlign || 'left',
        originX: 'center', // Defaulting to center for easier positioning
        originY: 'center', // Defaulting to center for easier positioning
        name: text.length > 20 ? `${text.substring(0, 20)}...` : text
      };
      
      try {
        let createdText: FabricTextObject | null = null;
        
        // Access fabric from window if available, or from global scope
        const fabricGlobal = (typeof window !== 'undefined' && (window as any).fabric) 
          ? (window as any).fabric 
          : (typeof fabric !== 'undefined' ? fabric : null);

        // Simplified approach: Only use IText
        if (fabricGlobal?.IText) {
          createdText = new fabricGlobal.IText(text, textProps);
        } 
        // Try from canvas context if global fabric isn't available
        else if (canvas.IText) {
          createdText = new canvas.IText(text, textProps);
        } 
        else {
          return {
            success: false,
            error: 'Fabric.js IText class not found. Cannot create text object.'
          };
        }
        
        if (!createdText) {
          return {
            success: false,
            error: 'Failed to instantiate text object.'
          };
        }

        // Add to canvas and render
        canvas.add(createdText);
        
        // Ensure object:added event is fired for layer system integration
        if (canvas.fire) {
          canvas.fire('object:added', { target: createdText });
        }
        
        if (canvas.setActiveObject) {
          canvas.setActiveObject(createdText);
        }
        canvas.renderAll();
        
        // Return the successfully created text object ID
        return {
          success: true,
          data: {
            objectId: objectId,
            text,
            position: { x: textProps.left, y: textProps.top },
            message: `Added text: "${text}"`
          },
          metadata: {
            executionTime: Date.now(),
            changedObjects: [objectId]
          }
        };
      } catch (textError: any) {
        console.error('Error creating text object:', textError);
        return {
          success: false,
          error: `Failed to add text: ${textError instanceof Error ? textError.message : String(textError)}`
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to add text: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
};
