/**
 * Object manipulation tools for Retouchr
 * Direct object manipulation with fabric.js
 */

import { ToolDefinition, ToolExecutionResult } from '../../../types/providers';
import { nanoid } from 'nanoid';

// Fabric.js types for our context (runtime objects will be provided by canvas context)
interface FabricCanvas {
  getObjects(): any[];
  add(obj: any): void;
  remove(obj: any): void;
  renderAll(): void;
  setActiveObject(obj: any): void;
  getActiveObject(): any;
  bringToFront(obj: any): void;
  sendToBack(obj: any): void;
  clear(): void;
  toDataURL(options?: any): string;
  setDimensions(dimensions: { width: number; height: number }): void;
  getWidth(): number;
  getHeight(): number;
  discardActiveObject(): void;
  fire?(eventName: string, options: any): any; // Added for event triggering
}

// Fabric.js object type
interface FabricObject {
  id?: string;
  type?: string;
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  scaleX?: number;
  scaleY?: number;
  angle?: number;
  text?: string;
  name?: string;
  set?(property: string, value: any): void;
  set?(properties: any): void;
  clone?(callback?: (obj: any) => void): void;
  [key: string]: any;
}

export const objectTools: ToolDefinition[] = [
  {
    name: 'select_object',
    description: 'Select an object on the canvas by ID or by text content. This allows subsequent operations on the selected object.',
    category: 'objects',
    inputSchema: {
      type: 'object',
      properties: {
        objectId: {
          type: 'string',
          description: 'ID of the object to select'
        },
        searchText: {
          type: 'string',
          description: 'Text content to search for (for text objects)'
        }
      },
      required: []
    },
    examples: [
      {
        description: 'Select object by ID',
        input: { objectId: 'text_123' },
        context: 'User wants to select specific object'
      },
      {
        description: 'Select text by content',
        input: { searchText: 'Welcome' },
        context: 'User refers to text by its content'
      }
    ],
    handler: async (input: any, context: any): Promise<ToolExecutionResult> => {
      try {
        const { canvas } = context as { canvas: FabricCanvas };
        const { objectId, searchText } = input;

        if (!canvas) {
          return { success: false, error: 'No canvas available' };
        }

        let targetObject: FabricObject | undefined;

        if (objectId) {
          targetObject = canvas.getObjects().find((obj: FabricObject) => obj.id === objectId);
        } else if (searchText) {
          const objects = canvas.getObjects();
          for (const obj of objects) {
            if (obj.text && obj.text.toLowerCase().includes(searchText.toLowerCase())) {
              canvas.setActiveObject(obj);
              canvas.renderAll();

              return {
                success: true,
                data: {
                  objectId: obj.id || 'unknown',
                  type: obj.type ?? 'unknown',
                  text: obj.text,
                  position: { x: obj.left || 0, y: obj.top || 0 }
                }
              };
            }
          }
        }

        if (!targetObject) {
          return { success: false, error: 'Object not found' };
        }

        canvas.setActiveObject(targetObject);
        canvas.renderAll();

        return {
          success: true,
          data: {
            objectId: targetObject.id || 'unknown',
            type: targetObject.type,
            message: `Selected ${targetObject.type} object`
          },
          metadata: {
            executionTime: Date.now(),
            changedObjects: [targetObject.id || 'unknown']
          }
        };
      } catch (error) {
        return {
          success: false,
          error: `Failed to select object: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
    }
  },

  {
    name: 'move_object',
    description: 'Move an object to a new position. Can specify absolute coordinates or relative movement.',
    category: 'objects',
    inputSchema: {
      type: 'object',
      properties: {
        objectId: {
          type: 'string',
          description: 'ID of object to move. Optional if object is selected.'
        },
        x: {
          type: 'number',
          description: 'New X position (absolute)'
        },
        y: {
          type: 'number',
          description: 'New Y position (absolute)'
        },
        deltaX: {
          type: 'number',
          description: 'Relative X movement (+ for right, - for left)'
        },
        deltaY: {
          type: 'number',
          description: 'Relative Y movement (+ for down, - for up)'
        }
      },
      required: []
    },
    examples: [
      {
        description: 'Move to specific position',
        input: { x: 200, y: 150 },
        context: 'User wants object at exact position'
      },
      {
        description: 'Move relatively',
        input: { deltaX: 50, deltaY: -30 },
        context: 'User wants to nudge object position'
      }
    ],
    handler: async (input: any, context: any): Promise<ToolExecutionResult> => {
      try {
        const { canvas, selectedObjects } = context as { canvas: FabricCanvas; selectedObjects: FabricObject[] };
        const { objectId, x, y, deltaX, deltaY } = input;

        if (!canvas) {
          return { success: false, error: 'No canvas available' };
        }

        let targetObject: FabricObject | undefined;

        if (objectId) {
          targetObject = canvas.getObjects().find((obj: FabricObject) => obj.id === objectId);
        } else if (selectedObjects && selectedObjects.length > 0) {
          targetObject = selectedObjects[0];
        }

        if (!targetObject) {
          return { success: false, error: 'No object found to move' };
        }

        const oldPosition = { x: targetObject.left ?? 0, y: targetObject.top ?? 0 };

        // Apply movement
        if (x !== undefined) targetObject?.set?.('left', x);
        if (y !== undefined) targetObject?.set?.('top', y);
        if (deltaX !== undefined) targetObject?.set?.('left', (targetObject.left ?? 0) + deltaX);
        if (deltaY !== undefined) targetObject?.set?.('top', (targetObject.top ?? 0) + deltaY);

        targetObject?.setCoords?.();
        canvas?.renderAll?.();

        const newPosition = { x: targetObject.left ?? 0, y: targetObject.top ?? 0 };

        return {
          success: true,
          data: {
            objectId: targetObject.id || 'unknown',
            oldPosition,
            newPosition,
            message: `Moved ${targetObject.type} to (${newPosition.x}, ${newPosition.y})`
          },
          metadata: {
            executionTime: Date.now(),
            changedObjects: [targetObject.id || 'unknown']
          }
        };
      } catch (error) {
        return {
          success: false,
          error: `Failed to move object: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
    }
  },

  {
    name: 'resize_object',
    description: 'Resize an object by changing its scale or specific dimensions.',
    category: 'objects',
    inputSchema: {
      type: 'object',
      properties: {
        objectId: {
          type: 'string',
          description: 'ID of object to resize. Optional if object is selected.'
        },
        scaleX: {
          type: 'number',
          description: 'Horizontal scale factor (1.0 = original size)'
        },
        scaleY: {
          type: 'number',
          description: 'Vertical scale factor (1.0 = original size)'
        },
        width: {
          type: 'number',
          description: 'Absolute width in pixels'
        },
        height: {
          type: 'number',
          description: 'Absolute height in pixels'
        }
      },
      required: []
    },
    examples: [
      {
        description: 'Scale object to 150%',
        input: { scaleX: 1.5, scaleY: 1.5 },
        context: 'User wants to make object larger'
      },
      {
        description: 'Set specific dimensions',
        input: { width: 300, height: 200 },
        context: 'User wants exact size'
      }
    ],
    handler: async (input: any, context: any): Promise<ToolExecutionResult> => {
      try {
        const { canvas, selectedObjects } = context as { canvas: FabricCanvas; selectedObjects: FabricObject[] };
        const { objectId, scaleX, scaleY, width, height } = input;

        if (!canvas) {
          return { success: false, error: 'No canvas available' };
        }

        let targetObject: FabricObject | undefined;

        if (objectId) {
          targetObject = canvas.getObjects().find((obj: FabricObject) => obj.id === objectId);
        } else if (selectedObjects && selectedObjects.length > 0) {
          targetObject = selectedObjects[0];
        }

        if (!targetObject) {
          return { success: false, error: 'No object found to resize' };
        }

        const oldSize = {
          width: targetObject.width || 0,
          height: targetObject.height || 0,
          scaleX: targetObject.scaleX || 1,
          scaleY: targetObject.scaleY || 1
        };

        // Apply scaling
        if (scaleX !== undefined) targetObject?.set?.('scaleX', scaleX);
        if (scaleY !== undefined) targetObject?.set?.('scaleY', scaleY);

        // Apply absolute dimensions
        if (width !== undefined) {
          const currentWidth = (targetObject.width || 1) * (targetObject.scaleX || 1);
          const newScaleX = width / (targetObject.width || 1);
          targetObject?.set?.('scaleX', newScaleX);
        }
        if (height !== undefined) {
          const currentHeight = (targetObject.height || 1) * (targetObject.scaleY || 1);
          const newScaleY = height / (targetObject.height || 1);
          targetObject?.set?.('scaleY', newScaleY);
        }

        targetObject?.setCoords?.();
        canvas?.renderAll?.();

        const newSize = {
          width: targetObject.width || 0,
          height: targetObject.height || 0,
          scaleX: targetObject.scaleX || 1,
          scaleY: targetObject.scaleY || 1
        };

        return {
          success: true,
          data: {
            objectId: targetObject.id || 'unknown',
            oldSize,
            newSize,
            message: `Resized object from ${oldSize.width}x${oldSize.height} to ${newSize.width}x${newSize.height}`
          },
          metadata: {
            executionTime: Date.now(),
            changedObjects: [targetObject.id || 'unknown']
          }
        };
      } catch (error) {
        return {
          success: false,
          error: `Failed to resize object: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
    }
  },

  {
    name: 'delete_object',
    description: 'Delete an object from the canvas. Use with caution as this cannot be undone.',
    category: 'objects',
    inputSchema: {
      type: 'object',
      properties: {
        objectId: {
          type: 'string',
          description: 'ID of object to delete. Optional if object is selected.'
        },
        confirm: {
          type: 'boolean',
          description: 'Must be true to confirm deletion'
        }
      },
      required: ['confirm']
    },
    examples: [
      {
        description: 'Delete selected object',
        input: { confirm: true },
        context: 'User wants to remove selected object'
      },
      {
        description: 'Delete specific object',
        input: { objectId: 'text_123', confirm: true },
        context: 'User wants to remove specific object'
      }
    ],
    handler: async (input: any, context: any): Promise<ToolExecutionResult> => {
      try {
        const { canvas, selectedObjects } = context as { canvas: FabricCanvas; selectedObjects: FabricObject[] };
        const { objectId, confirm } = input;

        if (!canvas) {
          return { success: false, error: 'No canvas available' };
        }

        if (!confirm) {
          return { success: false, error: 'Must confirm to delete object' };
        }

        let targetObject: FabricObject | undefined;

        if (objectId) {
          targetObject = canvas.getObjects().find((obj: FabricObject) => obj.id === objectId);
        } else if (selectedObjects && selectedObjects.length > 0) {
          targetObject = selectedObjects[0];
        }

        if (!targetObject) {
          return { success: false, error: 'No object found to delete' };
        }

        const objectInfo = {
          id: targetObject.id || 'unknown',
          type: targetObject.type,
          name: targetObject.name || `${targetObject.type}-object`
        };

        canvas.remove(targetObject);
        canvas.discardActiveObject();
        canvas.renderAll();

        return {
          success: true,
          data: {
            deletedObjectId: objectInfo.id,
            objectType: objectInfo.type,
            message: `Deleted ${objectInfo.type} object`
          },
          metadata: {
            executionTime: Date.now(),
            changedObjects: [objectInfo.id]
          }
        };
      } catch (error) {
        return {
          success: false,
          error: `Failed to delete object: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
    }
  },

  {
    name: 'duplicate_object',
    description: 'Create a copy of an object, optionally positioning it at a different location.',
    category: 'objects',
    inputSchema: {
      type: 'object',
      properties: {
        objectId: {
          type: 'string',
          description: 'ID of object to duplicate. Optional if object is selected.'
        },
        offsetX: {
          type: 'number',
          description: 'X offset for the duplicate. Default: 20'
        },
        offsetY: {
          type: 'number',
          description: 'Y offset for the duplicate. Default: 20'
        }
      },
      required: []
    },
    examples: [
      {
        description: 'Duplicate with default offset',
        input: {},
        context: 'User wants to copy selected object'
      },
      {
        description: 'Duplicate with specific positioning',
        input: { offsetX: 100, offsetY: 0 },
        context: 'User wants copy positioned to the right'
      }
    ],
    handler: async (input: any, context: any): Promise<ToolExecutionResult> => {
      try {
        const { canvas, selectedObjects } = context as { canvas: FabricCanvas; selectedObjects: FabricObject[] };
        const { objectId, offsetX = 20, offsetY = 20 } = input;

        if (!canvas) {
          return { success: false, error: 'No canvas available' };
        }

        let targetObject: FabricObject | undefined;

        if (objectId) {
          targetObject = canvas.getObjects().find((obj: FabricObject) => obj.id === objectId);
        } else if (selectedObjects && selectedObjects.length > 0) {
          targetObject = selectedObjects[0];
        }

        if (!targetObject) {
          return { success: false, error: 'No object found to duplicate' };
        }

        return new Promise((resolve) => {
          targetObject?.clone?.((cloned: FabricObject) => {
            cloned?.set?.({
              left: (targetObject.left ?? 0) + offsetX,
              top: (targetObject.top ?? 0) + offsetY,
              id: `layer-${Date.now()}-${nanoid(6)}`,
              name: `${targetObject.name || targetObject.type}_copy`
            });

            canvas.add(cloned);
            
            // Ensure object:added event is fired for layer system integration
            if (canvas.fire) {
              canvas.fire('object:added', { target: cloned });
            }
            
            canvas.setActiveObject(cloned);
            canvas.renderAll();

            resolve({
              success: true,
              data: {
                originalId: targetObject.id || 'unknown',
                newObjectId: cloned.id || 'unknown',
                position: { x: cloned.left, y: cloned.top },
                message: `Duplicated ${targetObject.type} object`
              },
              metadata: {
                executionTime: Date.now(),
                changedObjects: [cloned.id || 'unknown']
              }
            });
          });
        });
      } catch (error) {
        return {
          success: false,
          error: `Failed to duplicate object: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
    }
  },

  {
    name: 'bring_to_front',
    description: 'Bring an object to the front (top layer) of the canvas.',
    category: 'objects',
    inputSchema: {
      type: 'object',
      properties: {
        objectId: {
          type: 'string',
          description: 'ID of object to bring forward. Optional if object is selected.'
        }
      },
      required: []
    },
    handler: async (input: any, context: any): Promise<ToolExecutionResult> => {
      try {
        const { canvas, selectedObjects } = context as { canvas: FabricCanvas; selectedObjects: FabricObject[] };
        const { objectId } = input;

        if (!canvas) {
          return { success: false, error: 'No canvas available' };
        }

        let targetObject: FabricObject | undefined;

        if (objectId) {
          targetObject = canvas.getObjects().find((obj: FabricObject) => obj.id === objectId);
        } else if (selectedObjects && selectedObjects.length > 0) {
          targetObject = selectedObjects[0];
        }

        if (!targetObject) {
          return { success: false, error: 'No object found to bring forward' };
        }

        canvas.bringToFront(targetObject);
        canvas.renderAll();

        return {
          success: true,
          data: {
            objectId: targetObject.id || 'unknown',
            message: `Brought ${targetObject.type} to front`
          },
          metadata: {
            executionTime: Date.now(),
            changedObjects: [targetObject.id || 'unknown']
          }
        };
      } catch (error) {
        return {
          success: false,
          error: `Failed to bring object to front: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
    }
  },

  {
    name: 'send_to_back',
    description: 'Send an object to the back (bottom layer) of the canvas.',
    category: 'objects',
    inputSchema: {
      type: 'object',
      properties: {
        objectId: {
          type: 'string',
          description: 'ID of object to send back. Optional if object is selected.'
        }
      },
      required: []
    },
    handler: async (input: any, context: any): Promise<ToolExecutionResult> => {
      try {
        const { canvas, selectedObjects } = context as { canvas: FabricCanvas; selectedObjects: FabricObject[] };
        const { objectId } = input;

        if (!canvas) {
          return { success: false, error: 'No canvas available' };
        }

        let targetObject: FabricObject | undefined;

        if (objectId) {
          targetObject = canvas.getObjects().find((obj: FabricObject) => obj.id === objectId);
        } else if (selectedObjects && selectedObjects.length > 0) {
          targetObject = selectedObjects[0];
        }

        if (!targetObject) {
          return { success: false, error: 'No object found to send back' };
        }

        canvas.sendToBack(targetObject);
        canvas.renderAll();

        return {
          success: true,
          data: {
            objectId: targetObject.id || 'unknown',
            message: `Sent ${targetObject.type} to back`
          },
          metadata: {
            executionTime: Date.now(),
            changedObjects: [targetObject.id || 'unknown']
          }
        };
      } catch (error) {
        return {
          success: false,
          error: `Failed to send object to back: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
    }
  },

  // List all objects on canvas
  {
    name: 'list_objects',
    description: 'Get a list of all objects currently on the canvas',
    category: 'objects',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    },
    examples: [
      {
        description: 'Returns array of all canvas objects with their properties',
        input: {},
        context: 'User asks "what\'s on the canvas?" or before manipulating objects'
      }
    ],
    handler: async (input: any, context: any): Promise<ToolExecutionResult> => {
      try {
        const { canvas } = context as { canvas: FabricCanvas };
        if (!canvas) {
          return { success: false, error: 'No canvas available' };
        }

        const objects = canvas.getObjects();
        const objectData = objects.map((obj: FabricObject) => ({
          id: obj.id || 'unknown',
          type: obj.type,
          left: obj.left || 0,
          top: obj.top || 0,
          width: obj.width || 0,
          height: obj.height || 0,
          visible: obj.visible !== false,
          name: obj.name || `${obj.type} object`
        }));

        return {
          success: true,
          data: {
            totalObjects: objects.length,
            objects: objectData
          },
          metadata: { 
            executionTime: Date.now(), 
            changedObjects: []
          }
        };
      } catch (error) {
        return {
          success: false,
          error: `Failed to list objects: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
    }
  }
];
