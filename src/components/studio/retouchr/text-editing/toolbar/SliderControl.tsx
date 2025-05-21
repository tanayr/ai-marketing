"use client";

import React from 'react';
import { Slider } from '@/components/ui/slider';
import { NumericControlProps } from './types';

/**
 * Compact slider control for numeric values
 */
export const SliderControl: React.FC<NumericControlProps> = ({
  textProperties,
  updateTextProperty,
  property,
  min,
  max,
  step,
  icon,
  defaultValue,
  canvas
}) => {
  // Get current value or use default
  const currentValue = (textProperties as any)[property] !== undefined 
    ? (textProperties as any)[property] 
    : defaultValue;

  // Update property value when slider changes
  const handleValueChange = (value: number[]) => {
    updateTextProperty(property, value[0]);
  };
  
  // Handle slider release to force refresh with micro-scaling
  const handleValueCommit = (value: number[]) => {
    // Only trigger micro-scaling for properties that need it
    if (property === 'padding' || property === 'borderRadius' || property === 'backgroundColor') {
      // Get the active object
      const activeObject = canvas?.getActiveObject();
      if (!activeObject) return;
      
      // Use _refreshObject method if available (for EnhancedText objects)
      if (typeof (activeObject as any)._refreshObject === 'function') {
        (activeObject as any)._refreshObject();
        canvas?.renderAll();
      } else {
        // Fallback: apply a micro-scale to force a complete refresh
        const currentScaleX = activeObject.scaleX || 1;
        const currentScaleY = activeObject.scaleY || 1;
        
        // Micro-scale to force refresh
        activeObject.set('scaleX', currentScaleX * 1.00001);
        activeObject.set('scaleY', currentScaleY * 1.00001);
        
        activeObject.setCoords();
        canvas?.renderAll();
      }
    }
  };

  return (
    <div className="flex items-center gap-1 w-20">
      <span className="opacity-70">{icon}</span>
      <div className="flex-1">
        <Slider
          value={[currentValue || defaultValue]}
          min={min}
          max={max}
          step={step}
          onValueChange={handleValueChange}
          onValueCommit={handleValueCommit}
          className="h-3 w-16"
        />
      </div>
    </div>
  );
};
