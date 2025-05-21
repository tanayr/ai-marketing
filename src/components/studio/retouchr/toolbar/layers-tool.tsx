"use client";

import React, { useEffect, useState } from 'react';
import { useCanvas } from '../hooks/use-canvas';
import { fabric, FabricObject } from '../utils/fabric-imports';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FolderPlus, Trash2, Layers as LayersIcon, Layers, Folder } from 'lucide-react';

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
import { getLayerName } from './layer-types';
import { 
  saveLayerGroups, 
  loadLayerGroups, 
  saveLayerGroupsForCanvas, 
  loadLayerGroupsForCanvas 
} from './layer-storage';

export function LayersTool() {
  // State for storing layer groups
  const [groups, setGroups] = useState<LayerGroupItem[]>([]);
  // State for storing the entire layer hierarchy (including groups)
  const [layerStructure, setLayerStructure] = useState<LayerItem[]>([]);
  // State for tracking if we can group/ungroup
  const [canGroup, setCanGroup] = useState(false);
  const [canUngroup, setCanUngroup] = useState(false);
  
  // Ungroup function to break apart a group
  const ungroup = () => {
    const selectedGroup = layerStructure.find(layer => 
      layer.isGroup && layer.id === selectedLayerId
    ) as LayerGroupItem | undefined;
    
    if (!selectedGroup) {
      console.log('No group selected');
      return;
    }
    
    // Remove the group but keep its children in the structure
    const updatedGroups = groups.filter(g => g.id !== selectedGroup.id);
    setGroups(updatedGroups);
    
    // Update the layer structure
    const updatedStructure = layerStructure.filter(l => l.id !== selectedGroup.id);
    setLayerStructure(updatedStructure);
    
    console.log('Ungrouped:', selectedGroup);
  };
  const [selectedLayerId, setSelectedLayerId] = useState<string | number | null>(null);
  const [canvasHashId, setCanvasHashId] = useState<string>('');

  // Include loadCanvas to detect when canvas is loaded from storage
  const { canvas, selectedObjects, canvasData, saveCanvas, loadCanvas } = useCanvas();

  // Generate a hash ID for the current canvas state to link groups to canvas states
  useEffect(() => {
    if (canvasData) {
      // Simple hash of the canvas data to use as an identifier
      const hash = canvasData.length.toString(16) + '-' + 
                  Math.abs(canvasData.split('').reduce(
                    (hash, char) => ((hash << 5) - hash) + char.charCodeAt(0), 0)
                  ).toString(16).substring(0, 8);
      
      setCanvasHashId(hash);
      console.log('Canvas state hash ID:', hash);
    }
  }, [canvasData]);
  
  // Load saved groups when component mounts or canvas is loaded
  useEffect(() => {
    // Try loading groups for this specific canvas state first
    if (canvasHashId) {
      const canvasSpecificGroups = loadLayerGroupsForCanvas(canvasHashId);
      if (canvasSpecificGroups.length > 0) {
        console.log('Loaded canvas-specific groups:', canvasSpecificGroups);
        setGroups(canvasSpecificGroups);
        return;
      }
    }
    
    // Fall back to general groups
    const savedGroups = loadLayerGroups();
    console.log('Loaded general saved groups:', savedGroups);
    if (savedGroups.length > 0) {
      setGroups(savedGroups);
    }
  }, [canvasHashId]);
  
  // Save groups whenever they change
  useEffect(() => {
    if (groups.length > 0) {
      console.log('Saving groups to storage:', groups);
      // Save to general storage
      saveLayerGroups(groups);
      
      // If we have a canvas ID, also save specifically for this canvas
      if (canvasHashId) {
        saveLayerGroupsForCanvas(canvasHashId, groups);
      }
    }
  }, [groups, canvasHashId]);
  
  // Update layers when canvas changes
  useEffect(() => {
    if (!canvas) return;
    
    // Ensure all objects have IDs
    const ensureObjectIds = () => {
      canvas.getObjects().forEach((obj, index) => {
        if (!obj.id) {
          obj.id = `layer-${Date.now()}-${index}`;
        }
      });
    };
    
    const updateLayersList = () => {
      ensureObjectIds();
      const objects = canvas.getObjects();
      
      // Force refresh names for text and image layers to capture latest changes
      objects.forEach((obj, index) => {
        // Make sure name is recalculated from the latest object state
        if (obj.type === 'text') {
          // For text objects, get the actual text content for the name
          const objAny = obj as any;
          // Set the flag to force refresh and capture the current text content
          objAny._needsRefresh = true;
          
          // Directly attach a listener to this specific text object if not already done
          if (!objAny._hasTextChangeListener) {
            // Mark that we've attached a listener to avoid duplicates
            objAny._hasTextChangeListener = true;
            
            // Attach a property change observer if possible using type assertion for Fabric.js
            if (typeof (obj as any).on === 'function') {
              // Use type assertion to access the fabric.js specific methods
              (obj as any).on('changed', function() {
                updateLayersList();
              });
            }
          }
        } else if (obj.type === 'image') {
          // For images, make sure we refresh the name
          (obj as any)._needsRefresh = true;
        }
      });
      
      // Process the flat list of objects into our hierarchical structure
      const updatedLayers = processLayers(objects, groups);
      setLayerStructure(updatedLayers);
    };
    
    // Register events
    canvas.on('object:added', updateLayersList);
    canvas.on('object:removed', updateLayersList);
    canvas.on('object:modified', updateLayersList);
    
    // Define handler functions so we can properly remove them later
    const handleTextChanged = (e: { target: fabric.Object }) => {
      // Force immediate update when text content changes
      if (e && e.target) {
        // Make sure names are recalculated
        (e.target as any)._needsRefresh = true;
        updateLayersList();
      }
    };
    
    // Special listener for text changes
    canvas.on('text:changed', handleTextChanged);
    
    // Also listen for text editing events which could update content
    canvas.on('text:editing:entered', (e: { target: fabric.Object }) => {
      console.log('Text editing entered');
    });
    
    canvas.on('text:editing:exited', (e: { target: fabric.Object }) => {
      console.log('Text editing exited');
      if (e && e.target) {
        // Make sure names are recalculated
        (e.target as any)._needsRefresh = true;
        updateLayersList();
      }
    });
    
    // Listen for selection changes to update image names if needed
    canvas.on('selection:created', updateLayersList);
    canvas.on('selection:updated', updateLayersList);
    
    // Initial load
    ensureObjectIds();
    updateLayersList();
    
    // We need to properly clean up all event handlers
    const handleTextEditingExited = (e: { target: fabric.Object }) => {
      if (e && e.target) {
        (e.target as any)._needsRefresh = true;
        updateLayersList();
      }
    };

    const handleTextEditingEntered = (e: { target: fabric.Object }) => {
      console.log('Text editing entered');
    };
    
    // Register these handlers too
    canvas.on('text:editing:exited', handleTextEditingExited);
    canvas.on('text:editing:entered', handleTextEditingEntered);
    
    return () => {
      // Clean up all event listeners
      canvas.off('object:added', updateLayersList);
      canvas.off('object:removed', updateLayersList);
      canvas.off('object:modified', updateLayersList);
      canvas.off('text:changed', handleTextChanged);
      canvas.off('text:editing:entered', handleTextEditingEntered);
      canvas.off('text:editing:exited', handleTextEditingExited);
      canvas.off('selection:created', updateLayersList);
      canvas.off('selection:updated', updateLayersList);
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
    
    try {
      // Only object layers can be selected on canvas
      if (!layer.isGroup) {
        const objLayer = layer as ObjectLayerItem;
        const fabricObj = objLayer.object;
        
        // First, safely deselect any currently selected objects to avoid errors
        canvas.discardActiveObject();
        
        // Get the object from the canvas by ID to ensure we have the latest reference
        // This is crucial for objects within groups
        const allObjects = canvas.getObjects();
        const targetObject = allObjects.find(obj => (obj as any).id === layer.id);
        
        if (targetObject) {
          // For objects that are directly on the canvas, this works directly
          canvas.setActiveObject(targetObject);
          console.log('Selected canvas object:', layer.id);
        } else {
          // Handle object within a group
          // We need to find which group contains our object
          const findObjectInGroups = (objects: fabric.Object[]) => {
            for (const obj of objects) {
              // Check if this is a group
              if (obj.type === 'group' || (obj as any)._objects) {
                const groupObjects = (obj as any)._objects || [];
                
                // Look for our target object in this group's objects
                const found = groupObjects.find((groupObj: any) => groupObj.id === layer.id);
                if (found) {
                  // Select the parent group
                  canvas.setActiveObject(obj);
                  console.log('Found and selected parent group for:', layer.id);
                  return true;
                }
                
                // Recursively check nested groups
                if (findObjectInGroups(groupObjects)) {
                  return true;
                }
              }
            }
            return false;
          };
          
          // Start the recursive search from the top level
          findObjectInGroups(allObjects);
        }
        
        canvas.renderAll();
      } else {
        // For groups, just update the selection state in UI, don't try to select on canvas
        console.log('Group selected (UI only):', layer.id);
      }
    } catch (error) {
      // Safely handle any errors during selection
      console.error('Error selecting layer:', error);
    }
    
    // Always update the selected layer ID for UI highlighting
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
    if (!canvas) {
      console.log('No canvas available');
      return;
    }
    
    // Get active selection or selected object
    let selectedObjs = [];
    const activeObject = canvas && canvas.getActiveObject();
    
    if (activeObject && activeObject.type === 'activeSelection') {
      // We have a multi-selection
      // @ts-ignore - Fabric types are incorrect for getObjects on activeSelection
      selectedObjs = activeObject._objects || [];
    } else if (activeObject) {
      // Get the currently selected canvas object and status
      const selectedObject = canvas && canvas.getActiveObject();
      const selectedLayerId = selectedObject ? selectedObject.id : null;
      const canGroup = canvas && selectedObjects && selectedObjects.length >= 2;
      const canUngroup = selectedObject && selectedObject.type === 'activeSelection';
      
      // Check if we can group (need 2+ selected objects)
      if (selectedObjs.length < 2) {
        console.log('Not enough objects selected, need at least 2');
        alert('Please select at least 2 objects to create a group');
        return;
      }
    }
    
    console.log('Selected objects:', selectedObjs);
    
    if (selectedObjs.length < 2) {
      console.log('Not enough objects selected, need at least 2');
      alert('Please select at least 2 objects to create a group');
      return;
    }
    
    // Make sure all objects have IDs
    selectedObjs.forEach((obj: FabricObject, index: number) => {
      if (!obj.id) {
        obj.id = `layer-${Date.now()}-${index}`;
      }
    });
    
    // Create layer items from the selected objects directly
    const selectedLayerItems: ObjectLayerItem[] = selectedObjs.map((obj: FabricObject, index: number) => ({
      id: obj.id as string,
      name: getLayerName(obj, index),
      type: obj.type || 'unknown',
      object: obj,
      visible: obj.visible !== false,
      isGroup: false
    }));
    
    console.log('Created layer items for selected objects:', selectedLayerItems);
    
    if (selectedLayerItems.length < 2) {
      console.log('Not enough valid layers created');
      return;
    }
    
    // Create a new group with these items
    const groupName = `Group ${groups.length + 1}`;
    const newGroup = createLayerGroup(groupName, selectedLayerItems);
    console.log('Created new group:', newGroup);
    
    // Update groups state with the new group
    const updatedGroups = [...groups, newGroup];
    setGroups(updatedGroups);
    console.log('Updated groups:', updatedGroups);
    
    // Force immediate update of the layer structure with the new groups
    const objects = canvas.getObjects();
    const updatedLayers = processLayers(objects, updatedGroups);
    setLayerStructure(updatedLayers);
    console.log('Updated layer structure with new groups:', updatedLayers);
    
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
  
  // Rename a group
  const renameGroup = (group: LayerGroupItem, newName: string) => {
    console.log(`Renaming group ${group.id} to: ${newName}`);
    
    // Update the group in both the layer structure and groups state
    const updatedStructure = layerStructure.map(layer => {
      if (layer.id === group.id && layer.isGroup) {
        return { ...layer, name: newName };
      } else if (layer.isGroup) {
        // Check nested groups
        return {
          ...layer,
          children: layer.children.map(child => {
            if (child.id === group.id && child.isGroup) {
              return { ...child, name: newName };
            }
            return child;
          })
        };
      }
      return layer;
    });
    
    setLayerStructure(updatedStructure);
    
    // Update the groups state
    const updatedGroups = groups.map(g => {
      if (g.id === group.id) {
        return { ...g, name: newName };
      }
      return g;
    });
    
    setGroups(updatedGroups);
  };

  return (
    <div className="space-y-2 p-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium">Layers</h3>
        
        {/* Group/Ungroup buttons */}
        <div className="flex space-x-1">
          <Button
            variant="outline"
            size="sm"
            className="h-5 py-0 px-1.5 text-xs"
            onClick={createGroup}
            title="Create layer group"
          >
            <FolderPlus className="mr-0.5 h-3 w-3" />
            Group
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="h-5 py-0 px-1.5 text-xs"
            onClick={ungroup}
            title="Ungroup selected layer group"
          >
            <Folder className="mr-0.5 h-3 w-3" />
            Ungroup
          </Button>
        </div>
      </div>
      
      <ScrollArea className="h-[200px] text-xs">
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
            onRenameGroup={renameGroup}
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
