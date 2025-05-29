"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { useUnifiedText } from './UnifiedTextContext';
import { Sparkles, Palette, Settings2, X } from 'lucide-react';
import { AdvancedTextControls } from './toolbar/AdvancedTextControls';
import { TextEffectPresets } from './presets/TextEffectPresets';

/**
 * Unified effects panel for text
 * Works directly with fabric.IText without requiring class conversion
 */
export const UnifiedEffectsPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'presets' | 'controls'>('presets');
  
  // Fixed position styles
  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    right: '12px',
    top: '64px',
    zIndex: 50,
  };
  
  // Try to use the unified text context - this will throw an error if not inside a provider
  try {
    const { 
      textProperties, 
      updateTextProperty, 
      applyTextPreset,
      hasTextEffects,
      getActiveText
    } = useUnifiedText();

    // Get active text to check for effects
    const activeText = getActiveText();
    
    // Don't render anything if no text is selected
    if (!activeText) {
      return null;
    }
    
    // Check if text has any effects applied
    const hasEffects = hasTextEffects(activeText);

    return (
      <div style={panelStyle}>
        <Popover 
          open={isOpen} 
          onOpenChange={(open) => {
            // Only allow closing via the close button or escape key
            // This prevents accidental closing during slider interactions
            if (!open && isOpen) {
              // Check if it's from a click on the close button
              const activeElement = document.activeElement;
              if (activeElement?.closest('button[data-close-button="true"]')) {
                setIsOpen(false);
              } else {
                // Prevent closing in other cases to keep the panel open during slider interactions
                return;
              }
            } else {
              setIsOpen(open);
            }
          }}
        >
          <PopoverTrigger asChild>
            <Button
              variant={hasEffects ? "default" : "ghost"}
              size="sm"
              className="h-7 px-2 gap-1 shadow-md bg-white/95 dark:bg-gray-800/95"
              title="Text Effects"
            >
              <Sparkles className="h-3 w-3" />
              <span className="text-xs hidden sm:inline">Effects</span>
              {hasEffects && (
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full ml-1" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-96 p-0" 
            align="start"
            // Prevent any outside clicks from closing the popover
            onPointerDownOutside={(e) => e.preventDefault()}
            // Also prevent interaction outside from closing
            onInteractOutside={(e) => e.preventDefault()}
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
                    data-close-button="true"
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
                      applyTextPreset(preset);
                      // Keep panel open so user can see the effect
                    }} 
                  />
                ) : (
                  <div className="space-y-4">
                    <AdvancedTextControls
                      canvas={null} // Not needed for our implementation
                      textProperties={{
                        ...textProperties,
                        // Cast textAlign to the expected type
                        textAlign: textProperties.textAlign as 'left' | 'center' | 'right' | 'justify'
                      }}
                      // Pass the active text effects directly from the text object
                      textShadow={activeText.textShadow}
                      textOutline={activeText.textOutline}
                      textGradient={activeText.textGradient}
                      letterSpacing={activeText.letterSpacing || 0}
                      textTransform={activeText.textTransform || 'none'}
                      updateTextProperty={(property, value) => {
                        updateTextProperty(property as any, value);
                        
                        // Apply refresh for immediate visual feedback
                        if (activeText && activeText.refreshObject) {
                          setTimeout(() => {
                            activeText.refreshObject();
                          }, 10);
                        }
                      }}
                      // Add the required updateAdvancedProperty prop
                      updateAdvancedProperty={(property, value) => {
                        updateTextProperty(property as any, value);
                        
                        // Apply refresh for immediate visual feedback
                        if (activeText && activeText.refreshObject) {
                          setTimeout(() => {
                            activeText.refreshObject();
                          }, 10);
                        }
                      }}
                    />
                    
                    {hasEffects && (
                      <>
                        <Separator />
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            applyTextPreset({
                              textShadow: undefined,
                              textOutline: undefined,
                              textGradient: undefined,
                              backgroundColor: undefined,
                              padding: 0,
                              borderRadius: 0,
                              letterSpacing: 0,
                              textTransform: 'none'
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
      </div>
    );
  } catch (error) {
    // If we're not inside a UnifiedTextProvider, don't render anything
    // This prevents the runtime error
    return null;
  }
};
