"use client";

import { FabricCanvas, FabricObject, FabricTextObject } from '../types/shared-types';

/**
 * Check if object has enhanced text properties
 * NOTE: Removed enhanced-text type reference - using unified IText approach now
 */
export const isEnhancedText = (obj: any): boolean => {
  return obj && (
    // obj.type === 'enhanced-text' || 
    (obj.padding !== undefined && obj.borderRadius !== undefined)
  );
};

/**
 * Check if object has advanced text properties
 * NOTE: Removed advanced-text type reference - using unified IText approach now
 */
export const isAdvancedText = (obj: any): boolean => {
  return obj && (
    // obj.type === 'advanced-text' || 
    obj.textShadow !== undefined || 
    obj.textGradient !== undefined || 
    obj.textOutline !== undefined
  );
};

/**
 * Get the text object class (always returns IText with our extensions)
 * NOTE: Simplified to always use extended IText instead of separate classes
 */
export const getTextClass = (canvas: FabricCanvas, requireAdvanced: boolean = false): any => {
  // NOTE: We no longer use different text classes based on requirements
  // All text functionality is now unified in the extended IText class
  
  // Try window fabric global first
  if (typeof window !== 'undefined' && (window as any).fabric?.IText) {
    return (window as any).fabric.IText;
  }
  
  // Try canvas context
  if (canvas && canvas.IText) {
    return canvas.IText;
  }
  
  // Fallback - this should never happen in practice
  console.warn('No IText class found, text functionality may be limited');
  return null;
  
  // Previous implementation with separate classes - commented out
  /*
  // Try window fabric global
  if (typeof window !== 'undefined') {
    // First try for AdvancedText if required
    if (requireAdvanced && (window as any).fabric?.AdvancedText) {
      return (window as any).fabric.AdvancedText;
    }
    
    // Then try for EnhancedText
    if ((window as any).fabric?.EnhancedText) {
      return (window as any).fabric.EnhancedText;
    }
    
    // Standard IText
    if ((window as any).fabric?.IText) {
      return (window as any).fabric.IText;
    }
  }
  */
};

/**
 * Trigger layer system update after object change
 */
export const triggerLayerUpdate = (canvas: FabricCanvas, object: FabricObject): void => {
  if (canvas && canvas.fire && object) {
    // Fire event for layer system
    canvas.fire('object:modified', { target: object });
  }
};

/**
 * Apply text refresh for enhanced and advanced text
 */
export const refreshTextObject = (textObject: FabricTextObject): void => {
  // Use _refreshObject method if available (enhanced/advanced text)
  if (textObject._refreshObject && typeof textObject._refreshObject === 'function') {
    textObject._refreshObject();
  } else {
    // Fallback for standard text objects
    if (textObject.setCoords) {
      textObject.setCoords();
    }
  }
};

/**
 * Map property names between tool API and Fabric.js
 * 
 * This handles cases where our API uses different property names
 * than Fabric.js for better user/LLM experience
 */
export const mapToFabricProperties = (properties: Record<string, any>): Record<string, any> => {
  const fabricProperties: Record<string, any> = { ...properties };
  
  // Map letterSpacing to charSpacing
  if (fabricProperties.letterSpacing !== undefined) {
    fabricProperties.charSpacing = fabricProperties.letterSpacing;
    delete fabricProperties.letterSpacing;
  }
  
  // Map color to fill
  if (fabricProperties.color !== undefined) {
    fabricProperties.fill = fabricProperties.color;
    delete fabricProperties.color;
  }
  
  // Map backgroundColor to textBackgroundColor for text objects
  if (fabricProperties.backgroundColor !== undefined) {
    fabricProperties.textBackgroundColor = fabricProperties.backgroundColor;
    delete fabricProperties.backgroundColor;
  }
  
  return fabricProperties;
};

/**
 * Map Fabric.js properties to tool API properties
 */
export const mapFromFabricProperties = (fabricObject: FabricObject): Record<string, any> => {
  const properties: Record<string, any> = {};
  
  // Only copy necessary properties to avoid excessive data
  const commonProps = [
    'id', 'type', 'name', 'left', 'top', 'width', 'height',
    'scaleX', 'scaleY', 'angle', 'visible', 'opacity',
    'originX', 'originY'
  ];
  
  commonProps.forEach(prop => {
    if (fabricObject[prop] !== undefined) {
      properties[prop] = fabricObject[prop];
    }
  });
  
  // Map fill to color
  if (fabricObject.fill !== undefined) {
    properties.color = fabricObject.fill;
  }
  
  // Map charSpacing to letterSpacing
  if ((fabricObject as FabricTextObject).charSpacing !== undefined) {
    properties.letterSpacing = (fabricObject as FabricTextObject).charSpacing;
  }
  
  // Map textBackgroundColor to backgroundColor
  if ((fabricObject as FabricTextObject).textBackgroundColor !== undefined) {
    properties.backgroundColor = (fabricObject as FabricTextObject).textBackgroundColor;
  }
  
  return properties;
};
