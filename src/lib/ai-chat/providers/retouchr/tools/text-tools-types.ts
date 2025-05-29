// text-tools-types.ts

/**
 * Type definitions for text tools using unified IText approach
 * We are using fabric.IText as our single unified text class
 */

// Options for creating IText objects
export interface ITextOptions {
  left?: number;
  top?: number;
  fontSize?: number;
  fontFamily?: string;
  fill?: string;
  fontWeight?: string | number;
  fontStyle?: string;
  textAlign?: string;
  originX?: string;
  originY?: string;
  underline?: boolean;
  linethrough?: boolean;
  name?: string;
  id?: string;
  angle?: number;
  // Text effect properties
  shadow?: string | object;
  stroke?: string;
  strokeWidth?: number;
  textBackgroundColor?: string;
  [key: string]: any;
}

// Fabric.js canvas interface
export interface FabricCanvas {
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
  width?: number;
  height?: number;
  fire?(eventName: string, options?: any): void;
  setActiveObject?(obj: any): void;
  // Use IText property instead of EnhancedText
  IText?: any;
  [key: string]: any;
}

// Unified text object interface based on fabric.IText
export interface FabricTextObject {
  id?: string;
  type?: string;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fill?: string;
  fontWeight?: string | number;
  fontStyle?: string;
  textAlign?: string;
  underline?: boolean;
  linethrough?: boolean;
  left?: number;
  top?: number;
  angle?: number;
  // Text effect properties
  shadow?: string | object;
  stroke?: string;
  strokeWidth?: number;
  textBackgroundColor?: string;
  // Methods
  set?(property: string, value: any): void;
  set?(properties: any): void;
  get?(property: string): any;
  setCoords?(): void;
  [key: string]: any;
}

// Generic fabric object interface
export interface FabricObject {
  id?: string;
  type?: string;
  left?: number;
  top?: number;
  [key: string]: any;
}

// Tool execution result type
export interface TextToolResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    executionTime?: number;
    changedObjects?: string[];
    [key: string]: any;
  };
}
  