"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { AdvancedTextControls } from './toolbar/AdvancedTextControls';
import { TextEffectPresets } from './presets/TextEffectPresets';
import { useAdvancedText } from './AdvancedTextContext';
import { useCanvas } from '../hooks/use-canvas';
import { Sparkles, Palette, Settings2, X } from 'lucide-react';

/**
 * Separate panel for advanced text effects to keep toolbar clean
 */
export const AdvancedEffectsPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'presets' | 'controls'>('presets');
  
  const { canvas } = useCanvas();
  const {
    textProperties: advancedTextProperties,
    updateAdvancedProperty,
    applyAdvancedPreset,
    getActiveAdvancedText,
  } = useAdvancedText();

  const activeAdvancedText = getActiveAdvancedText();
  const hasAdvancedFeatures = activeAdvancedText && (
    activeAdvancedText.textShadow || 
    activeAdvancedText.textOutline || 
    activeAdvancedText.textGradient ||
    activeAdvancedText.padding > 0 ||
    activeAdvancedText.borderRadius > 0
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={hasAdvancedFeatures ? "default" : "ghost"}
          size="sm"
          className="h-7 px-2 gap-1"
          title="Advanced Text Effects"
        >
          <Sparkles className="h-3 w-3" />
          <span className="text-xs hidden sm:inline">Effects</span>
          {hasAdvancedFeatures && (
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full ml-1" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-96 p-0" 
        align="start"
        onPointerDownOutside={(e) => {
          // Prevent closing when interacting with color pickers or sliders
          const target = e.target as Element;
          if (target.closest('input[type="color"]') || target.closest('input[type="range"]')) {
            e.preventDefault();
          }
        }}
      >
        <div className="bg-white rounded-lg shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b">
            <h3 className="font-semibold text-sm">Text Effects</h3>
            <div className="flex items-center gap-2">
              {/* Tab buttons */}
              <div className="flex bg-gray-100 rounded p-0.5">
                <Button
                  variant={activeTab === 'presets' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => setActiveTab('presets')}
                >
                  <Palette className="h-3 w-3 mr-1" />
                  Presets
                </Button>
                <Button
                  variant={activeTab === 'controls' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => setActiveTab('controls')}
                >
                  <Settings2 className="h-3 w-3 mr-1" />
                  Customize
                </Button>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            {activeTab === 'presets' ? (
              <TextEffectPresets 
                onApplyPreset={(preset) => {
                  applyAdvancedPreset(preset);
                  // Keep panel open so user can see the effect
                }} 
              />
            ) : (
              <div className="space-y-4">
                <AdvancedTextControls
                  canvas={canvas}
                  textProperties={advancedTextProperties}
                  updateTextProperty={updateAdvancedProperty}
                  textShadow={activeAdvancedText?.textShadow}
                  textOutline={activeAdvancedText?.textOutline}
                  textGradient={activeAdvancedText?.textGradient}
                  letterSpacing={activeAdvancedText?.letterSpacing || 0}
                  textTransform={activeAdvancedText?.textTransform || 'none'}
                  updateAdvancedProperty={(property: string, value: any) => {
                    updateAdvancedProperty(property, value);
                    
                    // Apply micro-scaling refresh for immediate visual feedback
                    if (activeAdvancedText && activeAdvancedText._refreshObject) {
                      setTimeout(() => {
                        activeAdvancedText._refreshObject();
                      }, 10);
                    }
                  }}
                />
                
                {hasAdvancedFeatures && (
                  <>
                    <Separator />
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        applyAdvancedPreset({
                          textShadow: undefined,
                          textOutline: undefined,
                          textGradient: undefined,
                          backgroundColor: undefined,
                          padding: 0,
                          borderRadius: 0
                        });
                      }}
                    >
                      Clear All Effects
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
