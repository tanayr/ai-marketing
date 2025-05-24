/**
 * Text manipulation tools for Retouchr
 * Direct text manipulation with fabric.js
 */

import { ToolDefinition, ToolExecutionResult } from '../../../types/providers';
import { nanoid } from 'nanoid';

// Type definitions for enhanced text functionality
// Using inline interfaces to avoid import path issues
interface EnhancedTextOptions {
  left?: number;
  top?: number;
  fontSize?: number;
  fontFamily?: string;
  fill?: string;
  fontWeight?: string;
  fontStyle?: string;
  textAlign?: string;
  originX?: string;
  originY?: string;
  padding?: number;
  borderRadius?: number;
  name?: string;
  [key: string]: any;
}

// Fabric.js types for our context (runtime objects will be provided by canvas context)
interface FabricCanvas {
  getObjects(): any[];
  add(obj: any): void;
  remove(obj: any): void;
  renderAll(): void;
  setBackgroundColor(color: string, callback?: () => void): void;
  clear(): void;
  toDataURL(options?: any): string;
  setDimensions(dimensions: { width: number; height: number }): void;
  getWidth(): number;
  getHeight(): number;
}

interface FabricTextObject {
  id?: string;
  type?: string;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fill?: string;
  fontWeight?: string | number;
  fontStyle?: string;
  textAlign?: string;
  underline?: boolean;
  left?: number;
  top?: number;
  set?(property: string, value: any): void;
  set?(properties: any): void;
  [key: string]: any;
}

interface FabricObject {
  id?: string;
  type?: string;
  left?: number;
  top?: number;
  [key: string]: any;
}

export const textTools: ToolDefinition[] = [
  {
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
    handler: async (input, context): Promise<ToolExecutionResult> => {
      try {
        const { canvas } = context;
        if (!canvas) {
          return { success: false, error: 'No canvas available' };
        }

        const {
          text,
          x = 100,
          y = 100,
          fontSize = 24,
          fontFamily = 'Arial',
          color = '#000000',
          fontWeight = 'normal',
          fontStyle = 'normal',
          textAlign = 'left'
        } = input;

        // Create proper fabric.js text object using the IText class
        // Get canvas dimensions for default positioning if not specified
        const canvasWidth = canvas.width || 800;
        const canvasHeight = canvas.height || 600;
        
        // Prepare common text properties
        const textProps: EnhancedTextOptions = {
          left: x || canvasWidth / 2,
          top: y || canvasHeight / 2,
          fontSize: fontSize || 24,
          fontFamily: fontFamily || 'Arial',
          fill: color || '#000000',
          fontWeight: fontWeight || 'normal',
          fontStyle: fontStyle || 'normal',
          textAlign: textAlign || 'left',
          originX: 'center',
          originY: 'center',
          name: text.length > 20 ? `${text.substring(0, 20)}...` : text
        };
        
        // Generate a unique ID
        const objectId = nanoid();
        
        try {
          // Create text object - try multiple approaches based on what's available
          let createdText: any = null;
          
          // First try: Use EnhancedText from window.fabric (global) if available
          if (typeof window !== 'undefined' && (window as any).fabric?.EnhancedText) {
            const EnhancedTextClass = (window as any).fabric.EnhancedText;
            createdText = new EnhancedTextClass(text, { ...textProps, id: objectId });
          } 
          // Second try: Access it from canvas context if provided
          else if (canvas.EnhancedText || (fabric as any).EnhancedText) {
            const EnhancedTextClass = canvas.EnhancedText || (fabric as any).EnhancedText;
            createdText = new EnhancedTextClass(text, { ...textProps, id: objectId });
          }
          // Third try: Use standard IText as fallback
          else {
            createdText = new fabric.IText(text, textProps);
            // Add ID manually for standard IText
            createdText.id = objectId;
          }
          
          // Add to canvas and render
          canvas.add(createdText);
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
        } catch (textError) {
          console.error('Error creating text object:', textError);
          return {
            success: false,
            error: `Failed to add text: ${textError instanceof Error ? textError.message : String(textError)}`
          };
        }
        
        // This code is unreachable, as we've already returned in both the try and catch blocks
        // Keeping this as a fallback anyway
        return {
          success: false,
          error: 'Failed to add text: unknown error occurred'
        };
      } catch (error) {
        return {
          success: false,
          error: `Failed to add text: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
    }
  },

  {
    name: 'update_text_content',
    description: 'Change the content of an existing text object on the canvas. This tool updates the actual text content while preserving all existing styling (font, size, color, etc.). Use this tool when users want to modify what text says without changing its appearance. For example, changing "Hello" to "Hello World" or fixing a typo in existing text. This is the ONLY tool for changing text content - do not use "update_text" or "change_text". Always use the EXACT name: update_text_content. Note: This tool does not modify text styling - use style_text for appearance changes.',
    category: 'text',
    inputSchema: {
      type: 'object',
      properties: {
        objectId: {
          type: 'string',
          description: 'ID of the text object to update. Optional if text is currently selected.'
        },
        newText: {
          type: 'string',
          description: 'New text content'
        }
      },
      required: ['newText']
    },
    examples: [
      {
        description: 'Update selected text',
        input: { newText: 'Updated content' },
        context: 'User has text selected and wants to change it'
      },
      {
        description: 'Update specific text by ID',
        input: { 
          objectId: 'text_123',
          newText: 'New heading text'
        },
        context: 'Updating specific text object'
      }
    ],
    handler: async (input, context): Promise<ToolExecutionResult> => {
      try {
        const { canvas, selectedObjects } = context;
        const { objectId, newText } = input;

        if (!canvas) {
          return { success: false, error: 'No canvas available' };
        }

        let textObject: FabricTextObject | undefined;

        if (objectId) {
          // Find by ID
          textObject = canvas.getObjects().find((obj: FabricObject) => obj.id === objectId) as FabricTextObject | undefined;
        } else if (selectedObjects && selectedObjects.length > 0) {
          // Use selected object
          textObject = selectedObjects[0] as FabricTextObject;
        }

        if (!textObject) {
          return { success: false, error: 'No text object found to update' };
        }

        if (!['text', 'i-text', 'enhanced-text'].includes(textObject.type ?? '')) {
          return { success: false, error: 'Selected object is not a text object' };
        }

        const oldText = textObject.text || '';
        textObject.set?.('text', newText);
        textObject.set?.('name', newText.length > 20 ? `${newText.substring(0, 20)}...` : newText);
        
        canvas.renderAll();

        return {
          success: true,
          data: {
            objectId: textObject.id,
            oldText,
            newText,
            message: `Updated text from "${oldText}" to "${newText}"`
          },
          metadata: {
            executionTime: Date.now(),
            changedObjects: [textObject.id || 'unknown']
          }
        };
      } catch (error) {
        return {
          success: false,
          error: `Failed to update text: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
    }
  },

  {
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
          description: 'Text color in CSS format'
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
        }
      },
      required: []
    },
    examples: [
      {
        description: 'Make text bold and larger',
        input: {
          fontSize: 36,
          fontWeight: 'bold',
          color: '#ff0000'
        },
        context: 'User wants to emphasize selected text'
      },
      {
        description: 'Change font and center align',
        input: {
          fontFamily: 'Georgia',
          textAlign: 'center',
          fontStyle: 'italic'
        },
        context: 'Styling text for better design'
      }
    ],
    handler: async (input, context): Promise<ToolExecutionResult> => {
      try {
        const { canvas, selectedObjects } = context;
        const { objectId, ...styles } = input;

        if (!canvas) {
          return { success: false, error: 'No canvas available' };
        }

        let textObject: FabricTextObject | undefined;

        if (objectId) {
          textObject = canvas.getObjects().find((obj: FabricObject) => obj.id === objectId) as FabricTextObject | undefined;
        } else if (selectedObjects && selectedObjects.length > 0) {
          textObject = selectedObjects[0] as FabricTextObject;
        }

        if (!textObject) {
          return { success: false, error: 'No text object found to style' };
        }

        if (!['text', 'i-text', 'enhanced-text'].includes(textObject.type ?? '')) {
          return { success: false, error: 'Selected object is not a text object' };
        }

        const appliedStyles: any = {};

        // Apply each style that was provided
        Object.entries(styles).forEach(([key, value]) => {
          if (value !== undefined) {
            if (key === 'color') {
              textObject.set?.('fill', value);
              appliedStyles.fill = value;
            } else {
              textObject.set?.(key, value);
              appliedStyles[key] = value;
            }
          }
        });

        canvas.renderAll();

        return {
          success: true,
          data: {
            objectId: textObject.id,
            changedProperties: Object.keys(styles),
            appliedStyles: styles
          },
          metadata: { 
            executionTime: Date.now(), 
            changedObjects: [textObject.id || 'unknown']
          }
        };
      } catch (error) {
        return {
          success: false,
          error: `Failed to style text: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
    }
  },

  {
    name: 'get_text_objects',
    description: 'Get all text objects on the canvas with their properties and content. Useful for understanding existing text before making changes.',
    category: 'text',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    },
    examples: [
      {
        description: 'List all text on canvas',
        input: {},
        context: 'User asks "what text is on the canvas?" or before editing text'
      }
    ],
    handler: async (input, context): Promise<ToolExecutionResult> => {
      try {
        const { canvas } = context;
        if (!canvas) {
          return { success: false, error: 'No canvas available' };
        }

        const textObjects: FabricTextObject[] = canvas.getObjects().filter((obj: FabricObject) => 
          ['text', 'i-text', 'enhanced-text'].includes(obj.type ?? '')
        ) as FabricTextObject[];

        const textData = textObjects.map((obj: FabricTextObject) => ({
          id: obj.id || 'unknown',
          type: obj.type,
          text: obj.text || '',
          fontSize: obj.fontSize || 16,
          fontFamily: obj.fontFamily || 'Arial',
          fill: obj.fill || '#000000',
          left: obj.left || 0,
          top: obj.top || 0,
        }));

        return {
          success: true,
          data: {
            totalTextObjects: textObjects.length,
            textObjects: textData
          },
          metadata: { 
            executionTime: Date.now(), 
            changedObjects: []
          }
        };
      } catch (error) {
        return {
          success: false,
          error: `Failed to get text objects: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
    }
  }
];
