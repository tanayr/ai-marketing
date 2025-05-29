"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CircleDashed, Eye, EyeOff, Check, ChevronRight } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { QCOutlineProps, OUTLINE_PRESETS } from './QC-Types';
import { cn } from '@/lib/utils';

/**
 * Outline effect control component
 * Provides a dropdown with presets and direct editing options
 */
export const QCOutline: React.FC<QCOutlineProps> = ({ 
  textOutline, 
  onApplyEffect 
}) => {
  // Initialize states for outline properties
  const defaultOutline = textOutline || OUTLINE_PRESETS[0].value;
  const [width, setWidth] = useState(defaultOutline.width);
  const [color, setColor] = useState(defaultOutline.color);
  
  // Check if outline is active
  const hasOutline = !!textOutline;
  
  // Toggle outline on/off
  const toggleOutline = () => {
    if (hasOutline) {
      onApplyEffect('textOutline', undefined);
    } else {
      onApplyEffect('textOutline', OUTLINE_PRESETS[0].value);
    }
  };
  
  // Apply current outline settings
  const applyOutline = () => {
    onApplyEffect('textOutline', {
      width,
      color
    });
  };
  
  // Apply preset
  const applyPreset = (preset: typeof OUTLINE_PRESETS[0]) => {
    setWidth(preset.value.width);
    setColor(preset.value.color);
    onApplyEffect('textOutline', preset.value);
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className={cn(
            "h-8 w-8",
            hasOutline && "text-purple-500 bg-purple-50"
          )}
          title="Text Outline"
        >
          <CircleDashed className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Text Outline</span>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 ml-auto" 
            onClick={toggleOutline}
          >
            {hasOutline ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </Button>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs text-muted-foreground">Presets</DropdownMenuLabel>
          {OUTLINE_PRESETS.map((preset, index) => (
            <DropdownMenuItem 
              key={index}
              onClick={() => applyPreset(preset)}
            >
              <span>{preset.name}</span>
              {JSON.stringify(preset.value) === JSON.stringify(textOutline) && (
                <Check className="h-4 w-4 ml-auto" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <span>Custom Settings</span>
            <ChevronRight className="h-4 w-4 ml-auto" />
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-64 p-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-xs">Outline Width</Label>
                  <span className="text-xs text-muted-foreground">{width}px</span>
                </div>
                <Slider
                  value={[width]}
                  min={0.5}
                  max={10}
                  step={0.5}
                  onValueChange={(value) => setWidth(value[0])}
                  onValueCommit={applyOutline}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs">Outline Color</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    type="color" 
                    value={color} 
                    className="w-12 h-6 p-0" 
                    onChange={(e) => {
                      setColor(e.target.value);
                      // Short delay to allow color picker to close
                      setTimeout(() => applyOutline(), 100);
                    }} 
                  />
                  <Button 
                    size="sm"
                    variant="outline"
                    className="ml-auto"
                    onClick={applyOutline}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </div>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        
        {hasOutline && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-500"
              onClick={() => onApplyEffect('textOutline', undefined)}
            >
              Remove Outline
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
