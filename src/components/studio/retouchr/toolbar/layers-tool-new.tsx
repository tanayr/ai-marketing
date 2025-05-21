"use client";

import React, { useEffect, useState } from 'react';
import { useCanvas } from '../hooks/use-canvas';
import { fabric, FabricObject } from '../utils/fabric-imports';
import { Button } from '@/components/ui/button';
import { 
  FolderPlus,
  Layers as LayersIcon
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

// Import our modular layer components
import { LayerItem, LayerGroupItem, ObjectLayerItem } from './layer-types';
import { LayerList } from './layer-list';
import { 
  processLayers, 
  createLayerGroup, 
  findLayerById, 
  toggleLayerVisibility as toggleLayerVisibilityUtil, 
  toggleGroupExpanded 
} from './layer-group-utils';

export const LayersTool: React.FC = () => {
  const { canvas, selectedObjects } = useCanvas();
  const [layerStructure, setLayerStructure] = useState<LayerItem[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | number | null>(null);
  const [groups, setGroups] = useState<LayerGroupItem[]>([]);
  
  // Update layers when canvas changes
  useEffect(() => {
    if (!canvas) return;
    
    const updateLayersList = () => {
      const objects = canvas.getObjects();
      // Process the flat list of objects into our hierarchical structure
      const updatedLayers = processLayers(objects, groups);
      setLayerStructure(updatedLayers);
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
  }, [canvas, groups]);
  
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
  
  // Helper to find an object layer by ID
  const findObjectLayer = (id: string | number): ObjectLayerItem | null => {
    // Recursive function to search through the layer structure
    const findInLayers = (items: LayerItem[]): ObjectLayerItem | null => {
      for (const item of items) {
        if (item.id === id) {
          return item.isGroup ? null : (item as ObjectLayerItem);
        }
        if (item.isGroup) {
          const found = findInLayers((item as LayerGroupItem).children);
          if (found) return found;
        }
      }
      return null;
    };
    
    return findInLayers(layerStructure);
  };
  
  // Select a layer
  const selectLayer = (layer: LayerItem) => {
    if (!canvas) return;
    
    // Only object layers can be selected on canvas
    if (!layer.isGroup) {
      canvas.setActiveObject((layer as ObjectLayerItem).object);
      canvas.renderAll();
    }
    
    setSelectedLayerId(layer.id);
  };
  
  // Toggle layer visibility
  const handleToggleVisibility = (layer: LayerItem) => {
    if (!canvas) return;
    
    if (layer.isGroup) {
      // For groups, toggle visibility of all children
      const updatedStructure = toggleLayerVisibilityUtil(layerStructure, layer.id);
      setLayerStructure(updatedStructure);
      
      // Also update the groups state
      const updatedGroups = groups.map(group => {
        if (group.id === layer.id) {
          return { ...group, visible: !layer.visible };
        }
        return group;
      });
      setGroups(updatedGroups);
      
      // Update visibility of all objects in the group on canvas
      const setVisibility = (items: LayerItem[], visible: boolean) => {
        items.forEach(item => {
          if (!item.isGroup && ('object' in item)) {
            (item as ObjectLayerItem).object.set({ visible });
          } else if (item.isGroup) {
            setVisibility((item as LayerGroupItem).children, visible);
          }
        });
      };
      
      // Set all child objects visibility
      const newVisibility = !layer.visible;
      const groupToUpdate = groups.find(g => g.id === layer.id);
      if (groupToUpdate) {
        setVisibility(groupToUpdate.children, newVisibility);
      }
    } else if ('object' in layer) {
      // For individual objects, just toggle their visibility
      const objLayer = layer as ObjectLayerItem;
      const isVisible = objLayer.object.visible !== false;
      objLayer.object.set({ visible: !isVisible });
      
      // Update the layer structure
      const updatedStructure = toggleLayerVisibilityUtil(layerStructure, layer.id);
      setLayerStructure(updatedStructure);
    }
    
    canvas.renderAll();
  };
  
  // Move layer up
  const moveLayerUp = (layer: ObjectLayerItem) => {
    if (!canvas) return;
    
    layer.object.bringForward();
    canvas.renderAll();
  };
  
  // Move layer down
  const moveLayerDown = (layer: ObjectLayerItem) => {
    if (!canvas) return;
    
    layer.object.sendBackwards();
    canvas.renderAll();
  };
  
  // Delete layer
  const deleteLayer = (layer: LayerItem) => {
    if (!canvas) return;
    
    if (layer.isGroup) {
      // For groups, update groups state and process all children
      setGroups(groups.filter(group => group.id !== layer.id));
      
      // If the group has object children, remove them from canvas
      const removeObjects = (items: LayerItem[]) => {
        items.forEach(item => {
          if (!item.isGroup && 'object' in item) {
            canvas.remove((item as ObjectLayerItem).object);
          } else if (item.isGroup) {
            // Recursively process nested groups
            removeObjects((item as LayerGroupItem).children);
          }
        });
      };
      
      const groupToRemove = groups.find(g => g.id === layer.id);
      if (groupToRemove) {
        removeObjects(groupToRemove.children);
      }
    } else if ('object' in layer) {
      // For individual objects, just remove them
      canvas.remove((layer as ObjectLayerItem).object);
    }
    
    canvas.renderAll();
  };
  
  // Duplicate layer (only for object layers, not groups)
  const duplicateLayer = (layer: ObjectLayerItem) => {
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
  
  // Create a new group from selected objects
  const createGroup = () => {
    if (!canvas) return;
    
    const selectedObjs = canvas.getActiveObjects();
    if (selectedObjs.length < 2) return; // Need at least 2 objects to form a group
    
    // Find the corresponding layer items
    const selectedLayerItems = selectedObjs.map(obj => {
      const id = obj.id || '';
      return findObjectLayer(id);
    }).filter(Boolean) as ObjectLayerItem[];
    
    if (selectedLayerItems.length < 2) return;
    
    // Create a new group with these items
    const groupName = `Group ${groups.length + 1}`;
    const newGroup = createLayerGroup(groupName, selectedLayerItems);
    
    // Update groups state
    setGroups([...groups, newGroup]);
    
    // Clear selection on canvas
    canvas.discardActiveObject();
    canvas.renderAll();
  };
  
  // Toggle group expansion
  const toggleGroupExpand = (group: LayerGroupItem) => {
    const updatedStructure = toggleGroupExpanded(layerStructure, group.id);
    setLayerStructure(updatedStructure);
    
    // Update groups state
    const updatedGroups = groups.map(g => {
      if (g.id === group.id) {
        return { ...g, expanded: !g.expanded };
      }
      return g;
    });
    setGroups(updatedGroups);
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-medium">Layers</h3>
        
        {/* Group creation button */}
        <Button
          variant="outline"
          size="sm"
          className="h-8"
          title="Create group from selected layers"
          onClick={createGroup}
        >
          <FolderPlus className="h-4 w-4 mr-2" />
          Group
        </Button>
      </div>
      
      <ScrollArea className="h-[300px]">
        {layerStructure.length > 0 ? (
          <LayerList
            layers={layerStructure}
            selectedLayerId={selectedLayerId}
            onSelect={selectLayer}
            onToggleVisibility={handleToggleVisibility}
            onMoveUp={(layer) => ('object' in layer) && moveLayerUp(layer as ObjectLayerItem)}
            onMoveDown={(layer) => ('object' in layer) && moveLayerDown(layer as ObjectLayerItem)}
            onDelete={deleteLayer}
            onDuplicate={(layer) => ('object' in layer) && duplicateLayer(layer as ObjectLayerItem)}
            onToggleExpand={toggleGroupExpand}
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
            <LayersIcon className="h-10 w-10 mb-2 opacity-50" />
            <p>No layers yet</p>
            <p className="text-xs">Add objects to your canvas</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
