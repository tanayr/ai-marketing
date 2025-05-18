"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { CanvasProvider, useCanvas } from './hooks/use-canvas';
import { fabric, FabricCanvas } from './utils/fabric-imports';
import { FabricCanvas as FabricCanvasComponent } from './core/fabric-canvas';
import { Toolbar } from './toolbar/toolbar';
import { Button } from '@/components/ui/button';
import { Undo, Redo, ZoomIn, ZoomOut } from 'lucide-react';
import { useHotkeys } from 'react-hotkeys-hook';
import { toast } from 'sonner';
import { RetouchrAsset } from './types';

interface RetouchrStudioProps {
  assetId?: string;
  initialData?: any;
  onSave?: (data: any) => Promise<void>;
}

// Main Studio wrapper component
export const RetouchrStudio: React.FC<RetouchrStudioProps> = ({
  assetId,
  initialData,
  onSave,
}) => {
  return (
    <CanvasProvider>
      <RetouchrStudioContent
        assetId={assetId}
        initialData={initialData}
        onSave={onSave}
      />
    </CanvasProvider>
  );
};

// Inner content component that uses the canvas context
const RetouchrStudioContent: React.FC<RetouchrStudioProps> = ({
  assetId,
  initialData,
  onSave,
}) => {
  const { 
    canvas, 
    setCanvas, 
    saveCanvas, 
    isSaving, 
    setIsSaving 
  } = useCanvas();
  
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const [currentState, setCurrentState] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  
  // Initialize history when canvas is ready
  useEffect(() => {
    if (canvas && initialData?.fabricCanvas) {
      const initialJson = JSON.stringify(initialData.fabricCanvas);
      setCurrentState(initialJson);
      setUndoStack([initialJson]);
    }
  }, [canvas, initialData]);
  
  // Record history on object modifications
  useEffect(() => {
    if (!canvas) return;
    
    const handleObjectModified = () => {
      const json = JSON.stringify(canvas.toJSON(['id', 'name']));
      
      if (json !== currentState) {
        setUndoStack(prev => [...prev, json]);
        setRedoStack([]);
        setCurrentState(json);
      }
    };
    
    canvas.on('object:modified', handleObjectModified);
    canvas.on('object:added', handleObjectModified);
    canvas.on('object:removed', handleObjectModified);
    
    return () => {
      canvas.off('object:modified', handleObjectModified);
      canvas.off('object:added', handleObjectModified);
      canvas.off('object:removed', handleObjectModified);
    };
  }, [canvas, currentState]);
  
  // Handle undo
  const handleUndo = useCallback(() => {
    if (!canvas || undoStack.length <= 1) return;
    
    // Get the previous state
    const newUndoStack = [...undoStack];
    const currentJson = newUndoStack.pop();
    
    if (currentJson && newUndoStack.length > 0) {
      const previousJson = newUndoStack[newUndoStack.length - 1];
      
      // Add current state to redo stack
      setRedoStack(prev => [...prev, currentJson]);
      
      // Apply previous state
      canvas.loadFromJSON(previousJson, () => {
        canvas.renderAll();
      });
      
      setUndoStack(newUndoStack);
      setCurrentState(previousJson);
    }
  }, [canvas, undoStack]);
  
  // Handle redo
  const handleRedo = useCallback(() => {
    if (!canvas || redoStack.length === 0) return;
    
    // Get next state
    const newRedoStack = [...redoStack];
    const nextJson = newRedoStack.pop();
    
    if (nextJson) {
      // Add current state to undo stack
      setUndoStack(prev => [...prev, nextJson]);
      
      // Apply next state
      canvas.loadFromJSON(nextJson, () => {
        canvas.renderAll();
      });
      
      setRedoStack(newRedoStack);
      setCurrentState(nextJson);
    }
  }, [canvas, redoStack]);
  
  // Handle zooming
  const handleZoomIn = useCallback(() => {
    if (!canvas) return;
    
    const newZoom = Math.min(zoom + 0.1, 3);
    setZoom(newZoom);
    
    canvas.setZoom(newZoom);
    canvas.renderAll();
  }, [canvas, zoom]);
  
  const handleZoomOut = useCallback(() => {
    if (!canvas) return;
    
    const newZoom = Math.max(zoom - 0.1, 0.1);
    setZoom(newZoom);
    
    canvas.setZoom(newZoom);
    canvas.renderAll();
  }, [canvas, zoom]);
  
  // Handle save
  const handleSave = useCallback(async () => {
    if (!canvas || !onSave) return;
    
    try {
      setIsSaving(true);
      const canvasJSON = saveCanvas();
      
      // Log the canvas JSON being saved (frontend)
      console.log('FRONTEND: Saving canvas JSON:', canvasJSON);
      console.log('FRONTEND: JSON preview:', JSON.parse(canvasJSON));
      
      const result = await onSave({
        canvasJSON,
        createVersion: true,
      });
      
      // Log the response from the save operation
      console.log('FRONTEND: Save response:', result);
      
      toast.success("Design saved successfully");
    } catch (error) {
      console.error("Error saving design:", error);
      toast.error("Failed to save design");
    } finally {
      setIsSaving(false);
    }
  }, [canvas, onSave, saveCanvas, setIsSaving]);
  
  // Keyboard shortcuts
  useHotkeys('ctrl+z, cmd+z', (e) => {
    e.preventDefault();
    handleUndo();
  });
  
  useHotkeys('ctrl+y, cmd+shift+z', (e) => {
    e.preventDefault();
    handleRedo();
  });
  
  useHotkeys('ctrl+s, cmd+s', (e) => {
    e.preventDefault();
    handleSave();
  });
  
  // Handle canvas ready
  const handleCanvasReady = (canvasInstance: FabricCanvas) => {
    setCanvas(canvasInstance);
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Toolbar */}
      <Toolbar onSave={handleSave} isSaving={isSaving} />
      
      {/* Canvas area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Canvas toolbar */}
        <div className="h-12 border-b flex items-center justify-between px-4">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleUndo}
              disabled={undoStack.length <= 1}
              title="Undo (Ctrl+Z)"
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              title="Redo (Ctrl+Y)"
            >
              <Redo className="h-4 w-4" />
            </Button>
            
            <div className="text-xs text-muted-foreground hidden sm:inline-block ml-2">
              <kbd className="px-1 py-0.5 bg-muted rounded border">Ctrl+Z</kbd> Undo / 
              <kbd className="px-1 py-0.5 bg-muted rounded border">Ctrl+Y</kbd> Redo
            </div>
          </div>
          
          <div>
            <span className="text-sm font-medium">
              {assetId ? 'Editing Design' : 'New Design'}
            </span>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center">
              <Button
                variant="outline"
                size="icon"
                onClick={handleZoomOut}
                disabled={zoom <= 0.2}
                title="Zoom Out"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm w-12 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={handleZoomIn}
                disabled={zoom >= 3}
                title="Zoom In"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center gap-1.5">
              <div className="text-xs text-muted-foreground hidden md:inline-block">
                <kbd className="px-1 py-0.5 bg-muted rounded border">Ctrl+S</kbd>
              </div>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-green-600 text-white hover:bg-green-700"
                size="sm"
              >
                {isSaving ? (
                  <>
                    <span className="mr-1 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                    Saving...
                  </>
                ) : (
                  <>Save Design</>
                )}
              </Button>
            </div>
          </div>
        </div>
        
        {/* Canvas container */}
        <div className="flex-1 overflow-auto bg-muted/30 flex items-center justify-center p-6">
          <div className="shadow-lg">
            <FabricCanvasComponent
              width={initialData?.content?.fabricCanvas?.width || 800}
              height={initialData?.content?.fabricCanvas?.height || 600}
              backgroundColor={initialData?.content?.fabricCanvas?.background || '#ffffff'}
              initialJSON={initialData?.content?.fabricCanvas ? JSON.stringify(initialData.content.fabricCanvas) : undefined}
              onCanvasReady={handleCanvasReady}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
