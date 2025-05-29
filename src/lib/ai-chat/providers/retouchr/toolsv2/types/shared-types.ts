"use client";

/**
 * Shared types for Retouchr toolsv2
 */

// Import types from existing system
import { fabric } from '@/components/studio/retouchr/utils/fabric-imports';
import { LayerItem } from '@/components/studio/retouchr/fLayers/core/types';

// Text effect interfaces
export interface TextShadow {
  offsetX: number;
  offsetY: number;
  blur: number;
  color: string;
}

export interface TextOutline {
  width: number;
  color: string;
}

export interface TextGradient {
  type: 'linear' | 'radial';
  colors: string[];
  angle?: number; // for linear gradients
}

// Fabric.js canvas interface
export interface FabricCanvas {
  getObjects(): any[];
  add(obj: any): void;
  remove(obj: any): void;
  renderAll(): void;
  setActiveObject(obj: any): void;
  getActiveObject(): any;
  discardActiveObject(): void;
  bringToFront(obj: any): void;
  sendToBack(obj: any): void;
  bringForward(obj: any): void;
  sendBackwards(obj: any): void;
  getWidth(): number;
  getHeight(): number;
  backgroundColor?: string;
  fire?(eventName: string, options: any): void;
  setDimensions(dimensions: { width: number; height: number }): void;
  clear(): void;
  [key: string]: any;
}

// Base Fabric object interface
export interface FabricObject {
  id?: string;
  type?: string;
  name?: string;
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  scaleX?: number;
  scaleY?: number;
  angle?: number;
  visible?: boolean;
  opacity?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  originX?: string;
  originY?: string;
  set?(property: string | Record<string, any>, value?: any): any;
  setCoords?(): void;
  [key: string]: any;
}

// Text-specific fabric object
export interface FabricTextObject extends FabricObject {
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string | number;
  fontStyle?: string;
  textAlign?: string;
  lineHeight?: number;
  charSpacing?: number;
  underline?: boolean;
  textBackgroundColor?: string;
  
  // Enhanced text properties
  padding?: number;
  borderRadius?: number;
  
  // Advanced text properties
  textShadow?: TextShadow;
  textOutline?: TextOutline;
  textGradient?: TextGradient;
  letterSpacing?: number;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  
  // Advanced text method
  _refreshObject?(): void;
}

// Image-specific fabric object
export interface FabricImageObject extends FabricObject {
  getSrc?(): string;
  src?: string;
  crossOrigin?: string | null;
  filters?: any[];
}

// Tool execution context
export interface ToolExecutionContext {
  canvas: FabricCanvas;
  selectedObjects?: FabricObject[];
  layers?: LayerItem[];
  user?: any;
  organization?: any;
  [key: string]: any;
}

// Standardized tool result
export interface ToolExecutionResult {
  success: boolean;
  data?: Record<string, any>;
  error?: string;
  metadata?: {
    executionTime?: number;
    changedObjects?: string[];
    [key: string]: any;
  };
}

// Lean canvas object representation
export interface CanvasObjectInfo {
  id: string;
  type: string;
  name: string;
  left: number;
  top: number;
  width: number;
  height: number;
  isVisible: boolean;
  text_snippet?: string;
  image_filename?: string;
  fill_color?: string;
  stroke_color?: string;
}

// Canvas state for get_canvas_state
export interface CanvasState {
  canvas_properties: {
    width: number;
    height: number;
    background_color: string;
  };
  objects: CanvasObjectInfo[];
}

// Style preset for list_available_presets
export interface StylePreset {
  name: string;
  description: string;
  category: string;
  properties: Record<string, any>;
}
