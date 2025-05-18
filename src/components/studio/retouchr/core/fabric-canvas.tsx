"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { fabric } from '../utils/fabric-imports';
import dynamic from 'next/dynamic';

export interface FabricCanvasProps {
  width: number;
  height: number;
  backgroundColor?: string;
  initialJSON?: string;
  onCanvasReady?: (canvas: fabric.Canvas) => void;
  onSelectionChange?: (selected: fabric.Object[]) => void;
  onObjectModified?: (target: fabric.Object) => void;
}

export const FabricCanvas: React.FC<FabricCanvasProps> = ({
  width,
  height,
  backgroundColor = '#ffffff',
  initialJSON,
  onCanvasReady,
  onSelectionChange,
  onObjectModified,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasInstanceRef = useRef<fabric.Canvas | null>(null);
  
  // Canvas initialization
  useEffect(() => {
    // Safety check for browser environment
    if (typeof window === 'undefined' || !canvasRef.current) return;
    
    // Safely create canvas with error handling
    let canvas;
    try {
      // Create new canvas instance
      canvas = new fabric.Canvas(canvasRef.current, {
        width,
        height,
        backgroundColor,
        preserveObjectStacking: true,
      });
    } catch (error) {
      console.error('Error initializing Fabric.js canvas:', error);
      return;
    }
    
    // Store reference
    canvasInstanceRef.current = canvas;
    
    // Load initial data if available
    if (initialJSON) {
      try {
        canvas.loadFromJSON(initialJSON, () => {
          canvas.renderAll();
        });
      } catch (error) {
        console.error('Error loading canvas data:', error);
      }
    }
    
    // Setup event handlers
    canvas.on('selection:created', handleSelectionChange);
    canvas.on('selection:updated', handleSelectionChange);
    canvas.on('selection:cleared', handleSelectionChange);
    canvas.on('object:modified', handleObjectModified);
    
    // Notify parent component
    if (onCanvasReady) {
      onCanvasReady(canvas);
    }
    
    // Cleanup
    return () => {
      canvas.off('selection:created', handleSelectionChange);
      canvas.off('selection:updated', handleSelectionChange);
      canvas.off('selection:cleared', handleSelectionChange);
      canvas.off('object:modified', handleObjectModified);
      canvas.dispose();
    };
  }, [width, height, backgroundColor]);
  
  // Event handlers
  const handleSelectionChange = useCallback(() => {
    if (!canvasInstanceRef.current || !onSelectionChange) return;
    
    const selected = canvasInstanceRef.current.getActiveObjects();
    onSelectionChange(selected);
  }, [onSelectionChange]);
  
  const handleObjectModified = useCallback((e: fabric.IEvent) => {
    if (!onObjectModified || !e.target) return;
    onObjectModified(e.target);
  }, [onObjectModified]);
  
  return <canvas ref={canvasRef} />;
};
