'use client';

import { useContext } from 'react';
import { CanvasContext, CanvasContextType } from './use-canvas';

interface RetouchrCanvasData {
  canvas: any | null;
  selectedObjects: any[];
  selectedObject: any | null;
  canvasReady: boolean;
}

export function useRetouchrCanvas(): RetouchrCanvasData {
  const context = useContext(CanvasContext);
  
  if (!context) {
    // Return default values if context is not available
    return {
      canvas: null,
      selectedObjects: [],
      selectedObject: null,
      canvasReady: false
    };
  }

  const { canvas, selectedObjects }: CanvasContextType = context;

  return {
    canvas,
    selectedObjects,
    selectedObject: selectedObjects && selectedObjects.length > 0 ? selectedObjects[0] : null,
    canvasReady: !!canvas
  };
}
