// text-tools-update.ts

import { ToolDefinition, ToolExecutionResult } from '../../../types/providers';
import { FabricCanvas, FabricTextObject, FabricObject, TextToolResult } from './text-tools-types';

export const updateTextContentTool: ToolDefinition = {
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
  handler: async (input: any, context: { canvas?: FabricCanvas, selectedObjects?: FabricObject[], [key: string]: any }): Promise<ToolExecutionResult> => {
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
        textObject = selectedObjects[0] as FabricTextObject; // Assuming the first selected object is the target
      }

      if (!textObject) {
        return { success: false, error: `No text object found to update. Searched by ID: ${objectId}, Selected: ${selectedObjects?.length}` };
      }

      // Check if it's a text object by verifying it has a text property
      // This is a property-based check instead of type check to support any text object variant
      if (typeof textObject.text !== 'string' && !('text' in textObject)) {
        return { success: false, error: `Selected object is not a text object or has no text property.` };
      }

      const oldText = textObject.text || '';
      
      if (typeof textObject.set === 'function') {
        textObject.set('text', newText);
        textObject.set('name', newText.length > 20 ? `${newText.substring(0, 20)}...` : newText);
      } else {
        // Fallback for objects that might not have a 'set' method but allow direct property access
        textObject.text = newText;
        textObject.name = newText.length > 20 ? `${newText.substring(0, 20)}...` : newText;
      }
      
      // Force canvas to re-render
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
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to update text content: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
};
