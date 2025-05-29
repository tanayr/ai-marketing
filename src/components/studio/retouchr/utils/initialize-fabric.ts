"use client";

import { extendFabricIText } from './text-extensions';
import { registerEnhancedTextProperties } from './fabric-imports';

/**
 * Initialize all Fabric.js enhancements
 * Call this function once at app startup
 */
export function initializeFabric() {
  // Extend IText with all advanced features
  extendFabricIText();
  
  // Register custom properties for fabric serialization
  registerEnhancedTextProperties();
  
  console.log('Fabric.js extensions initialized');
}
