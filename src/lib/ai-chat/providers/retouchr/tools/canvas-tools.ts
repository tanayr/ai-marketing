/**
 * Canvas manipulation tools for Retouchr
 * Background, size, clearing, saving
 */

import { ToolDefinition, ToolExecutionResult } from '../../../types/providers';

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
  backgroundColor?: string;
  [key: string]: any;
}

// Fabric.js object type
interface FabricObject {
  id?: string;
  type?: string;
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  [key: string]: any;
}

export const canvasTools: ToolDefinition[] = [
  {
    name: 'get_canvas_state',
    description: 'Get complete canvas state including all objects, layers, dimensions, and background. Essential for understanding current design state before making changes.',
    category: 'canvas',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    },
    examples: [
      {
        description: 'Get current canvas state to understand what objects exist',
        input: {},
        context: 'User asks "what\'s on the canvas?" or before making any changes'
      }
    ],
    handler: async (input: Record<string, any>, context: any): Promise<ToolExecutionResult> => {
      try {
        const { canvas } = context;
        if (!canvas) {
          return { success: false, error: 'No canvas available' };
        }

        const canvasData = canvas.toJSON(['id', 'name', 'selectable', 'evented']);
        const objects = canvas.getObjects();
        
        const state = {
          dimensions: {
            width: canvas.getWidth(),
            height: canvas.getHeight()
          },
          background: canvas.backgroundColor,
          objectCount: objects.length,
          objects: objects.map((obj: FabricObject) => ({
            id: obj.id,
            type: obj.type,
            left: obj.left,
            top: obj.top,
            width: obj.width,
            height: obj.height,
            angle: obj.angle,
            visible: obj.visible,
            name: obj.name || `${obj.type}-object`,
            // Type-specific properties
            ...(obj.type === 'text' || obj.type === 'i-text' || obj.type === 'enhanced-text' 
              ? { 
                  text: (obj as any).text,
                  fontSize: (obj as any).fontSize,
                  fontFamily: (obj as any).fontFamily,
                  fill: (obj as any).fill
                }
              : {}),
            ...(obj.type === 'image' 
              ? { 
                  src: (obj as any).getSrc?.() || 'unknown'
                }
              : {})
          })),
          fullCanvasJSON: canvasData
        };

        return {
          success: true,
          data: state,
          metadata: {
            executionTime: Date.now(),
            changedObjects: []
          }
        };
      } catch (error) {
        return {
          success: false,
          error: `Failed to get canvas state: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
    }
  },

  {
    name: 'set_canvas_background',
    description: 'Set the canvas background color using the set_canvas_background tool. This tool changes the entire canvas background to the specified color. It accepts any valid CSS color format including hex codes (#ff0000), RGB values (rgb(255,0,0)), or color names (red). Use this tool when users want to change the background color of their design. This is the ONLY tool for changing background colors - do not use "set_background" or similar variations. Always use the EXACT name: set_canvas_background.',
    category: 'canvas',
    inputSchema: {
      type: 'object',
      properties: {
        color: {
          type: 'string',
          description: 'CSS color value (e.g., "#ff0000", "red", "rgb(255,0,0)")'
        }
      },
      required: ['color']
    },
    examples: [
      {
        description: 'Change background to red',
        input: { color: '#ff0000' },
        context: 'User says "make the background red"'
      },
      {
        description: 'Set transparent background',
        input: { color: 'transparent' },
        context: 'User wants to remove background'
      }
    ],
    handler: async (input: Record<string, any>, context: any): Promise<ToolExecutionResult> => {
      try {
        const { canvas } = context;
        const { color } = input;

        if (!canvas) {
          return { success: false, error: 'No canvas available' };
        }

        // Set background color safely with error handling
        try {
          // The callback function may not be properly handled in all canvas contexts
          // So we'll set the color directly and then render
          canvas.backgroundColor = color;
          canvas.renderAll();
        } catch (innerError) {
          console.error('Background color render error:', innerError);
          // Even if rendering fails, background may still be set correctly
        }

        return {
          success: true,
          data: { 
            newBackground: color,
            message: `Background changed to ${color}`
          },
          metadata: {
            executionTime: Date.now(),
            changedObjects: ['canvas-background']
          }
        };
      } catch (error) {
        return {
          success: false,
          error: `Failed to set background: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
    }
  },

  {
    name: 'get_canvas_dimensions',
    description: 'Get canvas width and height dimensions in pixels.',
    category: 'canvas',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    },
    handler: async (input: Record<string, any>, context: any): Promise<ToolExecutionResult> => {
      try {
        const { canvas } = context;
        if (!canvas) {
          return { success: false, error: 'No canvas available' };
        }

        return {
          success: true,
          data: {
            width: canvas.getWidth(),
            height: canvas.getHeight(),
            aspectRatio: (canvas.getWidth() / canvas.getHeight()).toFixed(2)
          }
        };
      } catch (error) {
        return {
          success: false,
          error: `Failed to get dimensions: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
    }
  },

  {
    name: 'clear_canvas',
    description: 'Remove all objects from the canvas, leaving only the background. Use with caution as this cannot be undone.',
    category: 'canvas',
    inputSchema: {
      type: 'object',
      properties: {
        confirm: {
          type: 'boolean',
          description: 'Must be true to confirm the destructive action'
        }
      },
      required: ['confirm']
    },
    examples: [
      {
        description: 'Clear all objects from canvas',
        input: { confirm: true },
        context: 'User wants to start fresh or remove everything'
      }
    ],
    handler: async (input: Record<string, any>, context: any): Promise<ToolExecutionResult> => {
      try {
        const { canvas } = context;
        const { confirm } = input;

        if (!canvas) {
          return { success: false, error: 'No canvas available' };
        }

        if (!confirm) {
          return { success: false, error: 'Must confirm to clear canvas' };
        }

        const objectCount = canvas.getObjects().length;
        canvas.clear();
        canvas.renderAll();

        return {
          success: true,
          data: {
            message: `Cleared ${objectCount} objects from canvas`,
            removedObjects: objectCount
          },
          metadata: {
            executionTime: Date.now(),
            changedObjects: ['all-objects-removed']
          }
        };
      } catch (error) {
        return {
          success: false,
          error: `Failed to clear canvas: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
    }
  }
];
