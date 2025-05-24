"use client";

import React, { useState } from 'react';
import { 
  Eye, 
  EyeOff, 
  RotateCcw,
  Palette,
  Circle,
  Square,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ColorPicker } from '../../utils/color-picker';
import { TextEffects, TextShadow, TextOutline, TextGradient } from '../../utils/advanced-text-effects';
import { TextToolbarProps } from './types';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

interface AdvancedTextControlsProps extends TextToolbarProps {
  textShadow?: TextShadow;
  textOutline?: TextOutline;
  textGradient?: TextGradient;
  letterSpacing?: number;
  textTransform?: string;
  updateAdvancedProperty: (property: string, value: any) => void;
}

/**
 * Professional text effects controls with clear labels and intuitive interface
 */
export const AdvancedTextControls: React.FC<AdvancedTextControlsProps> = ({
  textShadow,
  textOutline,
  textGradient,
  letterSpacing = 0,
  textTransform = 'none',
  updateAdvancedProperty
}) => {
  const [activeTab, setActiveTab] = useState<string>('shadow');

  // Shadow Controls Section
  const ShadowControls = () => (
    <div className="space-y-4">
      {/* Enable/Disable Shadow */}
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Text Shadow</Label>
        <Button
          variant={textShadow ? "default" : "outline"}
          size="sm"
          onClick={() => {
            if (textShadow) {
              updateAdvancedProperty('textShadow', undefined);
            } else {
              updateAdvancedProperty('textShadow', TextEffects.shadows.soft);
            }
          }}
        >
          {textShadow ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
          {textShadow ? 'Enabled' : 'Disabled'}
        </Button>
      </div>

      {textShadow && (
        <Card className="p-4 space-y-4">
          {/* Quick Presets */}
          <div>
            <Label className="text-xs text-gray-600 mb-2 block">Quick Presets</Label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(TextEffects.shadows).map(([name, shadow]) => (
                <Button
                  key={name}
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs capitalize"
                  onClick={() => updateAdvancedProperty('textShadow', shadow)}
                >
                  {name}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Controls */}
          <div className="space-y-3">
            <Label className="text-xs text-gray-600">Custom Settings</Label>
            
            {/* Horizontal Offset */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium">Horizontal Offset</span>
                <span className="text-xs text-gray-500">{textShadow.offsetX}px</span>
              </div>
              <Slider
                value={[textShadow.offsetX]}
                onValueChange={([value]) => 
                  updateAdvancedProperty('textShadow', { ...textShadow, offsetX: value })
                }
                min={-20}
                max={20}
                step={1}
                className="w-full"
              />
            </div>
            
            {/* Vertical Offset */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium">Vertical Offset</span>
                <span className="text-xs text-gray-500">{textShadow.offsetY}px</span>
              </div>
              <Slider
                value={[textShadow.offsetY]}
                onValueChange={([value]) => 
                  updateAdvancedProperty('textShadow', { ...textShadow, offsetY: value })
                }
                min={-20}
                max={20}
                step={1}
                className="w-full"
              />
            </div>
            
            {/* Blur Radius */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium">Blur Radius</span>
                <span className="text-xs text-gray-500">{textShadow.blur}px</span>
              </div>
              <Slider
                value={[textShadow.blur]}
                onValueChange={([value]) => 
                  updateAdvancedProperty('textShadow', { ...textShadow, blur: value })
                }
                min={0}
                max={30}
                step={1}
                className="w-full"
              />
            </div>
            
            {/* Shadow Color */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium">Shadow Color</span>
              </div>
              <ColorPicker
                color={textShadow.color}
                onChange={(color) => 
                  updateAdvancedProperty('textShadow', { ...textShadow, color })
                }
              />
            </div>
          </div>
        </Card>
      )}
    </div>
  );

  // Outline Controls Section
  const OutlineControls = () => (
    <div className="space-y-4">
      {/* Enable/Disable Outline */}
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Text Outline</Label>
        <Button
          variant={textOutline ? "default" : "outline"}
          size="sm"
          onClick={() => {
            if (textOutline) {
              updateAdvancedProperty('textOutline', undefined);
            } else {
              updateAdvancedProperty('textOutline', TextEffects.outlines.medium);
            }
          }}
        >
          {textOutline ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
          {textOutline ? 'Enabled' : 'Disabled'}
        </Button>
      </div>

      {textOutline && (
        <Card className="p-4 space-y-4">
          {/* Quick Presets */}
          <div>
            <Label className="text-xs text-gray-600 mb-2 block">Quick Presets</Label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(TextEffects.outlines).map(([name, outline]) => (
                <Button
                  key={name}
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs capitalize"
                  onClick={() => updateAdvancedProperty('textOutline', outline)}
                >
                  {name}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Controls */}
          <div className="space-y-3">
            <Label className="text-xs text-gray-600">Custom Settings</Label>
            
            {/* Outline Width */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium">Outline Width</span>
                <span className="text-xs text-gray-500">{textOutline.width}px</span>
              </div>
              <Slider
                value={[textOutline.width]}
                onValueChange={([value]) => 
                  updateAdvancedProperty('textOutline', { ...textOutline, width: value })
                }
                min={0}
                max={10}
                step={0.5}
                className="w-full"
              />
            </div>
            
            {/* Outline Color */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium">Outline Color</span>
              </div>
              <ColorPicker
                color={textOutline.color}
                onChange={(color) => 
                  updateAdvancedProperty('textOutline', { ...textOutline, color })
                }
              />
            </div>
          </div>
        </Card>
      )}
    </div>
  );

  // Gradient Controls Section
  const GradientControls = () => (
    <div className="space-y-4">
      {/* Enable/Disable Gradient */}
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Text Gradient</Label>
        <Button
          variant={textGradient ? "default" : "outline"}
          size="sm"
          onClick={() => {
            if (textGradient) {
              updateAdvancedProperty('textGradient', undefined);
            } else {
              updateAdvancedProperty('textGradient', TextEffects.gradients.sunset);
            }
          }}
        >
          {textGradient ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
          {textGradient ? 'Enabled' : 'Disabled'}
        </Button>
      </div>

      {textGradient && (
        <Card className="p-4 space-y-4">
          {/* Quick Presets */}
          <div>
            <Label className="text-xs text-gray-600 mb-2 block">Quick Presets</Label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(TextEffects.gradients).map(([name, gradient]) => (
                <Button
                  key={name}
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs capitalize"
                  onClick={() => updateAdvancedProperty('textGradient', gradient)}
                >
                  {name}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Controls */}
          <div className="space-y-3">
            <Label className="text-xs text-gray-600">Custom Settings</Label>
            
            {/* Gradient Type */}
            <div>
              <Label className="text-xs font-medium mb-1 block">Gradient Type</Label>
              <Select
                value={textGradient.type}
                onValueChange={(value: 'linear' | 'radial') =>
                  updateAdvancedProperty('textGradient', { ...textGradient, type: value })
                }
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="linear">Linear</SelectItem>
                  <SelectItem value="radial">Radial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Angle (for linear gradients) */}
            {textGradient.type === 'linear' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium">Angle</span>
                  <span className="text-xs text-gray-500">{textGradient.angle || 0}°</span>
                </div>
                <Slider
                  value={[textGradient.angle || 0]}
                  onValueChange={([value]) => 
                    updateAdvancedProperty('textGradient', { ...textGradient, angle: value })
                  }
                  min={0}
                  max={360}
                  step={15}
                  className="w-full"
                />
              </div>
            )}
            
            {/* Colors */}
            <div>
              <Label className="text-xs font-medium mb-2 block">Colors</Label>
              <div className="space-y-2">
                {textGradient.colors.map((color, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-xs w-8">#{index + 1}</span>
                    <div className="flex-1">
                      <ColorPicker
                        color={color}
                        onChange={(newColor) => {
                          const newColors = [...textGradient.colors];
                          newColors[index] = newColor;
                          updateAdvancedProperty('textGradient', { ...textGradient, colors: newColors });
                        }}
                      />
                    </div>
                    {textGradient.colors.length > 2 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => {
                          const newColors = textGradient.colors.filter((_, i) => i !== index);
                          updateAdvancedProperty('textGradient', { ...textGradient, colors: newColors });
                        }}
                      >
                        ×
                      </Button>
                    )}
                  </div>
                ))}
                {textGradient.colors.length < 5 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-6 text-xs"
                    onClick={() => {
                      const newColors = [...textGradient.colors, '#ff0000'];
                      updateAdvancedProperty('textGradient', { ...textGradient, colors: newColors });
                    }}
                  >
                    Add Color
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );

  // Typography Controls Section
  const TypographyControls = () => (
    <div className="space-y-4">
      <Label className="text-sm font-medium">Typography</Label>
      
      <Card className="p-4 space-y-4">
        {/* Letter Spacing */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium">Letter Spacing</span>
            <span className="text-xs text-gray-500">{letterSpacing}px</span>
          </div>
          <Slider
            value={[letterSpacing]}
            onValueChange={([value]) => updateAdvancedProperty('letterSpacing', value)}
            min={-5}
            max={20}
            step={0.5}
            className="w-full"
          />
        </div>
        
        {/* Text Transform */}
        <div>
          <Label className="text-xs font-medium mb-1 block">Text Transform</Label>
          <Select
            value={textTransform}
            onValueChange={(value) => updateAdvancedProperty('textTransform', value)}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Normal</SelectItem>
              <SelectItem value="uppercase">UPPERCASE</SelectItem>
              <SelectItem value="lowercase">lowercase</SelectItem>
              <SelectItem value="capitalize">Capitalize</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="w-full max-w-sm">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-8">
          <TabsTrigger value="shadow" className="text-xs px-1">
            Shadow
          </TabsTrigger>
          <TabsTrigger value="outline" className="text-xs px-1">
            Outline
          </TabsTrigger>
          <TabsTrigger value="gradient" className="text-xs px-1">
            Gradient
          </TabsTrigger>
          <TabsTrigger value="typography" className="text-xs px-1">
            Text
          </TabsTrigger>
        </TabsList>
        
        <div className="mt-4">
          <TabsContent value="shadow" className="mt-0">
            <ShadowControls />
          </TabsContent>
          
          <TabsContent value="outline" className="mt-0">
            <OutlineControls />
          </TabsContent>
          
          <TabsContent value="gradient" className="mt-0">
            <GradientControls />
          </TabsContent>
          
          <TabsContent value="typography" className="mt-0">
            <TypographyControls />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};
