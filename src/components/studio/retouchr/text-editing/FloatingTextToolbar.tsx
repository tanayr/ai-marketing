"use client";

import React from 'react';
import { useCanvas } from '../hooks/use-canvas';
import { useTextFormatting } from './TextFormattingContext';
import { Portal } from './Portal';

// Import modular toolbar components
import {
  FontSelector,
  TextFormattingControls,
  AlignmentControls,
  ColorControl, 
  TextCaseControl,
  TextPresetsControl,
  StyleControls,
  Separator
} from './toolbar';

// Icons
import { Palette } from 'lucide-react';

/**
 * Floating toolbar that appears fixed at the top of the page when a text object is selected
 * Using modular components for better maintainability and reduced file size
 */
export const FloatingTextToolbar: React.FC = () => {
  const { canvas, selectedObjects } = useCanvas();
  const { 
    textProperties, 
    updateTextProperty, 
    toolbarPosition, 
    editMode,
    applyTextPreset
  } = useTextFormatting();
  
  // Don't render if no text is selected or we're not in the right mode
  if (editMode === 'none' || !selectedObjects.length) {
    return null;
  }
  
  // Make sure we have a text object selected
  const activeObject = canvas?.getActiveObject();
  if (!activeObject?.type?.includes('text')) {
    return null;
  }

  // Create wrapper for updateTextProperty to fix TypeScript compatibility
  const updateTextPropertyWrapper = (property: string, value: any) => {
    // Cast the property to keyof FabricTextProperties to satisfy TypeScript
    updateTextProperty(property as any, value);
  };
  
  // Common props for toolbar components
  const toolbarProps = {
    canvas,
    textProperties,
    updateTextProperty: updateTextPropertyWrapper
  };

  return (
    <Portal>
      <div 
        className="bg-white/95 dark:bg-gray-800/95 shadow-lg rounded-lg border border-border p-1 flex items-center gap-1 backdrop-blur-sm transition-all duration-150 animate-in fade-in slide-in-from-top-2 z-50"
        style={{ 
          position: 'fixed',
          left: '50%', 
          top: '5px',
          transform: 'translateX(-50%)', // Center horizontally
          maxWidth: '96vw',
          overflowX: 'auto',
          scrollbarWidth: 'thin',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          padding: '4px 8px'
        }}
      >
        {/* Font family selector */}
        <FontSelector {...toolbarProps} />
        <Separator />
        
        {/* Text color */}
        <ColorControl 
          {...toolbarProps} 
          property="fill" 
          allowTransparent={false} 
        />
        <Separator />
        
        {/* Text formatting controls (bold, italic, underline) */}
        <TextFormattingControls {...toolbarProps} />
        <Separator />
        
        {/* Text alignment */}
        <AlignmentControls {...toolbarProps} />
        <Separator />
        
        {/* Text case & presets */}
        <div className="flex items-center gap-1">
          <TextCaseControl {...toolbarProps} />
          <TextPresetsControl 
            {...toolbarProps} 
            applyTextPreset={applyTextPreset} 
          />
        </div>
        <Separator />
        
        {/* Combined style controls for background, padding, border radius and line height */}
        <StyleControls {...toolbarProps} />
      </div>
    </Portal>
  );
};
