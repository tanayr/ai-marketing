import { FabricCanvas, FabricObject } from '../types/shared-types';
import { ToolExecutionResult as V2ToolResult } from '../types/shared-types';
import { ToolExecutionResult as ProviderToolResult } from '../../../../types/providers';
import { adaptToolResult } from './result-adapter';

// Create an error response in the V2ToolResult format
const createErrorResponse = (errorMessage: string): V2ToolResult => {
  return {
    success: false,
    error: errorMessage,
    data: {}
  };
};

// Helper function to safely parse JSON strings
const safeJsonParse = (value: any): any => {
  if (typeof value !== 'string') return value;
  
  try {
    return JSON.parse(value);
  } catch (e) {
    console.warn('Failed to parse JSON string', e);
    return value;
  }
};

// Helper function to convert CSS-style gradient to textGradient object
const convertCssGradientToTextGradient = (cssGradient: string): Record<string, any> | null => {
  // Match linear-gradient(...) pattern
  const linearMatch = cssGradient.match(/linear-gradient\(([^)]+)\)/);
  if (!linearMatch) return null;
  
  const gradientContent = linearMatch[1];
  
  // Extract angle if present
  let angle = 90; // Default vertical gradient
  const angleMatch = gradientContent.match(/(\d+)deg/);
  if (angleMatch) {
    angle = parseInt(angleMatch[1], 10);
  } else if (gradientContent.includes('to right')) {
    angle = 0;
  } else if (gradientContent.includes('to bottom right')) {
    angle = 45;
  } else if (gradientContent.includes('to bottom')) {
    angle = 90;
  } else if (gradientContent.includes('to bottom left')) {
    angle = 135;
  } else if (gradientContent.includes('to left')) {
    angle = 180;
  } else if (gradientContent.includes('to top left')) {
    angle = 225;
  } else if (gradientContent.includes('to top')) {
    angle = 270;
  } else if (gradientContent.includes('to top right')) {
    angle = 315;
  }
  
  // Extract colors
  const colorMatches = gradientContent.match(/#[0-9a-f]{3,8}|rgba?\([^)]+\)|[a-z]+/gi);
  if (!colorMatches || colorMatches.length < 2) return null;
  
  // Filter out direction keywords
  const colors = colorMatches.filter(color => 
    !['to', 'top', 'bottom', 'left', 'right', 'deg'].includes(color.toLowerCase())
  );
  
  return {
    type: 'linear',
    angle,
    colors
  };
};

// Adapter for tools that require a canvas and object ID
export const createObjectIdToolAdapter = (
  handler: (canvas: FabricCanvas, objectId: string) => Promise<V2ToolResult>
) => {
  return async (input: Record<string, any>, context: any): Promise<ProviderToolResult> => {
    try {
      const { canvas } = context;
      const { objectId } = input;
      
      if (!canvas) {
        return adaptToolResult(createErrorResponse('Canvas is not available'));
      }
      
      return adaptToolResult(await handler(canvas, objectId));
    } catch (error) {
      return adaptToolResult(createErrorResponse(`Error executing tool: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  };
};

// Adapter for tools that require a canvas, object ID, and action
export const createObjectActionToolAdapter = (
  handler: (canvas: FabricCanvas, objectId: string, action: string) => Promise<V2ToolResult>
) => {
  return async (input: Record<string, any>, context: any): Promise<ProviderToolResult> => {
    try {
      const { canvas } = context;
      const { objectId, action } = input;
      
      if (!canvas) {
        return adaptToolResult(createErrorResponse('Canvas is not available'));
      }
      
      // Make sure action is a string, even if it came from JSON
      const actionString = typeof action === 'object' ? JSON.stringify(action) : String(action);
      
      return adaptToolResult(await handler(canvas, objectId, actionString));
    } catch (error) {
      return adaptToolResult(createErrorResponse(`Error executing tool: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  };
};

// Specialized adapter for changeObjectOrder tool which has a specific action enum type
export const createChangeObjectOrderAdapter = (
  handler: (canvas: FabricCanvas, objectId: string, action: 'bring-forward' | 'send-backward' | 'bring-to-front' | 'send-to-back') => Promise<V2ToolResult>
) => {
  return async (input: Record<string, any>, context: any): Promise<ProviderToolResult> => {
    try {
      const { canvas } = context;
      const { objectId, action } = input;
      
      if (!canvas) {
        return adaptToolResult(createErrorResponse('Canvas is not available'));
      }
      
      // Validate the action is one of the allowed values
      const validActions = ['bring-forward', 'send-backward', 'bring-to-front', 'send-to-back'];
      if (!validActions.includes(action)) {
        return adaptToolResult(createErrorResponse(`Invalid action. Must be one of: ${validActions.join(', ')}`));
      }
      
      return adaptToolResult(await handler(canvas, objectId, action as 'bring-forward' | 'send-backward' | 'bring-to-front' | 'send-to-back'));
    } catch (error) {
      return adaptToolResult(createErrorResponse(`Error executing tool: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  };
};

// Adapter for tools that set canvas background
export const createSetCanvasBackgroundAdapter = (
  handler: (canvas: FabricCanvas, background: any) => Promise<V2ToolResult>
) => {
  return async (input: Record<string, any>, context: any): Promise<ProviderToolResult> => {
    try {
      const { canvas } = context;
      let { background, backgroundColor, color, gradientType, colors, angle, imageUrl, repeat, opacity } = input;
      
      if (!canvas) {
        return adaptToolResult(createErrorResponse('Canvas is not available'));
      }
      
      // Handle background parameter that might be a stringified JSON
      if (background) {
        // If background is a string, try to parse it as JSON
        if (typeof background === 'string') {
          try {
            background = JSON.parse(background);
            console.log('Successfully parsed background from JSON string:', background);
          } catch (error) {
            console.error('Failed to parse background JSON string:', error);
            // If it's not valid JSON, treat it as a color string
            if (!color && !backgroundColor) {
              color = background;
              background = null;
            }
          }
        }
        
        // If background is a valid object at this point, use it directly
        if (background && typeof background === 'object') {
          return adaptToolResult(await handler(canvas, background));
        }
      }
      
      // Otherwise, construct the background object based on provided parameters
      let backgroundOptions;
      
      // Check if a simple color is provided
      if (backgroundColor || color) {
        backgroundOptions = {
          type: 'solid',
          color: backgroundColor || color
        };
      }
      // Check if gradient parameters are provided
      else if (colors && Array.isArray(colors) && colors.length >= 2) {
        backgroundOptions = {
          type: 'gradient',
          gradientType: gradientType || 'linear',
          colors,
          angle: angle || 0
        };
      }
      // Check if image parameters are provided
      else if (imageUrl) {
        backgroundOptions = {
          type: 'image',
          imageUrl,
          repeat: repeat || 'repeat',
          opacity: opacity !== undefined ? opacity : 1
        };
      }
      else {
        return adaptToolResult(createErrorResponse('Valid background color, gradient, or image is required'));
      }
      
      // Make sure we have a valid backgroundOptions object if no direct background object was provided
      if (!background && backgroundOptions) {
        return adaptToolResult(await handler(canvas, backgroundOptions));
      } else if (background) {
        return adaptToolResult(await handler(canvas, background));
      } else {
        // If we reach here, we don't have valid background options
        return adaptToolResult(createErrorResponse('Valid background color, gradient, or image is required'));
      }
    } catch (error) {
      return adaptToolResult(createErrorResponse(`Error executing tool: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  };
};

// Adapter for tools that only require a canvas
export const createCanvasToolAdapter = (
  handler: (canvas: FabricCanvas) => Promise<V2ToolResult>
) => {
  return async (input: Record<string, any>, context: any): Promise<ProviderToolResult> => {
    try {
      const { canvas } = context;
      
      if (!canvas) {
        return adaptToolResult(createErrorResponse('Canvas is not available'));
      }
      
      return adaptToolResult(await handler(canvas));
    } catch (error) {
      return adaptToolResult(createErrorResponse(`Error executing tool: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  };
};

// Adapter for tools that require a canvas and include properties flag
export const createCanvasPropertiesToolAdapter = (
  handler: (canvas: FabricCanvas, includeProperties?: boolean) => Promise<V2ToolResult>
) => {
  return async (input: Record<string, any>, context: any): Promise<ProviderToolResult> => {
    try {
      const { canvas } = context;
      const { includeProperties } = input;
      
      if (!canvas) {
        return adaptToolResult(createErrorResponse('Canvas is not available'));
      }
      
      return adaptToolResult(await handler(canvas, includeProperties));
    } catch (error) {
      return adaptToolResult(createErrorResponse(`Error executing tool: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  };
};

// Adapter for tools that add a text object to the canvas
export const createAddTextToolAdapter = (
  handler: (canvas: FabricCanvas, text: string, x: number, y: number, fontSize: number, color: string, additionalProperties?: Record<string, any>) => Promise<V2ToolResult>
) => {
  return async (input: Record<string, any>, context: any): Promise<ProviderToolResult> => {
    try {
      const { canvas } = context;
      const { text, x, y, fontSize, color, additionalProperties } = input;
      
      if (!canvas) {
        return adaptToolResult(createErrorResponse('Canvas is not available'));
      }

      // Parse any additional properties that might be JSON strings
      const parsedProps = safeJsonParse(additionalProperties);
      
      return adaptToolResult(await handler(canvas, text, x, y, fontSize, color, parsedProps));
    } catch (error) {
      return adaptToolResult(createErrorResponse(`Error executing tool: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  };
};

// Adapter for tools that update text content
export const createUpdateTextContentToolAdapter = (
  handler: (canvas: FabricCanvas, objectId: string, text: string) => Promise<V2ToolResult>
) => {
  return async (input: Record<string, any>, context: any): Promise<ProviderToolResult> => {
    try {
      const { canvas } = context;
      const { objectId, text } = input;
      
      if (!canvas) {
        return adaptToolResult(createErrorResponse('Canvas is not available'));
      }
      
      return adaptToolResult(await handler(canvas, objectId, text));
    } catch (error) {
      return adaptToolResult(createErrorResponse(`Error executing tool: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  };
};

// Adapter for tools that apply text styles
export const createApplyTextStyleToolAdapter = (
  handler: (canvas: FabricCanvas, objectId: string, properties: Record<string, any>) => Promise<V2ToolResult>
) => {
  return async (input: Record<string, any>, context: any): Promise<ProviderToolResult> => {
    try {
      const { canvas } = context;
      let { objectId, properties } = input;
      
      if (!canvas) {
        return adaptToolResult(createErrorResponse('Canvas is not available'));
      }
      
      // Parse JSON string properties (for AI tool calls)
      properties = safeJsonParse(properties);
      
      // Process properties to handle CSS-style gradients
      if (properties && typeof properties === 'object') {
        // Check for CSS gradient in fill property
        if (properties.fill && typeof properties.fill === 'string' && properties.fill.includes('linear-gradient')) {
          console.log('Converting CSS gradient to textGradient object:', properties.fill);
          const textGradient = convertCssGradientToTextGradient(properties.fill);
          
          if (textGradient) {
            // Add textGradient property and remove fill
            properties.textGradient = textGradient;
            delete properties.fill;
            console.log('Converted to textGradient:', textGradient);
          }
        }
        
        // Handle backgroundColor vs textBackgroundColor naming
        if (properties.backgroundColor !== undefined && properties.textBackgroundColor === undefined) {
          properties.textBackgroundColor = properties.backgroundColor;
          delete properties.backgroundColor;
        }
      }
      
      return adaptToolResult(await handler(canvas, objectId, properties));
    } catch (error) {
      return adaptToolResult(createErrorResponse(`Error executing tool: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  };
};

// Adapter for tools that apply preset styles
export const createApplyPresetStyleToolAdapter = (
  handler: (canvas: FabricCanvas, objectId: string, presetName: string) => Promise<V2ToolResult>
) => {
  return async (input: Record<string, any>, context: any): Promise<ProviderToolResult> => {
    try {
      const { canvas } = context;
      const { objectId, presetName } = input;
      
      if (!canvas) {
        return adaptToolResult(createErrorResponse('Canvas is not available'));
      }
      
      // Make sure presetName is a string
      const presetNameString = typeof presetName === 'object' ? JSON.stringify(presetName) : String(presetName);
      
      return adaptToolResult(await handler(canvas, objectId, presetNameString));
    } catch (error) {
      return adaptToolResult(createErrorResponse(`Error executing tool: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  };
};

// Adapter for tools that move objects
export const createMoveObjectToolAdapter = (
  handler: (canvas: FabricCanvas, objectId: string, x: number, y: number, respectAlignment?: boolean) => Promise<V2ToolResult>
) => {
  return async (input: Record<string, any>, context: any): Promise<ProviderToolResult> => {
    try {
      const { canvas } = context;
      const { objectId, x: inputX, y: inputY, respectAlignment = true } = input;
      
      if (!canvas) {
        return adaptToolResult(createErrorResponse('Canvas is not available'));
      }
      
      // Convert string coordinates to numbers if needed
      const x = typeof inputX === 'string' ? parseFloat(inputX) : inputX;
      const y = typeof inputY === 'string' ? parseFloat(inputY) : inputY;
      
      // Validate that the coordinates are valid numbers
      if (typeof x !== 'number' || isNaN(x) || typeof y !== 'number' || isNaN(y)) {
        return adaptToolResult(createErrorResponse('x and y must be valid numbers or numeric strings'));
      }
      
      return adaptToolResult(await handler(canvas, objectId, x, y, respectAlignment));
    } catch (error) {
      return adaptToolResult(createErrorResponse(`Error executing tool: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  };
};

// Adapter for tools that list available presets
export const createListPresetsToolAdapter = (
  handler: (specificPreset?: string) => Promise<V2ToolResult>
) => {
  return async (input: Record<string, any>, context: any): Promise<ProviderToolResult> => {
    try {
      const { specificPreset } = input;
      
      // Handle the case where specificPreset might be a JSON string
      let parsedPreset = specificPreset;
      if (typeof specificPreset === 'string') {
        try {
          const parsed = JSON.parse(specificPreset);
          if (typeof parsed === 'string') {
            parsedPreset = parsed;
          }
        } catch (e) {
          // Keep original value if parsing fails
        }
      }
      
      return adaptToolResult(await handler(parsedPreset));
    } catch (error) {
      return adaptToolResult(createErrorResponse(`Error executing tool: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  };
};

// Adapter for get_object_size tool
export const createGetObjectSizeToolAdapter = (
  handler: (canvas: FabricCanvas, objectId: string) => Promise<V2ToolResult>
) => {
  return async (input: Record<string, any>, context: any): Promise<ProviderToolResult> => {
    try {
      const { canvas } = context;
      const { objectId } = input;
      
      if (!canvas) {
        return adaptToolResult(createErrorResponse('Canvas is not available'));
      }
      
      return adaptToolResult(await handler(canvas, objectId));
    } catch (error) {
      return adaptToolResult(createErrorResponse(`Error executing tool: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  };
};
