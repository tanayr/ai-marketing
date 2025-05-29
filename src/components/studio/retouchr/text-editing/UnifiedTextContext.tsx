"use client";

import React, { createContext, useContext, useState, useCallback, PropsWithChildren, useEffect } from 'react';
import { useCanvas } from '../hooks/use-canvas';
import { TextShadow, TextOutline, TextGradient } from '../utils/text-extensions';
import { fabric } from '../utils/fabric-imports';
import { calculateToolbarPosition } from './utils/position-utils';

// Unified text properties interface
export interface UnifiedTextProperties {
  // Basic text properties
  text: string;
  fontFamily: string;
  fontSize: number;
  fill: string;
  backgroundColor?: string;
  fontWeight: string;
  fontStyle: string;
  underline: boolean;
  lineHeight: number;
  charSpacing: number;
  textAlign: string;
  
  // Enhanced text properties
  padding: number;
  borderRadius: number;
  
  // Advanced text properties
  textShadow?: TextShadow;
  textOutline?: TextOutline;
  textGradient?: TextGradient;
  letterSpacing: number;
  textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
}

// Default text properties
const defaultTextProperties: UnifiedTextProperties = {
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
  letterSpacing: 0,
  textTransform: 'none',
  textShadow: undefined,
  textOutline: undefined,
  textGradient: undefined
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
export interface UnifiedTextContextType {
  // Text properties
  textProperties: UnifiedTextProperties;
  updateTextProperty: <K extends keyof UnifiedTextProperties>(
    property: K,
    value: UnifiedTextProperties[K]
  ) => void;
  resetTextProperties: () => void;
  
  // Toolbar position
  toolbarPosition: ToolbarPosition;
  updateToolbarPosition: (object?: fabric.Object) => void;
  
  // Edit mode
  editMode: TextEditMode;
  setEditMode: (mode: TextEditMode) => void;
  
  // Text operations
  addNewText: (preset?: Partial<UnifiedTextProperties>) => void;
  startTextEditing: (textObject: fabric.Object) => void;
  applyTextPreset: (properties: Partial<UnifiedTextProperties>) => void;
  
  // Utility methods
  hasTextEffects: (textObject?: fabric.IText) => boolean;
  getActiveText: () => fabric.IText | null;
}

// Create context
const UnifiedTextContext = createContext<UnifiedTextContextType | null>(null);

// Provider component
export const UnifiedTextProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const { canvas, selectedObjects } = useCanvas();
  
  // State
  const [textProperties, setTextProperties] = useState<UnifiedTextProperties>(defaultTextProperties);
  const [toolbarPosition, setToolbarPosition] = useState<ToolbarPosition>({ top: 0, left: 0, visible: false });
  const [editMode, setEditMode] = useState<TextEditMode>('none');
  
  // Update text property - single method for all properties
  const updateTextProperty = useCallback(<K extends keyof UnifiedTextProperties>(
    property: K,
    value: UnifiedTextProperties[K]
  ) => {
    setTextProperties(prev => ({ ...prev, [property]: value }));
    
    // Update active object if it's a text
    if (canvas && canvas.getActiveObject()?.type?.includes('text')) {
      // To properly handle this with TypeScript, we need to type the object correctly
      // The fabric.IText interface lacks the 'set' method in TypeScript definitions
      // but it exists at runtime in the actual fabric.js library
      const activeObject = canvas.getActiveObject() as any;
      
      // Now we can safely call set
      if (activeObject && typeof activeObject.set === 'function') {
        activeObject.set(property as string, value);
      }
      
      // Special handling for properties that need refresh
      const needsRefresh = [
        'padding', 'borderRadius', 'backgroundColor', 
        'textShadow', 'textOutline', 'textGradient',
        'letterSpacing', 'textTransform'
      ].includes(property as string);
      
      if (needsRefresh && activeObject.refreshObject) {
        activeObject.refreshObject();
      } else {
        canvas.renderAll();
      }
    }
  }, [canvas]);
  
  // Reset text properties
  const resetTextProperties = useCallback(() => {
    setTextProperties(defaultTextProperties);
  }, []);
  
  // Update toolbar position
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
  const addNewText = useCallback((preset?: Partial<UnifiedTextProperties>) => {
    if (!canvas) return;
    
    // Combine default properties with preset
    const properties = { ...defaultTextProperties, ...preset };
    
    // Create new text object
    const text = new fabric.IText(properties.text || 'Add text', properties);
    
    // Position in center of canvas
    const canvasCenter = canvas.getCenter();
    text.set({
      left: canvasCenter.left,
      top: canvasCenter.top,
      originX: 'center',
      originY: 'center',
    });
    
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
    
    // Update context with the new properties
    setTextProperties(properties);
    setEditMode('selecting');
    updateToolbarPosition(text);
  }, [canvas, updateToolbarPosition]);
  
  // Start text editing
  const startTextEditing = useCallback((textObject: fabric.Object) => {
    if (!canvas || !textObject || !textObject.type?.includes('text')) return;
    
    // Double cast to avoid TypeScript errors with our enhanced IText properties
    const text = textObject as any as fabric.IText;
    
    // Extract text properties
    const extractedProps: UnifiedTextProperties = {
      text: text.text || 'Text',
      fontFamily: text.fontFamily || 'Arial',
      fontSize: text.fontSize || 24,
      fill: text.fill as string || '#000000',
      backgroundColor: (text as any).backgroundColor as string,
      fontWeight: text.fontWeight || 'normal',
      fontStyle: (text as any).fontStyle || 'normal',
      underline: (text as any).underline || false,
      lineHeight: (text as any).lineHeight || 1.16,
      charSpacing: (text as any).charSpacing || 0,
      textAlign: text.textAlign || 'left',
      padding: text.padding || 0,
      borderRadius: text.borderRadius || 0,
      letterSpacing: text.letterSpacing || 0,
      textTransform: text.textTransform || 'none',
      textShadow: text.textShadow,
      textOutline: text.textOutline,
      textGradient: text.textGradient
    };
    
    // Update context with current properties
    setTextProperties(extractedProps);
    
    // Enter edit mode
    canvas.setActiveObject(text as any);
    (text as any).enterEditing?.();
    (text as any).selectAll?.();
    canvas.renderAll();
    
    setEditMode('editing');
    updateToolbarPosition(text as any);
  }, [canvas, updateToolbarPosition]);
  
  // Apply text preset
  const applyTextPreset = useCallback((properties: Partial<UnifiedTextProperties>) => {
    if (!canvas) return;
    
    const activeObject = canvas.getActiveObject();
    if (!activeObject || !activeObject.type?.includes('text')) return;
    
    // Double cast to avoid TypeScript errors with our enhanced IText
    const text = activeObject as any as fabric.IText;
    
    // Apply all properties
    Object.entries(properties).forEach(([key, value]) => {
      (text as any).set?.(key, value);
    });
    
    // Refresh object
    if (text.refreshObject) {
      text.refreshObject();
    } else {
      canvas.renderAll();
    }
    
    // Update context properties
    setTextProperties(prev => ({ ...prev, ...properties }));
  }, [canvas]);
  
  // Check if text has effects
  const hasTextEffects = useCallback((textObject?: fabric.IText) => {
    const text = textObject || getActiveText();
    if (!text) return false;
    
    return !!(
      text.textShadow || 
      text.textOutline || 
      text.textGradient ||
      text.padding > 0 ||
      text.borderRadius > 0 ||
      text.letterSpacing !== 0 ||
      text.textTransform !== 'none'
    );
  }, []);
  
  // Get active text object
  const getActiveText = useCallback(() => {
    if (!canvas) return null;
    
    const activeObject = canvas.getActiveObject();
    if (!activeObject || !activeObject.type?.includes('text')) return null;
    
    return activeObject as any as fabric.IText;
  }, [canvas]);
  
  // Update properties when selection changes
  useEffect(() => {
    if (!canvas) return;
    
    const handleSelectionChanged = () => {
      const activeObject = canvas.getActiveObject();
      
      if (activeObject && activeObject.type?.includes('text')) {
        // Extract properties from the selected text
        const text = activeObject as any as fabric.IText;
        
        const extractedProps: UnifiedTextProperties = {
          text: text.text || 'Text',
          fontFamily: text.fontFamily || 'Arial',
          fontSize: text.fontSize || 24,
          fill: text.fill as string || '#000000',
          backgroundColor: (text as any).backgroundColor as string,
          fontWeight: text.fontWeight || 'normal',
          fontStyle: (text as any).fontStyle || 'normal',
          underline: (text as any).underline || false,
          lineHeight: (text as any).lineHeight || 1.16,
          charSpacing: (text as any).charSpacing || 0,
          textAlign: text.textAlign || 'left',
          padding: text.padding || 0,
          borderRadius: text.borderRadius || 0,
          letterSpacing: text.letterSpacing || 0,
          textTransform: text.textTransform || 'none',
          textShadow: text.textShadow,
          textOutline: text.textOutline,
          textGradient: text.textGradient
        };
        
        setTextProperties(extractedProps);
        setEditMode('selecting');
        updateToolbarPosition(text as any);
      } else {
        // No text selected
        setEditMode('none');
        setToolbarPosition({ top: 0, left: 0, visible: false });
      }
    };
    
    // Add event listeners
    canvas.on('selection:created', handleSelectionChanged);
    canvas.on('selection:updated', handleSelectionChanged);
    canvas.on('selection:cleared', handleSelectionChanged);
    
    // Cleanup
    return () => {
      canvas.off('selection:created', handleSelectionChanged);
      canvas.off('selection:updated', handleSelectionChanged);
      canvas.off('selection:cleared', handleSelectionChanged);
    };
  }, [canvas, updateToolbarPosition]);
  
  // Provide context value
  const value: UnifiedTextContextType = {
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
    hasTextEffects,
    getActiveText
  };
  
  return (
    <UnifiedTextContext.Provider value={value}>
      {children}
    </UnifiedTextContext.Provider>
  );
};

// Custom hook for using the context
export const useUnifiedText = () => {
  const context = useContext(UnifiedTextContext);
  if (!context) {
    throw new Error('useUnifiedText must be used within a UnifiedTextProvider');
  }
  return context;
};

export default UnifiedTextContext;
