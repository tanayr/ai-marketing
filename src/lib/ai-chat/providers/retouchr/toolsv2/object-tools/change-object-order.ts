"use client";

import { FabricCanvas, ToolExecutionResult } from '../types/shared-types';
import { findObjectById } from '../utils/object-helper';

/**
 * Change the stacking order of an object on the canvas
 * 
 * This tool allows moving objects forward/backward in the stacking order
 * or directly to the front/back of the canvas.
 */
export const changeObjectOrder = async (
  canvas: FabricCanvas,
  objectId: string,
  action: 'bring-forward' | 'send-backward' | 'bring-to-front' | 'send-to-back'
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

    const validActions = ['bring-forward', 'send-backward', 'bring-to-front', 'send-to-back'];
    if (!action || !validActions.includes(action)) {
      return {
        success: false,
        error: `Invalid action. Must be one of: ${validActions.join(', ')}`,
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

    // Apply the requested action
    switch (action) {
      case 'bring-forward':
        canvas.bringForward(object);
        break;
      case 'send-backward':
        canvas.sendBackwards(object);
        break;
      case 'bring-to-front':
        canvas.bringToFront(object);
        break;
      case 'send-to-back':
        canvas.sendToBack(object);
        break;
    }
    
    // Notify the layer system about the change
    if (canvas.fire) {
      canvas.fire('object:modified', { target: object });
    }
    
    // Render the canvas
    canvas.renderAll();

    // Format a user-friendly message
    const actionText = {
      'bring-forward': 'brought forward',
      'send-backward': 'sent backward',
      'bring-to-front': 'brought to the front',
      'send-to-back': 'sent to the back'
    }[action];

    return {
      success: true,
      data: {
        message: `Object ${actionText} successfully`,
        objectId: objectId
      }
    };
  } catch (error) {
    console.error('Error changing object order:', error);
    return {
      success: false,
      error: `Error changing object order: ${error instanceof Error ? error.message : String(error)}`,
      data: {}
    };
  }
};
