"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Minus, Plus } from 'lucide-react';
import { NumericControlProps } from './types';

/**
 * Generic component for numeric controls with +/- buttons
 */
export const NumericControl: React.FC<NumericControlProps> = ({
  textProperties,
  updateTextProperty,
  property,
  min,
  max,
  step,
  icon,
  defaultValue,
  label
}) => {
  // Get current value or use default
  const currentValue = textProperties[property] !== undefined 
    ? textProperties[property] 
    : defaultValue;

  // Increment or decrement the value
  const handleChange = (increment: boolean) => {
    const newValue = increment
      ? Math.min(max, (currentValue || defaultValue) + step)
      : Math.max(min, (currentValue || defaultValue) - step);
    updateTextProperty(property, newValue);
  };

  return (
    <div className="flex items-center">
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        title={`Decrease ${property}`}
        onClick={() => handleChange(false)}
      >
        <Minus className="h-3 w-3" />
      </Button>
      <span className="flex items-center gap-0.5">
        {icon && <span className="opacity-70">{icon}</span>}
        <span className="text-xs w-5 text-center font-mono">
          {typeof currentValue === 'number' && Number.isInteger(currentValue)
            ? currentValue
            : typeof currentValue === 'number'
              ? currentValue.toFixed(1) 
              : defaultValue}
        </span>
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        title={`Increase ${property}`}
        onClick={() => handleChange(true)}
      >
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  );
};
