"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Palette, Eye, EyeOff, Check, ChevronRight, Plus, Trash2 } from 'lucide-react';
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
import { QCGradientProps, GRADIENT_PRESETS } from './QC-Types';
import { cn } from '@/lib/utils';

/**
 * Gradient effect control component
 * Provides a dropdown with presets and direct editing options
 */
export const QCGradient: React.FC<QCGradientProps> = ({ 
  textGradient, 
  onApplyEffect 
}) => {
  // Default gradient and helper function for angle
  const defaultGradient = textGradient || GRADIENT_PRESETS[0].value;
  const getDefaultAngle = (): number => {
    return defaultGradient?.angle ?? 90;
  };
  
  // Initialize states for gradient properties
  const [angle, setAngle] = useState(getDefaultAngle());
  const [colors, setColors] = useState(defaultGradient.colors || []);
  
  // Check if gradient is active
  const hasGradient = !!textGradient;
  
  // Toggle gradient on/off
  const toggleGradient = () => {
    if (hasGradient) {
      onApplyEffect('textGradient', undefined);
    } else {
      onApplyEffect('textGradient', GRADIENT_PRESETS[0].value);
    }
  };
  
  // Apply current gradient settings
  const applyGradient = () => {
    if (colors.length < 2) return; // Need at least 2 colors for a gradient
    
    onApplyEffect('textGradient', {
      type: 'linear' as const,
      angle,
      colors
    });
  };
  
  // Apply preset
  const applyPreset = (preset: typeof GRADIENT_PRESETS[0]) => {
    setAngle(preset.value.angle || 90);
    setColors(preset.value.colors);
    onApplyEffect('textGradient', preset.value);
  };
  
  // Color management
  const addColor = () => {
    const newColors = [...colors, '#ffffff'];
    setColors(newColors);
    setTimeout(() => {
      onApplyEffect('textGradient', {
        type: 'linear' as const,
        angle,
        colors: newColors
      });
    }, 100);
  };
  
  const removeColor = (index: number) => {
    if (colors.length <= 2) return; // Keep at least 2 colors
    const newColors = [...colors];
    newColors.splice(index, 1);
    setColors(newColors);
    setTimeout(() => {
      onApplyEffect('textGradient', {
        type: 'linear' as const,
        angle,
        colors: newColors
      });
    }, 100);
  };
  
  const updateColor = (index: number, newColor: string) => {
    const newColors = [...colors];
    newColors[index] = newColor;
    setColors(newColors);
    setTimeout(() => {
      onApplyEffect('textGradient', {
        type: 'linear' as const,
        angle,
        colors: newColors
      });
    }, 100);
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className={cn(
            "h-8 w-8",
            hasGradient && "text-green-500 bg-green-50"
          )}
          title="Text Gradient"
        >
          <Palette className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Text Gradient</span>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 ml-auto" 
            onClick={toggleGradient}
          >
            {hasGradient ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </Button>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs text-muted-foreground">Presets</DropdownMenuLabel>
          {GRADIENT_PRESETS.map((preset, index) => (
            <DropdownMenuItem 
              key={index}
              onClick={() => applyPreset(preset)}
            >
              <span>{preset.name}</span>
              {textGradient?.colors.join() === preset.value.colors.join() && (
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
                  <Label className="text-xs">Gradient Angle</Label>
                  <span className="text-xs text-muted-foreground">{angle}°</span>
                </div>
                <Slider
                  value={[angle]}
                  min={0}
                  max={360}
                  step={1}
                  onValueChange={(value) => setAngle(value[0])}
                  onValueCommit={applyGradient}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Gradient Colors</Label>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-6 w-6"
                    onClick={addColor}
                    disabled={colors.length >= 7}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {colors.map((color, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input 
                        type="color" 
                        value={color} 
                        className="w-12 h-6 p-0" 
                        onChange={(e) => updateColor(index, e.target.value)} 
                      />
                      <span className="text-xs text-muted-foreground">Color {index + 1}</span>
                      {colors.length > 2 && (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-6 w-6 ml-auto"
                          onClick={() => removeColor(index)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <Button 
                size="sm"
                variant="outline"
                className="w-full"
                onClick={applyGradient}
              >
                Apply Gradient
              </Button>
            </div>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        
        {hasGradient && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-500"
              onClick={() => onApplyEffect('textGradient', undefined)}
            >
              Remove Gradient
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
