"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { TextToolbarProps } from './types';

/**
 * Text alignment controls (left, center, right)
 */
export const AlignmentControls: React.FC<TextToolbarProps> = ({ 
  textProperties, 
  updateTextProperty 
}) => {
  return (
    <div className="flex">
      <Button 
        variant={textProperties.textAlign === 'left' ? "default" : "ghost"} 
        size="icon" 
        className="h-7 w-7 rounded-r-none"
        onClick={() => updateTextProperty('textAlign', 'left')}
        title="Align left"
      >
        <AlignLeft className="h-3 w-3" />
      </Button>
      <Button 
        variant={textProperties.textAlign === 'center' ? "default" : "ghost"} 
        size="icon" 
        className="h-7 w-7 rounded-none border-x-0"
        onClick={() => updateTextProperty('textAlign', 'center')}
        title="Align center"
      >
        <AlignCenter className="h-3 w-3" />
      </Button>
      <Button 
        variant={textProperties.textAlign === 'right' ? "default" : "ghost"} 
        size="icon" 
        className="h-7 w-7 rounded-l-none"
        onClick={() => updateTextProperty('textAlign', 'right')}
        title="Align right"
      >
        <AlignRight className="h-3 w-3" />
      </Button>
    </div>
  );
};
