"use client";

import React, { createContext, useContext, useState, useCallback, PropsWithChildren, useEffect } from 'react';
import { useCanvas } from '../hooks/use-canvas';
import { FabricTextProperties } from '../toolbar/text-tool-fabric-utils';
import { fabric } from '../utils/fabric-imports';
import { EnhancedText } from '../utils/enhanced-text';
import { calculateToolbarPosition } from './utils/position-utils';

// Default text properties
const defaultTextProperties: Partial<FabricTextProperties> = {
  text: 'Add your text',
  fontFamily: 'Arial',
  fontSize: 24,
  fill: '#000000',
  backgroundColor: undefined,
  fontWeight: 'normal',
  fontStyle: 'normal',
  underline: false,
  lineHeight: 1.16,
  charSpacing: 0,
  textAlign: 'left',
  padding: 0,
  borderRadius: 0,
};

// Text edit mode type
export type TextEditMode = 'none' | 'selecting' | 'editing';

// Toolbar position type
export interface ToolbarPosition {
  top: number;
  left: number;
  visible: boolean;
}

// Context type
export interface TextFormattingContextType {
  // Text properties
  textProperties: Partial<FabricTextProperties>;
  updateTextProperty: <K extends keyof FabricTextProperties>(
    property: K,
    value: FabricTextProperties[K]
  ) => void;
  resetTextProperties: () => void;
  
  // Toolbar position
  toolbarPosition: ToolbarPosition;
  updateToolbarPosition: (object?: fabric.Object) => void;
  
  // Edit mode
  editMode: TextEditMode;
  setEditMode: (mode: TextEditMode) => void;
  
  // Text operations
  addNewText: (preset?: Partial<FabricTextProperties>) => void;
  startTextEditing: (textObject: fabric.Object) => void;
  applyTextPreset: (properties: Partial<FabricTextProperties>) => void;
}

// Create context
const TextFormattingContext = createContext<TextFormattingContextType | null>(null);

// Provider component
export const TextFormattingProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const { canvas, selectedObjects } = useCanvas();
  
  // State
  const [textProperties, setTextProperties] = useState<Partial<FabricTextProperties>>(defaultTextProperties);
  const [toolbarPosition, setToolbarPosition] = useState<ToolbarPosition>({ top: 0, left: 0, visible: false });
  const [editMode, setEditMode] = useState<TextEditMode>('none');
  
  // Update text property
  const updateTextProperty = useCallback(<K extends keyof FabricTextProperties>(
    property: K,
    value: FabricTextProperties[K]
  ) => {
    setTextProperties(prev => ({ ...prev, [property]: value }));
    
    // Also update active object if it's a text
    if (canvas && canvas.getActiveObject()?.type?.includes('text')) {
      const activeObject = canvas.getActiveObject() as any;
      
      // Check if we need to convert to EnhancedText for padding or borderRadius support
      const needsConversion = 
        activeObject.type !== 'enhanced-text' && 
        (property === 'padding' || property === 'borderRadius') && 
        value !== 0;
      
      if (needsConversion) {
        // We need to convert to EnhancedText to support these features
        const currentProps = {
          text: activeObject.text,
          left: activeObject.left,
          top: activeObject.top,
          fontFamily: activeObject.fontFamily,
          fontSize: activeObject.fontSize,
          fill: activeObject.fill,
          backgroundColor: activeObject.backgroundColor,
          fontWeight: activeObject.fontWeight,
          fontStyle: activeObject.fontStyle,
          underline: activeObject.underline,
          lineHeight: activeObject.lineHeight,
          charSpacing: activeObject.charSpacing,
          textAlign: activeObject.textAlign,
          angle: activeObject.angle,
          scaleX: activeObject.scaleX,
          scaleY: activeObject.scaleY,
          originX: activeObject.originX,
          originY: activeObject.originY,
          [property]: value // Include the updated property
        };
        
        // Create new EnhancedText object
        const enhancedText = new EnhancedText(currentProps.text, currentProps as any);
        
        // Replace the old object with the new one
        canvas.remove(activeObject);
        canvas.add(enhancedText as unknown as fabric.Object);
        canvas.setActiveObject(enhancedText as unknown as fabric.Object);
      } else {
        // Just update the property normally
        activeObject.set(property, value);
        
        // For padding, borderRadius, and backgroundColor, we need to ensure proper updates
        if (property === 'padding' || property === 'borderRadius' || property === 'backgroundColor') {
          // Use _refreshObject method if available (for EnhancedText objects)
          if (typeof (activeObject as any)._refreshObject === 'function') {
            (activeObject as any)._refreshObject();
          } else {
            // Fallback for non-EnhancedText objects
            // Force recalculation by updating a core property and then setting it back
            const currentWidth = activeObject.width;
            activeObject.set('width', currentWidth + 0.1);
            activeObject.set('width', currentWidth);
            
            // Apply a micro-scale to force a redraw
            const currentScaleX = activeObject.scaleX || 1;
            const currentScaleY = activeObject.scaleY || 1;
            activeObject.set('scaleX', currentScaleX * 1.00001);
            activeObject.set('scaleY', currentScaleY * 1.00001);
            
            // Force dirty state to ensure redraw
            activeObject.dirty = true;
            
            // Set cache as dirty to regenerate
            if (typeof activeObject.setCacheAsDirty === 'function') {
              activeObject.setCacheAsDirty();
            }
          }
          
          // For background color specifically being removed/set to transparent
          if (property === 'backgroundColor' && (value === undefined || value === null || value === 'transparent')) {
            // Additional force redraw for transparent background cases
            activeObject.setCoords();
          }
          
          // For padding being reduced or removed
          if (property === 'padding' && (typeof value === 'number' && (value === 0 || (activeObject.padding && value < activeObject.padding)))) {
            // Force object dimensions to update
            activeObject.setCoords();
            // For enhanced text objects, call additional methods if available
            if (activeObject.type === 'enhanced-text') {
              // Trigger a size recalculation
              activeObject.initDimensions?.();
            }
          }
        }
      }
      
      canvas.renderAll();
    }
  }, [canvas]);
  
  // Reset text properties
  const resetTextProperties = useCallback(() => {
    setTextProperties(defaultTextProperties);
  }, []);
  
  // Update toolbar visibility
  const updateToolbarPosition = useCallback((object?: fabric.Object) => {
    if (!canvas) {
      setToolbarPosition({ top: 0, left: 0, visible: false });
      return;
    }
    
    const targetObject = object || canvas.getActiveObject();
    
    if (!targetObject || !targetObject.type?.includes('text')) {
      setToolbarPosition({ top: 0, left: 0, visible: false });
      return;
    }
    
    // Since the toolbar is now fixed at the top, we only care about the visibility
    setToolbarPosition({ top: 0, left: 0, visible: true });
  }, [canvas]);
  
  // Add new text
  const addNewText = useCallback((preset?: Partial<FabricTextProperties>) => {
    if (!canvas) return;
    
    // Merge default with preset
    const props = { ...defaultTextProperties, ...preset };
    
    // Get canvas dimensions
    const canvasWidth = (canvas as any).width || 800;
    const canvasHeight = (canvas as any).height || 600;
    
    // Create text object
    const text = new fabric.IText(props.text || 'Add your text', {
      left: canvasWidth / 2,
      top: canvasHeight / 2,
      originX: 'center',
      originY: 'center',
      ...props,
    });
    
    // Add to canvas
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
    
    // Enter edit mode
    startTextEditing(text);
  }, [canvas]);
  
  // Start text editing
  const startTextEditing = useCallback((textObject: fabric.Object) => {
    if (!canvas || !textObject) return;
    
    // Make sure it's a text object
    if (!textObject.type?.includes('text')) return;
    
    // Cast to any since we know it's an editable text object but TypeScript doesn't
    const iText = textObject as any;
    
    // Enter edit mode
    setEditMode('editing');
    updateToolbarPosition(textObject);
    
    // Start editing - check for function existence before calling
    if (typeof iText.enterEditing === 'function') {
      iText.enterEditing();
      if (typeof iText.selectAll === 'function') {
        iText.selectAll();
      }
    }
  }, [canvas, updateToolbarPosition]);
  
  // Apply text preset
  const applyTextPreset = useCallback((properties: Partial<FabricTextProperties>) => {
    // Update local state
    setTextProperties(prev => ({ ...prev, ...properties }));
    
    // Update selected text if available
    if (canvas && canvas.getActiveObject()?.type?.includes('text')) {
      const activeObject = canvas.getActiveObject() as any;
      
      // Check if the active object is not an EnhancedText but requires padding or borderRadius
      const needsConversion = 
        activeObject.type !== 'enhanced-text' && 
        (properties.padding !== undefined || properties.borderRadius !== undefined);
      
      if (needsConversion) {
        // We need to convert to EnhancedText to support these features
        const currentProps = {
          text: activeObject.text,
          left: activeObject.left,
          top: activeObject.top,
          fontFamily: activeObject.fontFamily,
          fontSize: activeObject.fontSize,
          fill: activeObject.fill,
          backgroundColor: activeObject.backgroundColor,
          fontWeight: activeObject.fontWeight,
          fontStyle: activeObject.fontStyle,
          underline: activeObject.underline,
          lineHeight: activeObject.lineHeight,
          charSpacing: activeObject.charSpacing,
          textAlign: activeObject.textAlign,
          angle: activeObject.angle,
          scaleX: activeObject.scaleX,
          scaleY: activeObject.scaleY,
          originX: activeObject.originX,
          originY: activeObject.originY,
          ...properties // Include the new properties
        };
        
        // Create new EnhancedText object
        const enhancedText = new EnhancedText(currentProps.text, currentProps as any);
        
        // Replace the old object with the new one
        canvas.remove(activeObject);
        canvas.add(enhancedText as unknown as fabric.Object);
        canvas.setActiveObject(enhancedText as unknown as fabric.Object);
      } else {
        // Just update properties normally
        Object.entries(properties).forEach(([key, value]) => {
          activeObject.set(key, value);
        });
        
        // Check if padding or borderRadius properties are being updated
        const hasPaddingChange = properties.padding !== undefined;
        const hasBorderRadiusChange = properties.borderRadius !== undefined;
        
        // Force recalculation if needed
        if (hasPaddingChange || hasBorderRadiusChange) {
          // Force recalculation by updating a core property and then setting it back
          const currentWidth = activeObject.width;
          activeObject.set('width', currentWidth + 0.1);
          activeObject.set('width', currentWidth);
          
          // Force dirty state to ensure redraw
          activeObject.dirty = true;
          
          // Set cache as dirty to regenerate
          if (typeof activeObject.setCacheAsDirty === 'function') {
            activeObject.setCacheAsDirty();
          }
        }
      }
      
      canvas.renderAll();
    }
  }, [canvas]);

  // Listen for object selection changes to update toolbar
  useEffect(() => {
    if (!canvas) return;
    
    const handleSelectionCreated = (e: any) => {
      const selectedObj = e.selected?.[0];
      if (selectedObj?.type?.includes('text')) {
        setEditMode('selecting');
        updateToolbarPosition(selectedObj);
        
        // Update text properties based on selected object
        if (selectedObj) {
          const textObj = selectedObj as any;
          setTextProperties({
            text: textObj.text || 'Text',
            fontFamily: textObj.fontFamily || defaultTextProperties.fontFamily,
            fontSize: textObj.fontSize || defaultTextProperties.fontSize,
            fill: textObj.fill || defaultTextProperties.fill,
            backgroundColor: textObj.backgroundColor,
            fontWeight: textObj.fontWeight || defaultTextProperties.fontWeight,
            fontStyle: textObj.fontStyle || defaultTextProperties.fontStyle,
            underline: textObj.underline || defaultTextProperties.underline,
            lineHeight: textObj.lineHeight || defaultTextProperties.lineHeight,
            charSpacing: textObj.charSpacing || defaultTextProperties.charSpacing,
            textAlign: textObj.textAlign || defaultTextProperties.textAlign,
            padding: textObj.padding || defaultTextProperties.padding,
            borderRadius: textObj.borderRadius || defaultTextProperties.borderRadius,
          });
        }
      }
    };
    
    const handleSelectionCleared = () => {
      setEditMode('none');
      setToolbarPosition({ top: 0, left: 0, visible: false });
    };
    
    const handleObjectModified = (e: any) => {
      const modifiedObj = e.target;
      if (modifiedObj?.type?.includes('text') && editMode !== 'none') {
        updateToolbarPosition(modifiedObj);
      }
    };
    
    const handleMouseDown = (e: any) => {
      // Check if we're clicking on a text object for direct editing
      const clickedObj = e.target;
      if (clickedObj?.type?.includes('text') && e.e.detail === 2) { // Double click
        startTextEditing(clickedObj);
      }
    };
    
    // Register event listeners
    canvas.on('selection:created', handleSelectionCreated);
    canvas.on('selection:updated', handleSelectionCreated); 
    canvas.on('selection:cleared', handleSelectionCleared);
    canvas.on('object:modified', handleObjectModified);
    canvas.on('mouse:down', handleMouseDown);
    
    // Clean up event listeners
    return () => {
      canvas.off('selection:created', handleSelectionCreated);
      canvas.off('selection:updated', handleSelectionCreated);
      canvas.off('selection:cleared', handleSelectionCleared);
      canvas.off('object:modified', handleObjectModified);
      canvas.off('mouse:down', handleMouseDown);
    };
  }, [canvas, updateToolbarPosition, editMode, startTextEditing, defaultTextProperties]);
  
  // Context value
  const value: TextFormattingContextType = {
    textProperties,
    updateTextProperty,
    resetTextProperties,
    toolbarPosition,
    updateToolbarPosition,
    editMode,
    setEditMode,
    addNewText,
    startTextEditing,
    applyTextPreset,
  };
  
  return (
    <TextFormattingContext.Provider value={value}>
      {children}
    </TextFormattingContext.Provider>
  );
};

// Custom hook to use the context
export const useTextFormatting = () => {
  const context = useContext(TextFormattingContext);
  if (!context) {
    throw new Error('useTextFormatting must be used within a TextFormattingProvider');
  }
  return context;
};
