"use client";

import { fabric } from './fabric-imports';

/**
 * Helper functions for working with enhanced fabric.IText objects
 * These functions help bridge the gap during transition from EnhancedText/AdvancedText
 * to the unified approach using fabric.IText directly
 */

/**
 * Check if a text object has advanced effects applied
 */
export function hasTextEffects(textObject: fabric.Object | null | undefined): boolean {
  if (!textObject || !textObject.type?.includes('text')) return false;
  
  const text = textObject as any;
  return !!(
    text.textShadow || 
    text.textOutline || 
    text.textGradient ||
    text.padding > 0 ||
    text.borderRadius > 0 ||
    text.letterSpacing !== 0 ||
    text.textTransform !== 'none'
  );
}

/**
 * Get a safe reference to a text object, properly typed
 */
export function getTextObject(object: fabric.Object | null | undefined): fabric.IText & Record<string, any> {
  if (!object || !object.type?.includes('text')) {
    throw new Error('Not a text object');
  }
  
  // Double cast to bypass TypeScript errors during transition
  return object as any as fabric.IText & Record<string, any>;
}

/**
 * Apply a text preset to a text object
 */
export function applyTextPreset(
  textObject: fabric.Object | null | undefined,
  preset: Record<string, any>,
  canvas?: fabric.Canvas | null
): void {
  if (!textObject || !textObject.type?.includes('text')) return;
  
  const text = getTextObject(textObject);
  
  // Apply all properties
  Object.entries(preset).forEach(([key, value]) => {
    text.set(key, value);
  });
  
  // Refresh the object
  if (typeof text.refreshObject === 'function') {
    text.refreshObject();
  } else if (canvas) {
    canvas.renderAll();
  }
}

/**
 * Extract text properties from a fabric object
 */
export function extractTextProperties(textObject: fabric.Object | null | undefined): Record<string, any> {
  if (!textObject || !textObject.type?.includes('text')) {
    return {};
  }
  
  const text = textObject as any;
  
  return {
    text: text.text || 'Text',
    fontFamily: text.fontFamily || 'Arial',
    fontSize: text.fontSize || 24,
    fill: text.fill || '#000000',
    backgroundColor: text.backgroundColor,
    fontWeight: text.fontWeight || 'normal',
    fontStyle: text.fontStyle || 'normal',
    underline: text.underline || false,
    lineHeight: text.lineHeight || 1.16,
    charSpacing: text.charSpacing || 0,
    textAlign: text.textAlign || 'left',
    padding: text.padding || 0,
    borderRadius: text.borderRadius || 0,
    letterSpacing: text.letterSpacing || 0,
    textTransform: text.textTransform || 'none',
    textShadow: text.textShadow,
    textOutline: text.textOutline,
    textGradient: text.textGradient
  };
}

/**
 * Create a new text object with enhanced features
 */
export function createEnhancedText(
  text: string,
  properties: Record<string, any> = {},
  canvas?: fabric.Canvas | null
): fabric.IText {
  // Create new text object with properties
  const textObject = new fabric.IText(text, properties);
  
  // Add to canvas if provided
  if (canvas) {
    canvas.add(textObject);
    canvas.setActiveObject(textObject);
    canvas.renderAll();
  }
  
  return textObject;
}
