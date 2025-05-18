import { fabric } from 'fabric';

// Canvas dimensions
export interface CanvasDimensions {
  width: number;
  height: number;
}

// Canvas object types
export enum CanvasObjectType {
  Text = 'text',
  Image = 'image',
  Background = 'background',
  Shape = 'shape',
}

// Retouchr asset content
export interface RetouchrAsset {
  id: string;
  name: string;
  dimensions: CanvasDimensions;
  fabricCanvas?: FabricCanvasData;
  lastSavedAt?: string;
  lastSavedBy?: string;
  usedImages?: string[];
}

// Fabric.js canvas data structure
export interface FabricCanvasData {
  version?: string;
  objects?: any[];
  background?: string;
  width?: number;
  height?: number;
}

// Tool definition
export interface Tool {
  id: string;
  name: string;
  icon: React.ReactNode;
  component: React.ComponentType;
}

// Export options
export interface ExportOptions {
  format: 'png' | 'jpeg';
  quality?: number;
  name?: string;
  backgroundColor?: string;
}

// History entry for undo/redo
export interface HistoryEntry {
  id: string;
  canvasData: string;
  timestamp: number;
  label?: string;
}

// Selection properties structure
export interface SelectionProperties {
  hasSelection: boolean;
  type?: string;
  multiple?: boolean;
  properties?: Record<string, any>;
}

// Version history entry
export interface VersionHistoryEntry {
  id: string;
  versionNumber: string;
  createdAt: string;
  createdBy: string;
  notes?: string;
}
