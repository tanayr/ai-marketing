"use client";

import React from 'react';
import { ColorPicker } from '../../utils/color-picker';
import { TextToolbarProps } from './types';

interface ColorControlProps extends TextToolbarProps {
  property: string;
  allowTransparent: boolean;
  icon?: React.ReactNode;
}

/**
 * Color control with color picker
 */
export const ColorControl: React.FC<ColorControlProps> = ({ 
  textProperties, 
  updateTextProperty,
  property,
  allowTransparent,
  icon
}) => {
  // Get the current color value
  const color = (textProperties as any)[property] as string || 
    (property === 'fill' ? '#000000' : 'transparent');
  
  return (
    <div className="flex items-center">
      {icon && <span className="opacity-70 mr-1">{icon}</span>}
      <ColorPicker
        color={color}
        onChange={(newColor: string) => updateTextProperty(property, newColor)}
        allowTransparent={allowTransparent}
      />
    </div>
  );
};
