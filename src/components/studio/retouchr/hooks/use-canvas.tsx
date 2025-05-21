"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { fabric } from '../utils/fabric-imports';

// Define Canvas context type
// Define a more comprehensive FabricCanvas type that includes all methods we use
interface ExtendedFabricCanvas extends fabric.Canvas {
  discardActiveObject: () => fabric.Canvas;
  backgroundImage: any;
  backgroundColor: any;
  setBackgroundColor: (color: string, callback?: Function) => fabric.Canvas;
}

export interface CanvasContextType {
  canvas: ExtendedFabricCanvas | null;
  setCanvas: (canvas: ExtendedFabricCanvas) => void;
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
  const [canvas, setCanvasInstance] = useState<ExtendedFabricCanvas | null>(null);
  const [selectedObjects, setSelectedObjects] = useState<fabric.Object[]>([]);
  const [canvasData, setCanvasData] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Set canvas and register event listeners
  const setCanvas = useCallback((canvas: fabric.Canvas) => {
    // Cast to our extended type to satisfy TypeScript
    const extendedCanvas = canvas as ExtendedFabricCanvas;
    setCanvasInstance(extendedCanvas);
    
    // Set up event listeners for selection changes
    extendedCanvas.on('selection:created', () => {
      setSelectedObjects(extendedCanvas.getActiveObjects());
    });
    
    extendedCanvas.on('selection:updated', () => {
      setSelectedObjects(extendedCanvas.getActiveObjects());
    });
    
    extendedCanvas.on('selection:cleared', () => {
      setSelectedObjects([]);
    });
  }, []);
  
  // Clear current selection
  const clearSelection = useCallback(() => {
    if (canvas) {
      // The canvas instance has the discardActiveObject method at runtime
      canvas.discardActiveObject();
      canvas.renderAll();
      setSelectedObjects([]);
    }
  }, [canvas]);
  
  // Save canvas state to JSON with explicit background image handling and dimensions
  const saveCanvas = useCallback(() => {
    if (!canvas) return '';
    
    // Create a complete JSON representation of the canvas
    // This includes objects, background color, and background image
    const jsonObj = canvas.toJSON(['id', 'name']);
    
    // Explicitly save canvas dimensions
    // This ensures width and height are preserved even if fabric.toJSON() doesn't include them
    jsonObj.width = canvas.width;
    jsonObj.height = canvas.height;
    
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
    console.log('Saving canvas with dimensions and background:', {
      width: jsonObj.width,
      height: jsonObj.height,
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
      
      // Pre-process the objects to ensure they have proper types
      if (parsedData.objects) {
        parsedData.objects.forEach((obj: any) => {
          // Log enhanced text objects for debugging
          if (obj.type === 'enhanced-text') {
            console.log('Found enhanced text to load:', {
              text: obj.text,
              padding: obj.padding,
              borderRadius: obj.borderRadius
            });
          }
        });
      }
      
      // Clear the canvas before loading
      canvas.clear();
      
      // Load the JSON data into the canvas with a retry mechanism
      try {
        canvas.loadFromJSON(parsedData, () => {
          console.log('Canvas loaded successfully');
          // Force render after loading
          canvas.renderAll();
          
          setCanvasData(jsonData);
          setSelectedObjects([]);
        });
      } catch (loadError) {
        console.error('Error in loadFromJSON:', loadError);
        // Try a different approach if the first one fails
        try {
          // Create objects manually if loadFromJSON fails
          if (parsedData.backgroundColor) {
            canvas.setBackgroundColor(parsedData.backgroundColor, () => {});
          }
          
          // Add each object individually
          if (parsedData.objects && Array.isArray(parsedData.objects)) {
            parsedData.objects.forEach((obj: any) => {
              try {
                if (obj.type === 'image') {
                  // Handle image objects
                  fabric.Image.fromURL(obj.src, (img: any) => {
                    delete obj.src;
                    img.set(obj);
                    canvas.add(img);
                    canvas.renderAll();
                  });
                } else if (obj.type === 'enhanced-text') {
                  // Handle enhanced text objects
                  try {
                    // Import the EnhancedText class
                    const { EnhancedText } = require('../utils/enhanced-text');
                    
                    // Create a new EnhancedText instance
                    const text = new EnhancedText(obj.text, {
                      ...obj,
                      padding: obj.padding || 0,
                      borderRadius: obj.borderRadius || 0
                    });
                    
                    canvas.add(text);
                    canvas.renderAll();
                    console.log('Enhanced text added manually:', text);
                  } catch (textErr) {
                    console.error('Error adding enhanced text:', textErr);
                    // Fallback to regular text
                    const text = new fabric.Text(obj.text, obj);
                    canvas.add(text);
                  }
                } else {
                  // Handle standard text objects
                  if (obj.type === 'text' || obj.type === 'i-text') {
                    const text = new fabric.Text(obj.text, obj);
                    canvas.add(text);
                  }
                }
                // Handle other object types as needed
              } catch (objError) {
                console.error('Error adding object:', objError);
              }
            });
          }
          
          canvas.renderAll();
        } catch (fallbackError) {
          console.error('Fallback loading also failed:', fallbackError);
        }
      }
    } catch (error) {
      console.error('Error loading canvas data:', error);
    }
  }, [canvas]);

  // Context value
  const value: CanvasContextType = {
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
