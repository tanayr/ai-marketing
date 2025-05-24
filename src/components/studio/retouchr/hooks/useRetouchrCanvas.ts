'use client';

import { useContext } from 'react';
import { CanvasContext, CanvasContextType } from './use-canvas';

interface RetouchrCanvasData {
  canvas: any | null;
  selectedObjects: any[];
  canvasReady: boolean;
}

export function useRetouchrCanvas(): RetouchrCanvasData {
  const context = useContext(CanvasContext);
  
  if (!context) {
    // Return default values if context is not available
    return {
      canvas: null,
      selectedObjects: [],
      canvasReady: false
    };
  }

  const { canvas, selectedObjects }: CanvasContextType = context;

  return {
    canvas,
    selectedObjects,
    canvasReady: !!canvas
  };
}
