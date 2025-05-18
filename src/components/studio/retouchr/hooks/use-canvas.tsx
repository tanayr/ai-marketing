"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { fabric } from 'fabric';

// Define Canvas context type
export interface CanvasContextType {
  canvas: fabric.Canvas | null;
  setCanvas: (canvas: fabric.Canvas) => void;
  selectedObjects: fabric.Object[];
  clearSelection: () => void;
  canvasData: string | null;
  saveCanvas: () => string;
  loadCanvas: (jsonData: string) => void;
  isSaving: boolean;
  setIsSaving: (value: boolean) => void;
}

// Create context with default values
const CanvasContext = createContext<CanvasContextType | null>(null);

// Provider component
export const CanvasProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  // Canvas state
  const [canvas, setCanvasInstance] = useState<fabric.Canvas | null>(null);
  const [selectedObjects, setSelectedObjects] = useState<fabric.Object[]>([]);
  const [canvasData, setCanvasData] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Set canvas and register event listeners
  const setCanvas = useCallback((canvas: fabric.Canvas) => {
    setCanvasInstance(canvas);
    
    // Set up event listeners for selection changes
    canvas.on('selection:created', () => {
      setSelectedObjects(canvas.getActiveObjects());
    });
    
    canvas.on('selection:updated', () => {
      setSelectedObjects(canvas.getActiveObjects());
    });
    
    canvas.on('selection:cleared', () => {
      setSelectedObjects([]);
    });
  }, []);
  
  // Clear current selection
  const clearSelection = useCallback(() => {
    if (canvas) {
      canvas.discardActiveObject();
      canvas.renderAll();
      setSelectedObjects([]);
    }
  }, [canvas]);
  
  // Save canvas state to JSON
  const saveCanvas = useCallback(() => {
    if (!canvas) return '';
    
    const json = JSON.stringify(canvas.toJSON(['id', 'name']));
    setCanvasData(json);
    return json;
  }, [canvas]);
  
  // Load canvas from JSON string
  const loadCanvas = useCallback((jsonData: string) => {
    if (!canvas) return;
    
    try {
      canvas.loadFromJSON(jsonData, () => {
        canvas.renderAll();
        setCanvasData(jsonData);
        setSelectedObjects([]);
      });
    } catch (error) {
      console.error('Error loading canvas data:', error);
    }
  }, [canvas]);

  // Context value
  const value = {
    canvas,
    setCanvas,
    selectedObjects,
    clearSelection,
    canvasData,
    saveCanvas,
    loadCanvas,
    isSaving,
    setIsSaving
  };
  
  return (
    <CanvasContext.Provider value={value}>
      {children}
    </CanvasContext.Provider>
  );
};

// Hook for consuming the canvas context
export const useCanvas = () => {
  const context = useContext(CanvasContext);
  if (!context) {
    throw new Error('useCanvas must be used within a CanvasProvider');
  }
  return context;
};
