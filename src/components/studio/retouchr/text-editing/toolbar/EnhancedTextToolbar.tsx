"use client";

import React, { useState } from 'react';
import { 
  Type, 
  Palette, 
  Sparkles,
  Wand2,
  Settings,
  ChevronDown,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Import our components
import { BasicTextControls } from './BasicTextControls';
import { AdvancedTextControls } from './AdvancedTextControls';
import { TextEffectPresets } from '../presets/TextEffectPresets';
import { useAdvancedText } from '../AdvancedTextContext';

interface EnhancedTextToolbarProps {
  isVisible: boolean;
  position: { top: number; left: number };
}

/**
 * Enhanced text toolbar with professional-grade features
 */
export const EnhancedTextToolbar: React.FC<EnhancedTextToolbarProps> = ({
  isVisible,
  position
}) => {
  const {
    textProperties,
    updateTextProperty,
    updateAdvancedProperty,
    addNewAdvancedText,
    applyAdvancedPreset,
    getActiveAdvancedText
  } = useAdvancedText();

  const [activeTab, setActiveTab] = useState('basic');
  const [showPresets, setShowPresets] = useState(false);

  if (!isVisible) return null;

  const activeText = getActiveAdvancedText();
  const hasAdvancedFeatures = activeText && (
    activeText.textShadow || 
    activeText.textOutline || 
    activeText.textGradient ||
    activeText.padding > 0 ||
    activeText.borderRadius > 0
  );

  return (
    <div
      className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg"
      style={{
        top: position.top - 8,
        left: position.left,
        transform: 'translateY(-100%)',
      }}
    >
      <div className="flex items-center gap-1 p-2">
        {/* Add New Text Button */}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 gap-1"
          onClick={() => addNewAdvancedText()}
        >
          <Plus className="h-3 w-3" />
          <span className="text-xs">Add Text</span>
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* Text Effects Presets */}
        <Popover open={showPresets} onOpenChange={setShowPresets}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 gap-1"
            >
              <Wand2 className="h-3 w-3" />
              <span className="text-xs">Presets</span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 p-4" align="start">
            <TextEffectPresets onApplyPreset={applyAdvancedPreset} />
          </PopoverContent>
        </Popover>

        <Separator orientation="vertical" className="h-6" />

        {/* Main Controls Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
          <TabsList className="h-7 p-0 bg-gray-100">
            <TabsTrigger value="basic" className="h-6 px-2 text-xs">
              <Type className="h-3 w-3 mr-1" />
              Basic
            </TabsTrigger>
            <TabsTrigger value="advanced" className="h-6 px-2 text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              Effects
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Separator orientation="vertical" className="h-6" />

        {/* Advanced Effects Indicator */}
        {hasAdvancedFeatures && (
          <div className="flex items-center gap-1 px-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-blue-600 font-medium">Enhanced</span>
          </div>
        )}
      </div>

      <Separator />

      {/* Tab Content */}
      <div className="p-3 min-w-[400px]">
        <Tabs value={activeTab} className="w-full">
          <TabsContent value="basic" className="mt-0">
            <BasicTextControls
              textProperties={textProperties}
              updateTextProperty={updateTextProperty}
            />
          </TabsContent>
          
          <TabsContent value="advanced" className="mt-0">
            <AdvancedTextControls
              textProperties={textProperties}
              textShadow={textProperties.textShadow}
              textOutline={textProperties.textOutline}
              textGradient={textProperties.textGradient}
              letterSpacing={textProperties.letterSpacing}
              textTransform={textProperties.textTransform}
              updateAdvancedProperty={updateAdvancedProperty}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Quick Actions Footer */}
      <div className="border-t bg-gray-50 p-2 rounded-b-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => updateAdvancedProperty('textShadow', {
                offsetX: 2, offsetY: 2, blur: 4, color: 'rgba(0,0,0,0.3)'
              })}
            >
              + Shadow
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => updateAdvancedProperty('textOutline', {
                width: 2, color: '#000000'
              })}
            >
              + Outline
            </Button>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
            onClick={() => {
              updateAdvancedProperty('textShadow', null);
              updateAdvancedProperty('textOutline', null);
              updateAdvancedProperty('textGradient', null);
              updateAdvancedProperty('padding', 0);
              updateAdvancedProperty('borderRadius', 0);
            }}
          >
            Clear Effects
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedTextToolbar;
