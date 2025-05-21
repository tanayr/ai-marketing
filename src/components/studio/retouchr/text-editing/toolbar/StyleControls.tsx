"use client";

import React from 'react';
import { Palette, PanelTopOpen, Radius, MoveVertical } from 'lucide-react';
import { TextToolbarProps } from './types';
import { SliderControl } from './SliderControl';
import { ColorControl } from './ColorControl';

/**
 * Combined style controls for background, padding, border radius, and line height
 */
export const StyleControls: React.FC<TextToolbarProps> = (props) => {
  return (
    <div className="flex items-center gap-1 bg-muted/30 px-1 py-0.5 rounded-sm">
      {/* Background color */}
      <ColorControl
        {...props}
        property="backgroundColor"
        allowTransparent={true}
        icon={<Palette className="h-3 w-3" />}
      />
      
      {/* Padding control */}
      <SliderControl
        {...props}
        property="padding"
        min={0}
        max={50}
        step={1}
        icon={<PanelTopOpen className="h-3 w-3" />}
        defaultValue={0}
      />
      
      {/* Border radius control */}
      <SliderControl
        {...props}
        property="borderRadius"
        min={0}
        max={30}
        step={1}
        icon={<Radius className="h-3 w-3" />}
        defaultValue={0}
      />
      
      {/* Line height */}
      <SliderControl
        {...props}
        property="lineHeight"
        min={0.9}
        max={2.5}
        step={0.1}
        icon={<MoveVertical className="h-3 w-3" />}
        defaultValue={1.16}
      />
    </div>
  );
};
