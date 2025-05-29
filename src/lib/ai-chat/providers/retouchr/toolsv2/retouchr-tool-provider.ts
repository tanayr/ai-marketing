"use client";

import { ToolDefinition, ToolCategory } from '../../../types/providers';
import * as textTools from './text-tools';
import * as objectTools from './object-tools';
import * as infoTools from './info-tools';
import * as canvasTools from './canvas-tools';
import * as adapters from './utils/tool-adapters';

/**
 * Tool definitions for v2 Retouchr tools
 * Each tool has a single responsibility for better LLM usability
 */

// Text manipulation tools
export const textToolDefinitions: ToolDefinition[] = [
  {
    name: 'add_text',
    description: 'Add new text to the canvas at the specified position with required fontSize and color. This is the primary tool for creating text elements.',
    category: 'text' as ToolCategory,
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Text content to add' },
        x: { type: 'number', description: 'X coordinate (from left)' },
        y: { type: 'number', description: 'Y coordinate (from top)' },
        fontSize: { type: 'number', description: 'Font size in pixels' },
        color: { type: 'string', description: 'Text color (hex, rgb, or name)' },
        additionalProperties: { 
          type: 'object', 
          description: 'Optional additional text properties like fontFamily, fontWeight, etc.'
        }
      },
      required: ['text', 'x', 'y', 'fontSize', 'color']
    },
    examples: [
      {
        description: 'Add "Hello World" text in red at position (100, 100)',
        input: {
          text: 'Hello World',
          x: 100,
          y: 100,
          fontSize: 36,
          color: 'red'
        },
        context: 'Canvas manipulation context'
      }
    ],
    handler: adapters.createAddTextToolAdapter(textTools.addText)
  },
  {
    name: 'update_text_content',
    description: 'Update only the content of an existing text object without affecting its styling or position. Use this when you only want to change what the text says.',
    category: 'text' as ToolCategory,
    inputSchema: {
      type: 'object',
      properties: {
        objectId: { type: 'string', description: 'ID of the text object to update' },
        text: { type: 'string', description: 'New text content' }
      },
      required: ['objectId', 'text']
    },
    examples: [
      {
        description: 'Change text content to "Updated Text"',
        input: {
          objectId: 'text_1234',
          text: 'Updated Text'
        },
        context: 'Canvas manipulation context'
      }
    ],
    handler: adapters.createUpdateTextContentToolAdapter(textTools.updateTextContent)
  },
  {
    name: 'apply_text_style',
    description: 'Apply styling properties to an existing text object. Supports both basic properties like fontSize, fontFamily, color and advanced properties like textShadow, textGradient, padding, borderRadius, etc. For advanced properties, ensure you use the specified object structures.',
    category: 'text' as ToolCategory,
    inputSchema: {
      type: 'object',
      properties: {
        objectId: { type: 'string', description: 'ID of the text object to style' },
        properties: { 
          type: 'object', 
          description: 'Object containing styling properties to apply. See sub-properties for details.',
          properties: {
            color: { type: 'string', description: 'Text color (e.g., "red", "#FF0000"). Maps to "fill".' },
            fill: { type: 'string', description: 'Direct fill property (can be color or gradient string, but prefer using textGradient for complex gradients).' },
            fontSize: { type: 'number', description: 'Font size in pixels.' },
            fontFamily: { type: 'string', description: 'Font family name.' },
            fontWeight: { type: 'string', description: 'e.g., "bold", "normal", "700".' },
            fontStyle: { type: 'string', description: 'e.g., "italic", "normal".' },
            textAlign: { type: 'string', enum: ['left', 'center', 'right', 'justify'], description: 'Text alignment.' },
            letterSpacing: { type: 'number', description: 'Spacing between letters (maps to charSpacing).' },
            lineHeight: { type: 'number', description: 'Line height multiplier.' },
            textTransform: { type: 'string', enum: ['none', 'uppercase', 'lowercase', 'capitalize'], description: 'Text transformation.' },
            textBackgroundColor: { type: 'string', description: 'Background color of the text box.' },
            backgroundColor: { type: 'string', description: 'Alternative name for textBackgroundColor.' },
            opacity: { type: 'number', description: 'Opacity of the text (0-1).' },
            padding: { type: 'number', description: 'Padding around the text (in pixels).' },
            borderRadius: { type: 'number', description: 'Border radius for the text box (in pixels).' },
            textGradient: {
              type: 'object',
              description: 'Applies a gradient to the text fill. Overrides simple "color" or "fill" if used.',
              properties: {
                type: { type: 'string', enum: ['linear', 'radial'], description: 'Type of gradient.' },
                colors: { type: 'array', items: { type: 'string' }, description: 'Array of color stops.' },
                angle: { type: 'number', description: 'Angle for linear gradients (degrees).' }
              },
              required: ['type', 'colors']
            },
            textShadow: {
              type: 'object',
              description: 'Applies a shadow to the text.',
              properties: {
                offsetX: { type: 'number', description: 'Horizontal offset of the shadow.' },
                offsetY: { type: 'number', description: 'Vertical offset of the shadow.' },
                blur: { type: 'number', description: 'Blur amount for the shadow.' },
                color: { type: 'string', description: 'Shadow color (e.g., "rgba(0,0,0,0.5)").' }
              },
              required: ['offsetX', 'offsetY', 'color']
            },
            textOutline: {
              type: 'object',
              description: 'Applies an outline to the text.',
              properties: {
                width: { type: 'number', description: 'Width of the outline.' },
                color: { type: 'string', description: 'Outline color.' }
              },
              required: ['width', 'color']
            }
          },
          additionalProperties: true
        }
      },
      required: ['objectId', 'properties']
    },
    examples: [
      {
        description: 'Change text to bold blue with a shadow',
        input: {
          objectId: 'text_1234',
          properties: {
            color: 'blue',
            fontWeight: 'bold',
            textShadow: { offsetX: 2, offsetY: 2, blur: 3, color: 'rgba(0,0,0,0.5)' }
          }
        },
        context: 'Canvas manipulation context'
      },
      {
        description: 'Apply a linear gradient to text',
        input: {
          objectId: 'text_1234',
          properties: {
            textGradient: {
              type: 'linear',
              angle: 90,
              colors: ['#ff4500', '#ff8c00', '#ffd700']
            }
          }
        },
        context: 'Canvas manipulation context'
      },
      {
        description: 'Apply outline to text',
        input: {
          objectId: 'text_1234',
          properties: {
            textOutline: {
              width: 2,
              color: '#000000'
            }
          }
        },
        context: 'Canvas manipulation context'
      },
      {
        description: 'Apply enhanced text properties',
        input: {
          objectId: 'text_1234',
          properties: {
            padding: 10,
            borderRadius: 5,
            backgroundColor: '#f0f0f0'
          }
        },
        context: 'Canvas manipulation context'
      }
    ],
    handler: adapters.createApplyTextStyleToolAdapter(textTools.applyTextStyle)
  },
  {
    name: 'apply_preset_style',
    description: 'Apply a predefined style preset to a text object. This tool makes it easy to quickly apply complex styling combinations with a single call.',
    category: 'text' as ToolCategory,
    inputSchema: {
      type: 'object',
      properties: {
        objectId: { type: 'string', description: 'ID of the text object to style' },
        presetName: { 
          type: 'string', 
          description: 'Name of the preset style to apply (e.g., "heading1", "callout", "quote", etc.)' 
        }
      },
      required: ['objectId', 'presetName']
    },
    examples: [
      {
        description: 'Apply the "heading1" preset style to text',
        input: {
          objectId: 'text_1234',
          presetName: 'heading1'
        },
        context: 'Canvas manipulation context'
      }
    ],
    handler: adapters.createApplyPresetStyleToolAdapter(textTools.applyPresetStyle)
  }
];

// Object manipulation tools
export const objectToolDefinitions: ToolDefinition[] = [
  {
    name: 'move_object',
    description: 'Move an object to a new position on the canvas. Handles alignment (originX/originY) appropriately to ensure precise positioning.',
    category: 'objects' as ToolCategory,
    inputSchema: {
      type: 'object',
      properties: {
        objectId: { type: 'string', description: 'ID of the object to move' },
        x: { oneOf: [{ type: 'number' }, { type: 'string' }], description: 'New X coordinate (can be number or string)' },
        y: { oneOf: [{ type: 'number' }, { type: 'string' }], description: 'New Y coordinate (can be number or string)' },
        respectAlignment: { 
          type: 'boolean', 
          description: 'Whether to respect the object\'s originX/originY settings (default: true)' 
        }
      },
      required: ['objectId', 'x', 'y']
    },
    examples: [
      {
        description: 'Move object to position (200, 150)',
        input: {
          objectId: 'obj_1234',
          x: 200,
          y: 150
        },
        context: 'Canvas manipulation context'
      }
    ],
    handler: adapters.createMoveObjectToolAdapter(objectTools.moveObject)
  },
  {
    name: 'delete_object',
    description: 'Delete an object from the canvas by its ID. This action cannot be undone.',
    category: 'objects' as ToolCategory,
    inputSchema: {
      type: 'object',
      properties: {
        objectId: { type: 'string', description: 'ID of the object to delete' }
      },
      required: ['objectId']
    },
    examples: [
      {
        description: 'Delete the object with ID obj_1234',
        input: {
          objectId: 'obj_1234'
        },
        context: 'Canvas manipulation context'
      }
    ],
    handler: adapters.createObjectIdToolAdapter(objectTools.deleteObject)
  },
  {
    name: 'change_object_order',
    description: 'Change the stacking order of an object on the canvas. Move it forward/backward or to the front/back of the stack.',
    category: 'objects' as ToolCategory,
    inputSchema: {
      type: 'object',
      properties: {
        objectId: { type: 'string', description: 'ID of the object to reorder' },
        action: { 
          type: 'string', 
          enum: ['bring-forward', 'send-backward', 'bring-to-front', 'send-to-back'],
          description: 'Stacking action to perform' 
        }
      },
      required: ['objectId', 'action']
    },
    examples: [
      {
        description: 'Bring object to the front of the stack',
        input: {
          objectId: 'obj_1234',
          action: 'bring-to-front'
        },
        context: 'Canvas manipulation context'
      }
    ],
    handler: adapters.createChangeObjectOrderAdapter(objectTools.changeObjectOrder)
  }
];

// Information/getter tools
export const infoToolDefinitions: ToolDefinition[] = [
  {
    name: 'get_canvas_state',
    description: 'Get the current state of the canvas including all objects with their essential properties. Use this to understand what objects exist on the canvas before making changes.',
    category: 'canvas' as ToolCategory,
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    },
    examples: [
      {
        description: 'Get current canvas state',
        input: {},
        context: 'Canvas manipulation context'
      }
    ],
    handler: adapters.createCanvasToolAdapter(infoTools.getCanvasState)
  },
  {
    name: 'get_object_details',
    description: 'Get comprehensive details about a specific object, including all properties and advanced features. This is particularly useful for understanding complex text objects with enhanced properties.',
    category: 'canvas' as ToolCategory,
    inputSchema: {
      type: 'object',
      properties: {
        objectId: { type: 'string', description: 'ID of the object to get details for' }
      },
      required: ['objectId']
    },
    examples: [
      {
        description: 'Get detailed information about object with ID obj_1234',
        input: {
          objectId: 'obj_1234'
        },
        context: 'Canvas manipulation context'
      }
    ],
    handler: adapters.createObjectIdToolAdapter(infoTools.getObjectDetails)
  },
  {
    name: 'get_image_objects',
    description: 'Get a list of all image objects on the canvas with their properties. Useful for identifying images before making changes to them.',
    category: 'canvas' as ToolCategory,
    inputSchema: {
      type: 'object',
      properties: {
        includeProperties: { 
          type: 'boolean', 
          description: 'Whether to include all object properties (default: false)' 
        }
      },
      required: []
    },
    examples: [
      {
        description: 'Get all image objects on the canvas',
        input: {},
        context: 'Canvas manipulation context'
      }
    ],
    handler: adapters.createCanvasPropertiesToolAdapter(infoTools.getImageObjects)
  },
  {
    name: 'get_selected_object',
    description: 'Get information about the currently selected object on the canvas. If multiple objects are selected, all of them will be returned.',
    category: 'canvas' as ToolCategory,
    inputSchema: {
      type: 'object',
      properties: {
        includeProperties: { 
          type: 'boolean', 
          description: 'Whether to include all object properties (default: false)' 
        }
      },
      required: []
    },
    examples: [
      {
        description: 'Get the currently selected object',
        input: {},
        context: 'Canvas manipulation context'
      }
    ],
    handler: adapters.createCanvasPropertiesToolAdapter(infoTools.getSelectedObject)
  },
  {
    name: 'list_available_presets',
    description: 'Get a list of all available text style presets with their descriptions. Optionally get detailed information about a specific preset.',
    category: 'canvas' as ToolCategory,
    inputSchema: {
      type: 'object',
      properties: {
        specificPreset: { 
          type: 'string', 
          description: 'Optional name of a specific preset to get detailed information for' 
        }
      },
      required: []
    },
    examples: [
      {
        description: 'Get all available presets',
        input: {},
        context: 'Canvas manipulation context'
      },
      {
        description: 'Get details for a specific preset',
        input: {
          specificPreset: 'heading1'
        },
        context: 'Canvas manipulation context'
      }
    ],
    handler: adapters.createListPresetsToolAdapter(infoTools.listAvailablePresets)
  },
  {
    name: 'get_object_size',
    description: 'Get detailed size and position information for an object, including its dimensions and the canvas dimensions. Useful for calculating proper positioning.',
    category: 'canvas' as ToolCategory,
    inputSchema: {
      type: 'object',
      properties: {
        objectId: { type: 'string', description: 'ID of the object to get size information for' }
      },
      required: ['objectId']
    },
    examples: [
      {
        description: 'Get size information for an object',
        input: {
          objectId: 'obj_1234'
        },
        context: 'Canvas manipulation context'
      }
    ],
    handler: adapters.createGetObjectSizeToolAdapter(infoTools.getObjectSize)
  }
];

// Canvas manipulation tools
export const canvasToolDefinitions: ToolDefinition[] = [
  {
    name: 'set_canvas_background',
    description: 'Set the canvas background to a solid color, gradient, or image. Can accept simple color string or complex gradient/image options.',
    category: 'canvas' as ToolCategory,
    inputSchema: {
      type: 'object',
      properties: {
        // Simple color options
        color: { type: 'string', description: 'Simple color string (hex, rgb, or name) for solid background' },
        backgroundColor: { type: 'string', description: 'Alternative name for color parameter' },
        
        // Gradient options
        gradientType: { 
          type: 'string', 
          enum: ['linear', 'radial'],
          description: 'Type of gradient to apply (when using colors array)' 
        },
        colors: { 
          type: 'array', 
          items: { type: 'string' },
          description: 'Array of color strings for gradient (minimum 2 colors required)' 
        },
        angle: { 
          type: 'number', 
          description: 'Angle in degrees for linear gradients (0-360, default: 0)' 
        },
        
        // Image options
        imageUrl: { 
          type: 'string', 
          description: 'URL of image to use as background' 
        },
        repeat: { 
          type: 'string', 
          enum: ['repeat', 'repeat-x', 'repeat-y', 'no-repeat'],
          description: 'How the background image should repeat (default: repeat)' 
        },
        opacity: { 
          type: 'number', 
          description: 'Opacity of the background image (0-1, default: 1)' 
        },
        
        // Advanced options (alternative to individual parameters)
        background: {
          type: 'object',
          description: 'Complex background options object (alternative to individual parameters)'
        }
      },
      // At least one of these properties must be provided
      // We can't use oneOf here due to schema limitations
      required: []
    },
    examples: [
      {
        description: 'Set solid color background',
        input: {
          color: '#3498db'
        },
        context: 'Canvas manipulation context'
      },
      {
        description: 'Set linear gradient background',
        input: {
          gradientType: 'linear',
          colors: ['#ff0000', '#0000ff'],
          angle: 45
        },
        context: 'Canvas manipulation context'
      },
      {
        description: 'Set background image',
        input: {
          imageUrl: 'https://example.com/background.jpg',
          repeat: 'repeat',
          opacity: 0.8
        },
        context: 'Canvas manipulation context'
      }
    ],
    handler: adapters.createSetCanvasBackgroundAdapter(canvasTools.setCanvasBackground)
  }
];

// Combined tools array
export const allToolsV2: ToolDefinition[] = [
  ...textToolDefinitions,
  ...objectToolDefinitions,
  ...canvasToolDefinitions,
  ...infoToolDefinitions
];
