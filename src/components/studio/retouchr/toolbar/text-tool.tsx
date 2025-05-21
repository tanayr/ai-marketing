"use client";

import React from 'react';
import { TextFormattingProvider } from '../text-editing/TextFormattingContext';
import { TextPresetSidebar } from '../text-editing/TextPresetSidebar';

// Import the fabric utils for types
import { FabricTextProperties } from './text-tool-fabric-utils';

/**
 * TextTool component is now a simpler wrapper around the TextPresetSidebar
 * which only shows preset text styles. All the formatting controls have been
 * moved to the floating toolbar that appears when text is selected.
 */
export const TextTool: React.FC = () => {
  return (
    <TextFormattingProvider>
      <TextPresetSidebar />
    </TextFormattingProvider>
  );

  return (
    <>
      {/* The component now returns only the TextPresetSidebar wrapped in the context provider */}
    </>
  );
};

/**
 * NOTE: The FloatingTextToolbar component will be integrated directly into RetouchrStudio
 * so it can be positioned over the canvas, independent of the sidebar.
 */