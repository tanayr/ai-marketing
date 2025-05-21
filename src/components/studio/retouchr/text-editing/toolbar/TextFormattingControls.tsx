"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Bold, Italic, Underline } from 'lucide-react';
import { TextToolbarProps } from './types';

/**
 * Text formatting controls (bold, italic, underline)
 */
export const TextFormattingControls: React.FC<TextToolbarProps> = ({ 
  textProperties, 
  updateTextProperty 
}) => {
  return (
    <div className="flex">
      <Button 
        variant={textProperties.fontWeight === 'bold' ? "default" : "ghost"} 
        size="icon" 
        className="h-7 w-7 rounded-r-none"
        onClick={() => updateTextProperty('fontWeight', textProperties.fontWeight === 'bold' ? 'normal' : 'bold')}
        title="Bold"
      >
        <Bold className="h-3 w-3" />
      </Button>
      <Button 
        variant={textProperties.fontStyle === 'italic' ? "default" : "ghost"} 
        size="icon" 
        className="h-7 w-7 rounded-none border-x-0"
        onClick={() => updateTextProperty('fontStyle', textProperties.fontStyle === 'italic' ? 'normal' : 'italic')}
        title="Italic"
      >
        <Italic className="h-3 w-3" />
      </Button>
      <Button 
        variant={textProperties.underline ? "default" : "ghost"} 
        size="icon" 
        className="h-7 w-7 rounded-l-none"
        onClick={() => updateTextProperty('underline', !textProperties.underline)}
        title="Underline"
      >
        <Underline className="h-3 w-3" />
      </Button>
    </div>
  );
};
