"use client";

import { FabricCanvas, ToolExecutionResult } from '../types/shared-types';
import { createSuccessResponse } from '../utils/object-helper';

/**
 * Background options types
 */
export interface SolidBackgroundOptions {
  type: 'solid';
  color: string;
}

export interface GradientBackgroundOptions {
  type: 'gradient';
  gradientType: 'linear' | 'radial';
  colors: string[];
  angle?: number; // for linear gradients, in degrees
}

export interface ImageBackgroundOptions {
  type: 'image';
  imageUrl: string;
  repeat?: 'repeat' | 'repeat-x' | 'repeat-y' | 'no-repeat';
  opacity?: number;
}

export type BackgroundOptions = 
  | SolidBackgroundOptions 
  | GradientBackgroundOptions 
  | ImageBackgroundOptions;

/**
 * Set the canvas background to a solid color, gradient, or image
 * 
 * This tool allows for complete customization of the canvas background,
 * supporting solid colors, gradients, and background images.
 */
export const setCanvasBackground = async (
  canvas: FabricCanvas,
  background: BackgroundOptions
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

    if (!background || !background.type) {
      return {
        success: false,
        error: 'Background options are required with a valid type',
        data: {}
      };
    }

    // Handle different background types
    switch (background.type) {
      case 'solid': {
        const { color } = background;
        
        if (!color) {
          return {
            success: false,
            error: 'Color is required for solid background',
            data: {}
          };
        }
        
        // Set solid color background
        canvas.backgroundColor = color;
        canvas.renderAll();
        
        return createSuccessResponse({
          message: `Canvas background set to solid color: ${color}`,
          backgroundColor: color
        });
      }
      
      case 'gradient': {
        const { gradientType, colors, angle = 0 } = background;
        
        if (!colors || !Array.isArray(colors) || colors.length < 2) {
          return {
            success: false,
            error: 'At least two colors are required for gradient background',
            data: {}
          };
        }
        
        // Create gradient based on type
        try {
          const fabricGradient = createFabricGradient(canvas, gradientType, colors, angle);
          canvas.backgroundColor = fabricGradient;
          canvas.renderAll();
          
          return createSuccessResponse({
            message: `Canvas background set to ${gradientType} gradient`,
            gradientType,
            colors,
            angle: gradientType === 'linear' ? angle : undefined
          });
        } catch (error) {
          return {
            success: false,
            error: `Failed to create gradient: ${error instanceof Error ? error.message : String(error)}`,
            data: {}
          };
        }
      }
      
      case 'image': {
        const { imageUrl, repeat = 'repeat', opacity = 1 } = background;
        
        if (!imageUrl) {
          return {
            success: false,
            error: 'Image URL is required for image background',
            data: {}
          };
        }
        
        // Load and set background image
        try {
          // We need to use a promise to handle the async image loading
          return new Promise((resolve) => {
            createFabricBackgroundImage(canvas, imageUrl, repeat, opacity)
              .then(() => {
                resolve(createSuccessResponse({
                  message: `Canvas background set to image: ${imageUrl}`,
                  backgroundImage: imageUrl,
                  repeat,
                  opacity
                }));
              })
              .catch((error) => {
                resolve({
                  success: false,
                  error: `Failed to load background image: ${error instanceof Error ? error.message : String(error)}`,
                  data: {}
                });
              });
          });
        } catch (error) {
          return {
            success: false,
            error: `Failed to set background image: ${error instanceof Error ? error.message : String(error)}`,
            data: {}
          };
        }
      }
      
      default:
        return {
          success: false,
          error: `Unsupported background type: ${(background as any).type}`,
          data: {}
        };
    }
  } catch (error) {
    console.error('Error setting canvas background:', error);
    return {
      success: false,
      error: `Error setting canvas background: ${error instanceof Error ? error.message : String(error)}`,
      data: {}
    };
  }
};

/**
 * Helper function to create a Fabric.js gradient object
 */
function createFabricGradient(
  canvas: FabricCanvas, 
  gradientType: 'linear' | 'radial', 
  colors: string[], 
  angle: number = 0
): any {
  // Need to use the fabric global from window
  if (typeof window === 'undefined' || !(window as any).fabric) {
    throw new Error('Fabric.js not available');
  }
  
  const fabric = (window as any).fabric;
  
  if (gradientType === 'linear') {
    // Convert angle to coordinates for the gradient
    // Angle is in degrees, with 0 being horizontal gradient from left to right
    const angleRad = (angle * Math.PI) / 180;
    const x1 = 0;
    const y1 = 0;
    const x2 = Math.cos(angleRad);
    const y2 = Math.sin(angleRad);
    
    // Create gradient
    const gradient = new fabric.Gradient({
      type: 'linear',
      coords: { x1, y1, x2, y2 },
      colorStops: colors.map((color, index) => ({
        offset: index / (colors.length - 1),
        color: color
      }))
    });
    
    return gradient;
  } else if (gradientType === 'radial') {
    // Create radial gradient
    // For radial, we place the center in the middle of the canvas
    const width = canvas.getWidth();
    const height = canvas.getHeight();
    const r2 = Math.max(width, height) / 2; // Outer radius
    
    const gradient = new fabric.Gradient({
      type: 'radial',
      coords: { 
        r1: 0, // Inner radius
        r2, // Outer radius
        x1: width / 2, // Center X
        y1: height / 2, // Center Y
        x2: width / 2, // Center X (same for radial)
        y2: height / 2 // Center Y (same for radial)
      },
      colorStops: colors.map((color, index) => ({
        offset: index / (colors.length - 1),
        color: color
      }))
    });
    
    return gradient;
  }
  
  throw new Error(`Unsupported gradient type: ${gradientType}`);
}

/**
 * Helper function to create a Fabric.js background image
 */
async function createFabricBackgroundImage(
  canvas: FabricCanvas, 
  imageUrl: string, 
  repeat: 'repeat' | 'repeat-x' | 'repeat-y' | 'no-repeat' = 'repeat',
  opacity: number = 1
): Promise<void> {
  // Need to use the fabric global from window
  if (typeof window === 'undefined' || !(window as any).fabric) {
    throw new Error('Fabric.js not available');
  }
  
  const fabric = (window as any).fabric;
  
  return new Promise((resolve, reject) => {
    fabric.Image.fromURL(
      imageUrl,
      (img: any) => {
        if (!img) {
          reject(new Error('Failed to load image'));
          return;
        }
        
        canvas.setBackgroundImage(
          img,
          canvas.renderAll.bind(canvas),
          {
            repeat,
            opacity
          }
        );
        
        resolve();
      },
      { crossOrigin: 'anonymous' }
    );
  });
}
