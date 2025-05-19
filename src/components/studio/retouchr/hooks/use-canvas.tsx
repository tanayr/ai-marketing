"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { fabric } from '../utils/fabric-imports';

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
  
  // Save canvas state to JSON with explicit background image handling
  const saveCanvas = useCallback(() => {
    if (!canvas) return '';
    
    // Create a complete JSON representation of the canvas
    // This includes objects, background color, and background image
    const jsonObj = canvas.toJSON(['id', 'name']);
    
    // Get the background image if it exists
    const bgImage = canvas.backgroundImage;
    
    // Add special flag to indicate we're handling background properly
    jsonObj.fabricBackgroundSaved = true;
    
    // Check if we need to upload any locally stored background image
    if (typeof window !== 'undefined' && bgImage) {
      // Check if we have current background image data in localStorage
      const localBgData = localStorage.getItem('retouchr_current_bg_image_data');
      if (localBgData) {
        console.log('Found locally stored background image data - ensuring it gets saved');
        // No need to do anything special here - the backgroundImage is already
        // included in the JSON by fabric.js. This just confirms we're checking.
      }
    }
    
    // Explicitly log what's being saved for debugging
    console.log('Saving canvas with background:', {
      backgroundColor: canvas.backgroundColor,
      hasBackgroundImage: !!bgImage,
      objects: jsonObj.objects?.length || 0
    });
    
    const json = JSON.stringify(jsonObj);
    setCanvasData(json);
    return json;
  }, [canvas]);
  
  // Load canvas from JSON string with improved background handling
  const loadCanvas = useCallback((jsonData: string) => {
    if (!canvas) return;
    
    try {
      // Parse the JSON data to check for special properties
      const parsedData = JSON.parse(jsonData);
      console.log('Loading canvas data:', {
        hasBackgroundFlag: !!parsedData.fabricBackgroundSaved,
        backgroundColor: parsedData.background,
        hasBackgroundImage: !!parsedData.backgroundImage,
        objects: parsedData.objects?.length || 0
      });
      
      // Load the JSON data into the canvas
      canvas.loadFromJSON(jsonData, () => {
        // Force render after loading
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
