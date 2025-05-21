"use client";

import { useEffect, useCallback } from 'react';
import { fabric } from '../../utils/fabric-imports';
import { getLayerName } from '../core/utils';

/**
 * Hook for managing dynamic layer names from fabric.js objects
 */
export function useLayerNames(
  canvas: fabric.Canvas | null,
  updateLayerName: (id: string, name: string) => void
) {
  // Update a layer's name based on its fabric object content
  const updateNameFromObject = useCallback((obj: any) => {
    if (!obj || !obj.id) return;
    
    // Get the dynamic name based on object type and content
    const name = getLayerName(obj, 0);
    
    // Update the layer name in state
    updateLayerName(obj.id, name);
  }, [updateLayerName]);

  // Set up event listeners for text changes
  useEffect(() => {
    if (!canvas) return;
    
    // Handler for text content changes
    const handleTextChanged = (e: any) => {
      if (!e || !e.target) return;
      updateNameFromObject(e.target);
    };
    
    // Handler for when text editing is completed
    const handleTextEditingExited = (e: any) => {
      if (!e || !e.target) return;
      updateNameFromObject(e.target);
    };
    
    // Listen for text content changes
    canvas.on('text:changed', handleTextChanged);
    canvas.on('text:editing:exited', handleTextEditingExited);
    
    // Handle image loads to update names
    const handleImageLoaded = (e: any) => {
      if (!e || !e.target) return;
      updateNameFromObject(e.target);
    };
    
    canvas.on('object:modified', (e: any) => {
      if (e.target && e.target.type === 'image') {
        updateNameFromObject(e.target);
      }
    });
    
    // Initial update for all objects
    canvas.getObjects().forEach(updateNameFromObject);
    
    // Cleanup event handlers
    return () => {
      canvas.off('text:changed', handleTextChanged);
      canvas.off('text:editing:exited', handleTextEditingExited);
      canvas.off('object:modified', (e: any) => {
        if (e?.target?.type === 'image') {
          updateNameFromObject(e.target);
        }
      });
    };
  }, [canvas, updateNameFromObject]);

  return {
    updateNameFromObject
  };
}
