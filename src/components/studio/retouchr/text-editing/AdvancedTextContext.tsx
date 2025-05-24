"use client";

import React, { createContext, useContext, useState, useCallback, PropsWithChildren } from 'react';
import { useCanvas } from '../hooks/use-canvas';
import { FabricTextProperties } from '../toolbar/text-tool-fabric-utils';
import { fabric } from '../utils/fabric-imports';
import { AdvancedText, TextShadow, TextOutline, TextGradient } from '../utils/advanced-text-effects';

// Extended properties for advanced text
export interface AdvancedTextProperties extends Partial<FabricTextProperties> {
  textShadow?: TextShadow;
  textOutline?: TextOutline;
  textGradient?: TextGradient;
  letterSpacing?: number;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  padding?: number;
  borderRadius?: number;
}

// Default advanced text properties
const defaultAdvancedTextProperties: AdvancedTextProperties = {
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
  textGradient: undefined,
};

// Context type
export interface AdvancedTextContextType {
  // Advanced text properties
  textProperties: AdvancedTextProperties;
  updateTextProperty: <K extends keyof AdvancedTextProperties>(
    property: K,
    value: AdvancedTextProperties[K]
  ) => void;
  updateAdvancedProperty: (property: string, value: any) => void;
  resetTextProperties: () => void;
  
  // Text operations
  addNewAdvancedText: (preset?: AdvancedTextProperties) => void;
  convertToAdvancedText: (textObject: fabric.Object) => void;
  applyAdvancedPreset: (properties: AdvancedTextProperties) => void;
  
  // Utility methods
  isAdvancedText: (object: fabric.Object) => boolean;
  getActiveAdvancedText: () => AdvancedText | null;
}

// Create context
const AdvancedTextContext = createContext<AdvancedTextContextType | null>(null);

// Provider component
export const AdvancedTextProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const { canvas } = useCanvas();
  
  // State
  const [textProperties, setTextProperties] = useState<AdvancedTextProperties>(defaultAdvancedTextProperties);
  
  // Update text property
  const updateTextProperty = useCallback(<K extends keyof AdvancedTextProperties>(
    property: K,
    value: AdvancedTextProperties[K]
  ) => {
    setTextProperties(prev => ({ ...prev, [property]: value }));
    
    // Update active object if it's an advanced text
    if (canvas && canvas.getActiveObject()) {
      const activeObject = canvas.getActiveObject();
      
      if (isAdvancedText(activeObject)) {
        const advancedText = activeObject as AdvancedText;
        
        // Update the property
        (advancedText as any)[property] = value;
        
        // Force refresh
        advancedText._refreshObject();
      } else if (activeObject && activeObject.type?.includes('text')) {
        // Convert to advanced text if property requires it
        const requiresAdvanced = [
          'textShadow', 'textOutline', 'textGradient', 
          'letterSpacing', 'textTransform', 'padding', 'borderRadius'
        ].includes(property as string);
        
        if (requiresAdvanced) {
          convertToAdvancedText(activeObject);
          // Re-apply the property after conversion
          setTimeout(() => updateTextProperty(property, value), 0);
        } else {
          // Standard property update
          (activeObject as any)[property] = value;
          activeObject.setCoords();
          canvas.renderAll();
        }
      }
    }
  }, [canvas]);

  // Update advanced property (simplified interface)
  const updateAdvancedProperty = useCallback((property: string, value: any) => {
    updateTextProperty(property as keyof AdvancedTextProperties, value);
  }, [updateTextProperty]);

  // Reset properties
  const resetTextProperties = useCallback(() => {
    setTextProperties(defaultAdvancedTextProperties);
  }, []);

  // Add new advanced text
  const addNewAdvancedText = useCallback((preset?: AdvancedTextProperties) => {
    if (!canvas) return;

    const properties = { ...defaultAdvancedTextProperties, ...preset };
    
    const advancedText = new AdvancedText(properties.text || 'Add your text', properties);
    
    // Position in center of canvas
    const canvasCenter = canvas.getCenter();
    advancedText.set({
      left: canvasCenter.left,
      top: canvasCenter.top,
      originX: 'center',
      originY: 'center',
    });

    canvas.add(advancedText as unknown as fabric.Object);
    canvas.setActiveObject(advancedText as unknown as fabric.Object);
    canvas.renderAll();

    // Update context properties
    setTextProperties(properties);
  }, [canvas]);

  // Convert regular text to advanced text
  const convertToAdvancedText = useCallback((textObject: fabric.Object) => {
    if (!canvas || !textObject || isAdvancedText(textObject)) return;

    const currentProps = extractTextProperties(textObject);
    
    // Create new advanced text with current properties
    const advancedText = new AdvancedText(currentProps.text || 'Text', {
      ...currentProps,
      ...textProperties // Apply any context properties
    });

    // Replace the object
    canvas.remove(textObject);
    canvas.add(advancedText as unknown as fabric.Object);
    canvas.setActiveObject(advancedText as unknown as fabric.Object);
    canvas.renderAll();

    return advancedText;
  }, [canvas, textProperties]);

  // Apply advanced preset
  const applyAdvancedPreset = useCallback((properties: AdvancedTextProperties) => {
    if (!canvas) return;

    const activeObject = canvas.getActiveObject();
    if (!activeObject || !activeObject.type?.includes('text')) return;

    let targetObject = activeObject;

    // Convert to advanced text if needed
    if (!isAdvancedText(activeObject)) {
      targetObject = convertToAdvancedText(activeObject) as fabric.Object;
    }

    if (isAdvancedText(targetObject)) {
      const advancedText = targetObject as AdvancedText;
      
      // Apply all properties
      Object.entries(properties).forEach(([key, value]) => {
        (advancedText as any)[key] = value;
      });

      advancedText._refreshObject();
      setTextProperties(prev => ({ ...prev, ...properties }));
    }
  }, [canvas, convertToAdvancedText]);

  // Utility: Check if object is advanced text
  const isAdvancedText = useCallback((object: fabric.Object): object is AdvancedText => {
    return object?.type === 'advanced-text' || (object as any)?.constructor?.name === 'AdvancedText';
  }, []);

  // Get active advanced text
  const getActiveAdvancedText = useCallback((): AdvancedText | null => {
    if (!canvas) return null;
    
    const activeObject = canvas.getActiveObject();
    return isAdvancedText(activeObject) ? activeObject as AdvancedText : null;
  }, [canvas, isAdvancedText]);

  // Context value
  const contextValue: AdvancedTextContextType = {
    textProperties,
    updateTextProperty,
    updateAdvancedProperty,
    resetTextProperties,
    addNewAdvancedText,
    convertToAdvancedText,
    applyAdvancedPreset,
    isAdvancedText,
    getActiveAdvancedText,
  };

  return (
    <AdvancedTextContext.Provider value={contextValue}>
      {children}
    </AdvancedTextContext.Provider>
  );
};

// Hook to use advanced text context
export const useAdvancedText = () => {
  const context = useContext(AdvancedTextContext);
  if (!context) {
    throw new Error('useAdvancedText must be used within an AdvancedTextProvider');
  }
  return context;
};

// Utility function to extract text properties from fabric object
function extractTextProperties(textObject: fabric.Object): AdvancedTextProperties {
  const obj = textObject as any;
  
  return {
    text: obj.text || 'Text',
    left: obj.left,
    top: obj.top,
    fontFamily: obj.fontFamily || 'Arial',
    fontSize: obj.fontSize || 24,
    fill: obj.fill || '#000000',
    backgroundColor: obj.backgroundColor,
    fontWeight: obj.fontWeight || 'normal',
    fontStyle: obj.fontStyle || 'normal',
    underline: obj.underline || false,
    lineHeight: obj.lineHeight || 1.16,
    charSpacing: obj.charSpacing || 0,
    textAlign: obj.textAlign || 'left',
    padding: obj.padding || 0,
    borderRadius: obj.borderRadius || 0,
    letterSpacing: obj.letterSpacing || 0,
    textTransform: obj.textTransform || 'none',
    textShadow: obj.textShadow,
    textOutline: obj.textOutline,
    textGradient: obj.textGradient,
  };
}

export default AdvancedTextContext;
