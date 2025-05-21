"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { FONT_OPTIONS } from '../../toolbar/text-tool-constants';
import { TextToolbarProps } from './types';

/**
 * Font family selector component
 */
export const FontSelector: React.FC<TextToolbarProps> = ({ 
  textProperties, 
  updateTextProperty 
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 text-xs px-2 gap-1 min-w-[100px] max-w-[120px] justify-between"
        >
          <span className="truncate">
            {FONT_OPTIONS.find((f: {value: string; label: string}) => f.value === textProperties.fontFamily)?.label || 'Font'}
          </span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-[300px] overflow-y-auto">
        {FONT_OPTIONS.map((font: {value: string; label: string}) => (
          <DropdownMenuItem
            key={font.value}
            className="text-xs cursor-pointer"
            style={{ fontFamily: font.value }}
            onClick={() => updateTextProperty('fontFamily', font.value)}
          >
            {font.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
