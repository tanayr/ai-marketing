"use client";

import React, { useEffect, useState } from 'react';
import { useCanvas } from '../hooks/use-canvas';
import { fabric, FabricObject, FabricText } from '../utils/fabric-imports';
import { Button } from '@/components/ui/button';
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Trash2, 
  Eye, 
  EyeOff,
  Copy
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

// Interface for layer data
interface LayerItem {
  id: string | number;
  name: string;
  type: string;
  object: FabricObject;
  visible: boolean;
}

export const LayersTool: React.FC = () => {
  const { canvas, selectedObjects } = useCanvas();
  const [layers, setLayers] = useState<LayerItem[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | number | null>(null);
  
  // Update layers when canvas changes
  useEffect(() => {
    if (!canvas) return;
    
    const updateLayersList = () => {
      const objects = canvas.getObjects();
      const newLayers = objects.map((obj: FabricObject, index: number) => ({
        id: obj.id || `layer-${index}`,
        name: getLayerName(obj, index),
        type: obj.type || 'unknown',
        object: obj,
        visible: obj.visible !== false
      }));
      
      setLayers(newLayers.reverse()); // Reverse to match canvas stacking order
    };
    
    // Register events
    canvas.on('object:added', updateLayersList);
    canvas.on('object:removed', updateLayersList);
    canvas.on('object:modified', updateLayersList);
    
    // Initial load
    updateLayersList();
    
    return () => {
      canvas.off('object:added', updateLayersList);
      canvas.off('object:removed', updateLayersList);
      canvas.off('object:modified', updateLayersList);
    };
  }, [canvas]);
  
  // Update selected layer when selection changes
  useEffect(() => {
    if (selectedObjects.length === 1) {
      const obj = selectedObjects[0];
      const id = obj.id || '';
      setSelectedLayerId(id);
    } else {
      setSelectedLayerId(null);
    }
  }, [selectedObjects]);
  
  // Get name for layer
  const getLayerName = (obj: FabricObject, index: number): string => {
    if (obj.type === 'text') {
      // Safe type assertion with a runtime check
      const text = obj as unknown as FabricText;
      const content = text.text || '';
      return content.length > 15 ? `${content.substring(0, 15)}...` : content;
    }
    
    if (obj.type === 'image') {
      return `Image ${index + 1}`;
    }
    
    if (obj.type === 'rect') {
      return `Shape ${index + 1}`;
    }
    
    return `Layer ${index + 1}`;
  };
  
  // Select a layer
  const selectLayer = (layer: LayerItem) => {
    if (!canvas) return;
    
    canvas.setActiveObject(layer.object);
    canvas.renderAll();
    setSelectedLayerId(layer.id);
  };
  
  // Toggle layer visibility
  const toggleLayerVisibility = (layer: LayerItem) => {
    if (!canvas) return;
    
    const isVisible = layer.object.visible !== false;
    layer.object.set({visible: !isVisible});
    canvas.renderAll();
    
    // Update layers
    setLayers(prev => prev.map(item => 
      item.id === layer.id 
        ? { ...item, visible: !isVisible } 
        : item
    ));
  };
  
  // Move layer up
  const moveLayerUp = (layer: LayerItem) => {
    if (!canvas) return;
    
    layer.object.bringForward();
    canvas.renderAll();
    
    // Update layers list to reflect the new order
    const objects = canvas.getObjects();
    const newLayers = objects.map((obj: FabricObject, index: number) => ({
      id: obj.id || `layer-${index}`,
      name: getLayerName(obj, index),
      type: obj.type || 'unknown',
      object: obj,
      visible: obj.visible !== false
    }));
    
    setLayers(newLayers.reverse());
  };
  
  // Move layer down
  const moveLayerDown = (layer: LayerItem) => {
    if (!canvas) return;
    
    layer.object.sendBackwards();
    canvas.renderAll();
    
    // Update layers list to reflect the new order
    const objects = canvas.getObjects();
    const newLayers = objects.map((obj: FabricObject, index: number) => ({
      id: obj.id || `layer-${index}`,
      name: getLayerName(obj, index),
      type: obj.type || 'unknown',
      object: obj,
      visible: obj.visible !== false
    }));
    
    setLayers(newLayers.reverse());
  };
  
  // Delete layer
  const deleteLayer = (layer: LayerItem) => {
    if (!canvas) return;
    
    canvas.remove(layer.object);
    canvas.renderAll();
  };
  
  // Duplicate layer
  const duplicateLayer = (layer: LayerItem) => {
    if (!canvas) return;
    
    layer.object.clone((cloned: fabric.Object) => {
      cloned.set({
        left: (layer.object.left || 0) + 20,
        top: (layer.object.top || 0) + 20,
        evented: true,
      });
      
      canvas.add(cloned);
      canvas.setActiveObject(cloned);
      canvas.renderAll();
    });
  };

  return (
    <div className="space-y-4 p-4">
      <h3 className="font-medium text-sm">Layers</h3>
      
      <ScrollArea className="h-[300px] pr-4">
        <div className="space-y-2">
          {layers.length === 0 ? (
            <div className="text-center py-3 text-muted-foreground text-sm">
              No layers added yet
            </div>
          ) : (
            layers.map(layer => (
              <div 
                key={String(layer.id)}
                className={`
                  p-2 rounded border
                  ${selectedLayerId === layer.id ? 'border-primary bg-primary/5' : 'border-border'}
                  ${!layer.visible ? 'opacity-50' : ''}
                  transition-colors
                `}
                onClick={() => selectLayer(layer)}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {/* Layer icon based on type */}
                    <span className="text-xs font-mono px-1.5 py-0.5 bg-muted rounded">
                      {layer.type.charAt(0).toUpperCase()}
                    </span>
                    
                    {/* Layer name */}
                    <span className="text-sm truncate max-w-[100px]">
                      {layer.name}
                    </span>
                  </div>
                  
                  <div className="flex gap-1">
                    {/* Layer controls */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLayerVisibility(layer);
                      }}
                    >
                      {layer.visible ? 
                        <Eye className="h-3.5 w-3.5" /> : 
                        <EyeOff className="h-3.5 w-3.5" />
                      }
                    </Button>
                  </div>
                </div>
                
                {/* Additional buttons that show only when selected */}
                {selectedLayerId === layer.id && (
                  <div className="flex gap-1 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 flex-1 text-xs"
                      onClick={() => moveLayerUp(layer)}
                    >
                      <ArrowUpCircle className="h-3.5 w-3.5 mr-1" />
                      Up
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 flex-1 text-xs"
                      onClick={() => moveLayerDown(layer)}
                    >
                      <ArrowDownCircle className="h-3.5 w-3.5 mr-1" />
                      Down
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 flex-1 text-xs"
                      onClick={() => duplicateLayer(layer)}
                    >
                      <Copy className="h-3.5 w-3.5 mr-1" />
                      Copy
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-7 flex-1 text-xs"
                      onClick={() => deleteLayer(layer)}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Delete
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
