"use client";

import React from 'react';
import { useCanvas } from '../hooks/use-canvas';
import { useTextFormatting } from './TextFormattingContext';
import { Button } from '@/components/ui/button';
import { TEXT_PRESETS } from '../toolbar/text-tool-constants';
import { Label } from '@/components/ui/label';
import { Plus, Type } from 'lucide-react';

// Interface for preset button props
interface PresetButtonProps {
  id: string;
  label: string;
  properties: any;
  onClick: () => void;
}

/**
 * Button that displays a text preset with a preview of the style
 */
const PresetButton: React.FC<PresetButtonProps> = ({ id, label, properties, onClick }) => {
  return (
    <Button
      variant="outline"
      className="h-auto py-3 px-3 justify-start items-start w-full text-left"
      onClick={onClick}
    >
      <div 
        className="w-full overflow-hidden" 
        style={{
          fontFamily: properties.fontFamily,
          lineHeight: properties.lineHeight,
        }}
      >
        <span 
          className="block truncate"
          style={{
            fontSize: `${Math.min(properties.fontSize || 16, 24)}px`,
            fontWeight: properties.fontWeight,
            fontStyle: properties.fontStyle,
            textDecoration: properties.underline ? 'underline' : 'none',
          }}
        >
          {label}
        </span>
        <span className="text-xs text-muted-foreground mt-1 block">
          {properties.fontFamily}, {properties.fontSize}px
        </span>
      </div>
    </Button>
  );
};

/**
 * Simplified sidebar that only shows text presets
 */
export const TextPresetSidebar: React.FC = () => {
  const { addNewText, applyTextPreset } = useTextFormatting();
  const { selectedObjects, canvas } = useCanvas();
  
  // Check if a text object is selected
  const hasSelectedText = 
    selectedObjects.length > 0 && 
    canvas?.getActiveObject()?.type?.includes('text');
    
  // Group presets by category
  const headingPresets = TEXT_PRESETS.filter(p => p.id.includes('heading'));
  const otherPresets = TEXT_PRESETS.filter(p => !p.id.includes('heading'));
  
  return (
    <div className="space-y-4 p-4">
      <div>
        <h3 className="text-sm font-medium flex items-center">
          <Type className="mr-2 h-4 w-4" />
          Text Styles
        </h3>
        <p className="text-xs text-muted-foreground mt-1 mb-4">
          {hasSelectedText 
            ? "Click a style to apply to selected text" 
            : "Click a style to add new text"}
        </p>
        
        {/* Plain text button */}
        <Button
          variant="outline"
          size="sm"
          className="w-full mb-4 justify-start"
          onClick={() => addNewText()}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Plain Text
        </Button>
        
        {/* Headings */}
        <div className="space-y-1 mb-4">
          <Label className="text-xs">Headings</Label>
          <div className="grid grid-cols-1 gap-2">
            {headingPresets.map((preset) => (
              <PresetButton
                key={preset.id}
                id={preset.id}
                label={preset.label}
                properties={preset.properties}
                onClick={() => {
                  if (hasSelectedText) {
                    applyTextPreset(preset.properties);
                  } else {
                    addNewText(preset.properties);
                  }
                }}
              />
            ))}
          </div>
        </div>
        
        {/* Other styles */}
        <div className="space-y-1">
          <Label className="text-xs">Other Styles</Label>
          <div className="grid grid-cols-1 gap-2">
            {otherPresets.map((preset) => (
              <PresetButton
                key={preset.id}
                id={preset.id}
                label={preset.label}
                properties={preset.properties}
                onClick={() => {
                  if (hasSelectedText) {
                    applyTextPreset(preset.properties);
                  } else {
                    addNewText(preset.properties);
                  }
                }}
              />
            ))}
          </div>
        </div>
      </div>
      
      <div className="text-xs text-muted-foreground mt-6 pt-2 border-t">
        <p className="mb-1">💡 Tip</p>
        <p>Double-click any text on canvas to edit it directly.</p>
      </div>
    </div>
  );
};
