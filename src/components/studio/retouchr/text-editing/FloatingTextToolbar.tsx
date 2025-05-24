"use client";

import React, { useState } from 'react';
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

// Import advanced effects panel
import { AdvancedEffectsPanel } from './AdvancedEffectsPanel';

// Icons
import { Type } from 'lucide-react';

/**
 * Clean, simplified floating toolbar focused on core text editing
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
          transform: 'translateX(-50%)',
          maxWidth: '96vw',
          overflowX: 'auto',
          scrollbarWidth: 'thin',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          padding: '4px 8px'
        }}
      >
        {/* Font Selection */}
        <FontSelector {...toolbarProps} />
        <Separator />

        {/* Text Formatting */}
        <TextFormattingControls {...toolbarProps} />
        <Separator />

        {/* Text Color */}
        <ColorControl {...toolbarProps} property="fill" allowTransparent={false} />
        <Separator />

        {/* Alignment */}
        <AlignmentControls {...toolbarProps} />
        <Separator />

        {/* Text Case */}
        <TextCaseControl {...toolbarProps} />
        <Separator />

        {/* Style Controls (Background, Padding, Border Radius) */}
        <StyleControls {...toolbarProps} />
        <Separator />

        {/* Advanced Effects Panel */}
        <AdvancedEffectsPanel />
        <Separator />

        {/* Text Presets */}
        <TextPresetsControl {...toolbarProps} applyTextPreset={applyTextPreset} />
      </div>
    </Portal>
  );
};
