"use client";

import React, { useState } from 'react';
import { useCanvas } from '../hooks/use-canvas';
import { useUnifiedText } from './UnifiedTextContext';
import { Portal } from './Portal';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

// Import modular toolbar components
import {
  FontSelector,
  TextFormattingControls,
  AlignmentControls,
  ColorControl, 
  TextCaseControl,
  TextPresetsControl,
  StyleControls,
  QCEffectsControls
} from './toolbar';

// Import advanced text controls and presets
import { AdvancedTextControls } from './toolbar/AdvancedTextControls';
import { TextEffectPresets } from './presets/TextEffectPresets';

// Icons
import { Sparkles, Palette, Settings2, X } from 'lucide-react';

/**
 * Unified floating toolbar for text editing
 * Combines basic text editing with advanced effects in a streamlined interface
 */
export const UnifiedFloatingTextbar: React.FC = () => {
  // Initialize state for popover and tabs
  const [effectsOpen, setEffectsOpen] = useState(false);
  const [activeEffectsTab, setActiveEffectsTab] = useState<'presets' | 'controls'>('presets');
  
  // Try to use the canvas context - this is always available
  const { canvas, selectedObjects } = useCanvas();
  
  // Try to use the unified text context - this will throw an error if not inside a provider
  try {
    const { 
      textProperties, 
      updateTextProperty, 
      editMode,
      applyTextPreset,
      hasTextEffects,
      getActiveText
    } = useUnifiedText();
    
    // Don't render if no text is selected or we're not in the right mode
    if (editMode === 'none' || !selectedObjects.length) {
      return null;
    }
    
    // Make sure we have a text object selected
    const activeObject = canvas?.getActiveObject();
    if (!activeObject?.type?.includes('text')) {
      return null;
    }

    // Get active text to check for effects
    const activeText = getActiveText();
    if (!activeText) {
      return null;
    }
    
    // Check if text has any effects applied
    const hasEffects = hasTextEffects(activeText);

    // Create wrapper for updateTextProperty to fix TypeScript compatibility
    const updateTextPropertyWrapper = (property: string, value: any) => {
      updateTextProperty(property as any, value);
    };
    
    // Common props for toolbar components
    const toolbarProps = {
      canvas,
      textProperties: {
        ...textProperties,
        // Cast textAlign to the expected type
        textAlign: textProperties.textAlign as 'left' | 'center' | 'right' | 'justify' | undefined
      },
      updateTextProperty: updateTextPropertyWrapper
    };

    // Custom separator component with better styling
    const CustomSeparator = () => (
      <div className="h-6 w-px bg-gray-200 mx-1.5" />
    );

    return (
      <Portal>
        <div 
          className="bg-white/95 dark:bg-gray-800/95 shadow-lg rounded-lg border border-border p-1 flex items-center gap-1 backdrop-blur-sm transition-all duration-150 animate-in fade-in slide-in-from-top-2 z-50"
          style={{ 
            position: 'fixed',
            left: '50%', 
            top: '5px',
            transform: 'translateX(-50%)',
            maxWidth: '96vw',
            overflowX: 'auto',
            scrollbarWidth: 'thin',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            padding: '4px 8px'
          }}
        >
          {/* Font Selection */}
          <FontSelector {...toolbarProps} />
          <CustomSeparator />

          {/* Text Formatting */}
          <TextFormattingControls {...toolbarProps} />
          <CustomSeparator />

          {/* Text Color */}
          <ColorControl {...toolbarProps} property="fill" allowTransparent={false} />
          <CustomSeparator />

          {/* Alignment */}
          <AlignmentControls {...toolbarProps} />
          <CustomSeparator />

          {/* Text Case */}
          <TextCaseControl {...toolbarProps} />
          <CustomSeparator />

          {/* Style Controls (Background, Padding, Border Radius) */}
          <StyleControls {...toolbarProps} />
          <CustomSeparator />

          {/* Quick Effect Controls */}
          <QCEffectsControls 
            {...toolbarProps}
            textShadow={activeText.textShadow}
            textOutline={activeText.textOutline}
            textGradient={activeText.textGradient}
            onApplyEffect={(property, value) => {
              // Update the property in state
              updateTextProperty(property as any, value);
              
              // Apply a double refresh cycle for better rendering
              if (activeText && activeText.refreshObject) {
                // First immediate refresh
                activeText.refreshObject();
                
                // Second delayed refresh to ensure complete rendering
                setTimeout(() => {
                  if (activeText) {
                    // Use type casting to access fabric.js properties that aren't in TypeScript definitions
                    const fabricText = activeText as any;
                    
                    if (fabricText.canvas) {
                      // Clear any fabric.js caches
                      if (typeof fabricText._clearCache === 'function') {
                        fabricText._clearCache();
                      }
                      
                      // Apply another refresh
                      activeText.refreshObject();
                      fabricText.canvas.renderAll();
                    }
                  }
                }, 100);
              }
            }}
          />
          <CustomSeparator />

          {/* Advanced Effects Panel */}
          <Popover 
            open={effectsOpen} 
            onOpenChange={(open) => {
              // Only allow closing via the close button or escape key
              // This prevents accidental closing during slider interactions
              if (!open && effectsOpen) {
                // Check if it's from a click on the close button
                const activeElement = document.activeElement;
                if (activeElement?.closest('button[data-close-button="true"]')) {
                  setEffectsOpen(false);
                } else {
                  // Prevent closing in other cases to keep the panel open during slider interactions
                  return;
                }
              } else {
                setEffectsOpen(open);
              }
            }}
          >
            <PopoverTrigger asChild>
              <Button
                variant={hasEffects ? "default" : "ghost"}
                size="sm"
                className="h-7 px-2 gap-1"
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
                        variant={activeEffectsTab === 'presets' ? 'default' : 'ghost'}
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => setActiveEffectsTab('presets')}
                      >
                        <Palette className="h-3 w-3 mr-1" />
                        Presets
                      </Button>
                      <Button
                        variant={activeEffectsTab === 'controls' ? 'default' : 'ghost'}
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => setActiveEffectsTab('controls')}
                      >
                        <Settings2 className="h-3 w-3 mr-1" />
                        Customize
                      </Button>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => setEffectsOpen(false)}
                      data-close-button="true"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  {activeEffectsTab === 'presets' ? (
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
          <CustomSeparator />

          {/* Text Presets */}
          <TextPresetsControl {...toolbarProps} applyTextPreset={applyTextPreset} />
        </div>
      </Portal>
    );
  } catch (error) {
    // If we're not inside a UnifiedTextProvider, don't render anything
    // This prevents the runtime error
    return null;
  }
};
