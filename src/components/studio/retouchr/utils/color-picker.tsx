"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { HexColorPicker } from 'react-colorful';

// Common colors for quick selection
const PRESET_COLORS = [
  '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff',
  '#ffff00', '#00ffff', '#ff00ff', '#c0c0c0', '#808080',
  '#800000', '#808000', '#008000', '#800080', '#008080', '#000080'
];

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  allowTransparent?: boolean;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  color,
  onChange,
  allowTransparent = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [internalColor, setInternalColor] = useState(color);
  
  // Sync internal state with props
  useEffect(() => {
    setInternalColor(color);
  }, [color]);
  
  // Handle color change and ensure it's a valid hex
  const handleColorChange = (newColor: string) => {
    setInternalColor(newColor);
    // Only propagate valid hex codes to parent
    if(newColor === '' || /^#([A-Fa-f0-9]{3}){1,2}$/.test(newColor)) {
      onChange(newColor);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full flex justify-between items-center h-10"
        >
          <div className="flex items-center gap-2">
            <div 
              className="w-5 h-5 rounded border" 
              style={{ 
                backgroundColor: color || 'transparent',
                backgroundImage: !color && allowTransparent 
                  ? 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)'
                  : 'none',
                backgroundSize: '6px 6px',
                backgroundPosition: '0 0, 3px 3px'
              }}
            />
            <span>{color || 'Transparent'}</span>
          </div>
          <span className="sr-only">Select color</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3">
        <div className="space-y-4">
          {/* Color picker visualization */}
          <div className="flex flex-col items-center">
            <HexColorPicker 
              color={color || '#000000'} 
              onChange={(newColor) => {
                onChange(newColor);
              }}
              style={{ width: '100%', height: '160px' }}
            />
          </div>
          
          {/* Hex input field */}
          <div>
            <label className="text-xs font-medium block mb-1.5">Hex Color</label>
            <div className="flex gap-2 items-center">
              <div 
                className="w-8 h-8 rounded border" 
                style={{ backgroundColor: color || 'transparent' }}
              />
              <Input
                value={color}
                onChange={(e) => onChange(e.target.value)}
                placeholder="#000000"
                className="h-8 font-mono"
              />
            </div>
          </div>
          
          {/* Quick color presets */}
          <div>
            <label className="text-xs font-medium block mb-1.5">Presets</label>
            <div className="grid grid-cols-8 gap-1">
              {PRESET_COLORS.map((presetColor) => (
                <button
                  key={presetColor}
                  className="w-6 h-6 rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  style={{ backgroundColor: presetColor }}
                  onClick={() => {
                    onChange(presetColor);
                  }}
                  aria-label={`Select color ${presetColor}`}
                />
              ))}
            </div>
          </div>
          
          {allowTransparent && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
            >
              Transparent
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
