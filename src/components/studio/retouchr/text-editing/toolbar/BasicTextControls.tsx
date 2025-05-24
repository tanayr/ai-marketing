"use client";

import React from 'react';
import { 
  Bold, 
  Italic, 
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  Type,
  Minus,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ColorPicker } from '../../utils/color-picker';
import { AdvancedTextProperties } from '../AdvancedTextContext';

interface BasicTextControlsProps {
  textProperties: AdvancedTextProperties;
  updateTextProperty: <K extends keyof AdvancedTextProperties>(
    property: K,
    value: AdvancedTextProperties[K]
  ) => void;
}

/**
 * Basic text formatting controls (font, size, color, alignment, etc.)
 */
export const BasicTextControls: React.FC<BasicTextControlsProps> = ({
  textProperties,
  updateTextProperty
}) => {
  
  // Font families available
  const fontFamilies = [
    'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana',
    'Tahoma', 'Impact', 'Arial Black', 'Comic Sans MS', 'Trebuchet MS',
    'Courier New', 'Lucida Console', 'serif', 'sans-serif', 'monospace'
  ];

  return (
    <div className="space-y-4">
      {/* Font Family & Size */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium mb-1 block">Font</label>
          <Select
            value={textProperties.fontFamily || 'Arial'}
            onValueChange={(value) => updateTextProperty('fontFamily', value)}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fontFamilies.map((font) => (
                <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                  {font}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs font-medium mb-1 block">Size</label>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => updateTextProperty('fontSize', Math.max(8, (textProperties.fontSize || 24) - 2))}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="text-sm font-medium w-8 text-center">
              {textProperties.fontSize || 24}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => updateTextProperty('fontSize', Math.min(200, (textProperties.fontSize || 24) + 2))}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Text Style */}
      <div>
        <label className="text-xs font-medium mb-2 block">Style</label>
        <div className="flex items-center gap-1">
          <Button
            variant={textProperties.fontWeight === 'bold' ? 'default' : 'outline'}
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => updateTextProperty('fontWeight', 
              textProperties.fontWeight === 'bold' ? 'normal' : 'bold'
            )}
          >
            <Bold className="h-3 w-3" />
          </Button>
          
          <Button
            variant={textProperties.fontStyle === 'italic' ? 'default' : 'outline'}
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => updateTextProperty('fontStyle', 
              textProperties.fontStyle === 'italic' ? 'normal' : 'italic'
            )}
          >
            <Italic className="h-3 w-3" />
          </Button>
          
          <Button
            variant={textProperties.underline ? 'default' : 'outline'}
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => updateTextProperty('underline', !textProperties.underline)}
          >
            <Underline className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Text Alignment */}
      <div>
        <label className="text-xs font-medium mb-2 block">Alignment</label>
        <div className="flex items-center gap-1">
          <Button
            variant={textProperties.textAlign === 'left' ? 'default' : 'outline'}
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => updateTextProperty('textAlign', 'left')}
          >
            <AlignLeft className="h-3 w-3" />
          </Button>
          
          <Button
            variant={textProperties.textAlign === 'center' ? 'default' : 'outline'}
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => updateTextProperty('textAlign', 'center')}
          >
            <AlignCenter className="h-3 w-3" />
          </Button>
          
          <Button
            variant={textProperties.textAlign === 'right' ? 'default' : 'outline'}
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => updateTextProperty('textAlign', 'right')}
          >
            <AlignRight className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Colors */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium mb-2 block">Text Color</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-8 w-full justify-start gap-2">
                <div 
                  className="w-4 h-4 rounded border"
                  style={{ backgroundColor: textProperties.fill || '#000000' }}
                />
                <span className="text-xs">Color</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3">
              <ColorPicker
                color={textProperties.fill || '#000000'}
                onChange={(color) => updateTextProperty('fill', color)}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <label className="text-xs font-medium mb-2 block">Background</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-8 w-full justify-start gap-2">
                <div 
                  className="w-4 h-4 rounded border"
                  style={{ 
                    backgroundColor: textProperties.backgroundColor || 'transparent',
                    backgroundImage: !textProperties.backgroundColor ? 
                      'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)' : 'none',
                    backgroundSize: !textProperties.backgroundColor ? '8px 8px' : 'auto',
                    backgroundPosition: !textProperties.backgroundColor ? '0 0, 0 4px, 4px -4px, -4px 0px' : 'auto'
                  }}
                />
                <span className="text-xs">Background</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3">
              <ColorPicker
                color={textProperties.backgroundColor || '#ffffff'}
                onChange={(color) => updateTextProperty('backgroundColor', color)}
                allowTransparent
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Spacing Controls */}
      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium mb-2 block">Line Height</label>
          <Slider
            value={[textProperties.lineHeight || 1.16]}
            onValueChange={([value]) => updateTextProperty('lineHeight', value)}
            min={0.5}
            max={3}
            step={0.1}
            className="w-full"
          />
          <div className="text-xs text-gray-500 mt-1">
            {((textProperties.lineHeight || 1.16) * 100).toFixed(0)}%
          </div>
        </div>

        <div>
          <label className="text-xs font-medium mb-2 block">Character Spacing</label>
          <Slider
            value={[textProperties.charSpacing || 0]}
            onValueChange={([value]) => updateTextProperty('charSpacing', value)}
            min={-5}
            max={20}
            step={0.5}
            className="w-full"
          />
          <div className="text-xs text-gray-500 mt-1">
            {textProperties.charSpacing || 0}px
          </div>
        </div>
      </div>

      {/* Padding & Border Radius */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium mb-2 block">Padding</label>
          <Slider
            value={[textProperties.padding || 0]}
            onValueChange={([value]) => updateTextProperty('padding', value)}
            min={0}
            max={50}
            step={1}
            className="w-full"
          />
          <div className="text-xs text-gray-500 mt-1">
            {textProperties.padding || 0}px
          </div>
        </div>

        <div>
          <label className="text-xs font-medium mb-2 block">Corner Radius</label>
          <Slider
            value={[textProperties.borderRadius || 0]}
            onValueChange={([value]) => updateTextProperty('borderRadius', value)}
            min={0}
            max={30}
            step={1}
            className="w-full"
          />
          <div className="text-xs text-gray-500 mt-1">
            {textProperties.borderRadius || 0}px
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasicTextControls;
