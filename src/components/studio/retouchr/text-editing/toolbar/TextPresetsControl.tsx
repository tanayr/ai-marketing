"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Type, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { TEXT_PRESETS } from '../../toolbar/text-tool-constants';
import { TextToolbarProps } from './types';

interface TextPresetsControlProps extends TextToolbarProps {
  applyTextPreset: (properties: any) => void;
}

/**
 * Text presets selector
 */
export const TextPresetsControl: React.FC<TextPresetsControlProps> = ({ 
  applyTextPreset 
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs px-1.5 gap-0.5"
          title="Apply text preset"
        >
          <Type className="h-3 w-3" />
          <ChevronDown className="h-2.5 w-2.5 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-[300px] overflow-y-auto">
        {TEXT_PRESETS.map((preset: {id: string; label: string; properties: any}) => (
          <DropdownMenuItem
            key={preset.id}
            className="text-xs cursor-pointer"
            onClick={() => applyTextPreset(preset.properties)}
          >
            <div className="flex flex-col">
              <span 
                style={{
                  fontFamily: preset.properties.fontFamily,
                  fontWeight: preset.properties.fontWeight,
                  fontSize: `${Math.min(preset.properties.fontSize / 2, 16)}px`,
                }}
              >
                {preset.label}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {preset.properties.fontSize}px {preset.properties.fontFamily}
              </span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
