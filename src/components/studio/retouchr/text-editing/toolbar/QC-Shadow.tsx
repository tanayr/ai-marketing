"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Droplets, Eye, EyeOff, Check, ChevronRight } from 'lucide-react';
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
import { QCShadowProps, SHADOW_PRESETS } from './QC-Types';
import { cn } from '@/lib/utils';

/**
 * Shadow effect control component
 * Provides a dropdown with presets and direct editing options
 */
export const QCShadow: React.FC<QCShadowProps> = ({ 
  textShadow, 
  onApplyEffect 
}) => {
  // Initialize states for shadow properties
  const defaultShadow = textShadow || SHADOW_PRESETS[0].value;
  const [offsetX, setOffsetX] = useState(defaultShadow.offsetX);
  const [offsetY, setOffsetY] = useState(defaultShadow.offsetY);
  const [blur, setBlur] = useState(defaultShadow.blur);
  const [color, setColor] = useState(defaultShadow.color);
  
  // Check if shadow is active
  const hasShadow = !!textShadow;
  
  // Toggle shadow on/off
  const toggleShadow = () => {
    if (hasShadow) {
      onApplyEffect('textShadow', undefined);
    } else {
      onApplyEffect('textShadow', SHADOW_PRESETS[0].value);
    }
  };
  
  // Apply current shadow settings
  const applyShadow = () => {
    onApplyEffect('textShadow', {
      offsetX,
      offsetY,
      blur,
      color
    });
  };
  
  // Apply preset
  const applyPreset = (preset: typeof SHADOW_PRESETS[0]) => {
    setOffsetX(preset.value.offsetX);
    setOffsetY(preset.value.offsetY);
    setBlur(preset.value.blur);
    setColor(preset.value.color);
    onApplyEffect('textShadow', preset.value);
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className={cn(
            "h-8 w-8",
            hasShadow && "text-blue-500 bg-blue-50"
          )}
          title="Text Shadow"
        >
          <Droplets className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Text Shadow</span>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 ml-auto" 
            onClick={toggleShadow}
          >
            {hasShadow ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </Button>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs text-muted-foreground">Presets</DropdownMenuLabel>
          {SHADOW_PRESETS.map((preset, index) => (
            <DropdownMenuItem 
              key={index}
              onClick={() => applyPreset(preset)}
            >
              <span>{preset.name}</span>
              {JSON.stringify(preset.value) === JSON.stringify(textShadow) && (
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
                  <Label className="text-xs">Horizontal Offset</Label>
                  <span className="text-xs text-muted-foreground">{offsetX}px</span>
                </div>
                <Slider
                  value={[offsetX]}
                  min={-20}
                  max={20}
                  step={1}
                  onValueChange={(value) => setOffsetX(value[0])}
                  onValueCommit={applyShadow}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-xs">Vertical Offset</Label>
                  <span className="text-xs text-muted-foreground">{offsetY}px</span>
                </div>
                <Slider
                  value={[offsetY]}
                  min={-20}
                  max={20}
                  step={1}
                  onValueChange={(value) => setOffsetY(value[0])}
                  onValueCommit={applyShadow}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-xs">Blur Radius</Label>
                  <span className="text-xs text-muted-foreground">{blur}px</span>
                </div>
                <Slider
                  value={[blur]}
                  min={0}
                  max={20}
                  step={1}
                  onValueChange={(value) => setBlur(value[0])}
                  onValueCommit={applyShadow}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs">Shadow Color</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    type="color" 
                    value={color.startsWith('rgba') ? '#000000' : color} 
                    className="w-12 h-6 p-0" 
                    onChange={(e) => {
                      setColor(e.target.value);
                      // Short delay to allow color picker to close
                      setTimeout(() => applyShadow(), 100);
                    }} 
                  />
                  <Button 
                    size="sm"
                    variant="outline"
                    className="ml-auto"
                    onClick={applyShadow}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </div>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        
        {hasShadow && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-500"
              onClick={() => onApplyEffect('textShadow', undefined)}
            >
              Remove Shadow
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
