"use client";

import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCanvas } from '../../hooks/use-canvas';
import { LayerGroup } from './LayerGroup';
import { LayerControls } from './LayerControls';
import { useLayersState } from '../hooks/useLayersState';
import { useFabricSync } from '../hooks/useFabricSync';
import { GroupLayerItem } from '../core/types';
import { 
  saveLayerGroups, 
  loadLayerGroups, 
  saveLayerGroupsForCanvas, 
  loadLayerGroupsForCanvas,
  generateCanvasHash
} from '../storage/layerPersistence';

/**
 * Main layers panel component for managing canvas layers
 */
export const LayerPanel: React.FC = () => {
  // Get canvas from context
  const { canvas, canvasData, selectedObjects } = useCanvas();
  
  // Track whether canvas is ready for use
  const [canvasReady, setCanvasReady] = useState(false);
  
  // Generate canvas hash for storage
  const [canvasHash, setCanvasHash] = useState<string>('');
  
  // Check if we can group/ungroup
  const [canGroup, setCanGroup] = useState(false);
  const [canUngroup, setCanUngroup] = useState(false);
  
  // Store loaded groups to avoid group loading in effect loops
  const initialGroupsLoadedRef = useRef(false);
  const loadedGroupsRef = useRef<GroupLayerItem[]>([]);
  
  // Use our custom hook for layer state management
  const {
    layers,
    selectedId,
    selectedIds, // Extract selectedIds for multi-selection support
    selectLayer,
    toggleVisibility,
    renameLayer,
    createGroup,
    ungroup,
    toggleExpand,
    moveLayerUp,
    moveLayerDown,
    deleteLayer,
    setLayers,
    getAllGroups,
    selectedLayer,
    initializeWithGroups
  } = useLayersState([]);
  
  // Use a ref for stable groups to prevent infinite updates
  const groupsRef = useRef<GroupLayerItem[]>([]);
  
  // Update the groups ref and trigger saving when layers change
  useEffect(() => {
    // Only process if we're past the initial loading
    if (!initialGroupsLoadedRef.current) {
      return;
    }
    
    // Get current groups from layers
    const currentGroups = getAllGroups();
    
    // Deep compare current groups with previous to avoid unnecessary updates
    const prevGroupsJSON = JSON.stringify(groupsRef.current);
    const currentGroupsJSON = JSON.stringify(currentGroups);
    const hasChanges = prevGroupsJSON !== currentGroupsJSON;
    
    if (hasChanges) {
      console.log('Groups have changed, updating and saving...');
      
      // Update our ref
      groupsRef.current = currentGroups;
      
      // Save to localStorage immediately when groups change
      // This ensures we don't miss any group changes
      if (currentGroups.length > 0) {
        console.log('Saving', currentGroups.length, 'groups');
        
        // Save to general storage
        saveLayerGroups(currentGroups);
        
        // If we have a canvas hash, also save specifically for this canvas
        if (canvasHash) {
          saveLayerGroupsForCanvas(canvasHash, currentGroups);
        }
      }
    }
  }, [layers, getAllGroups, canvasHash, initialGroupsLoadedRef]);
  
  // Use the useFabricSync hook only when canvas is ready AND groups are loaded
  // This prevents the hook from resetting layers before groups are loaded
  const shouldSyncFabric = canvasReady && initialGroupsLoadedRef.current;
  const { selectLayerOnCanvas } = useFabricSync(
    shouldSyncFabric ? canvas : null,
    setLayers,
    groupsRef.current
  );

  // Generate canvas hash when canvas data changes
  useEffect(() => {
    if (canvasData) {
      const hash = generateCanvasHash(canvasData);
      setCanvasHash(hash);
    }
  }, [canvasData]);
  
  // Load saved layer groups - only once when component mounts
  useEffect(() => {
    // Skip if we've already loaded groups or don't have a canvas hash
    if (initialGroupsLoadedRef.current || !canvasHash || !canvasReady) {
      return;
    }

    console.log('Loading saved groups for hash:', canvasHash);
    
    // Try loading canvas-specific groups first
    const canvasGroups = loadLayerGroupsForCanvas(canvasHash);
    
    if (canvasGroups.length > 0) {
      console.log('Loaded canvas-specific groups:', canvasGroups);
      loadedGroupsRef.current = canvasGroups;
      initializeWithGroups(canvasGroups);
    } else {
      // Fall back to general groups
      const generalGroups = loadLayerGroups();
      if (generalGroups.length > 0) {
        console.log('Loaded general groups:', generalGroups);
        loadedGroupsRef.current = generalGroups;
        initializeWithGroups(generalGroups);
      } else {
        console.log('No saved groups found - proceeding with empty groups');
      }
    }
    
    // Mark that we've completed the loading attempt (even if no groups found)
    // This allows useFabricSync to proceed
    initialGroupsLoadedRef.current = true;
  }, [canvasHash, canvasReady, initializeWithGroups]);
  
  // We now save groups directly in the groupsRef update effect
  // No need for a separate debounced save effect
  
  // Check if canvas is properly initialized with a delayed approach
  useEffect(() => {
    if (!canvas) {
      setCanvasReady(false);
      return;
    }
    
    // Use setTimeout to ensure the canvas element is fully attached to the DOM
    const timer = setTimeout(() => {
      try {
        // Verify canvas has been properly initialized
        if (canvas && typeof canvas.getObjects === 'function') {
          const objects = canvas.getObjects();
          console.log('Canvas properly initialized with', objects?.length || 0, 'objects');
          setCanvasReady(true);
        } else {
          console.log('Canvas not fully initialized, will retry');
          setCanvasReady(false);
        }
      } catch (err) {
        console.error('Error initializing canvas:', err);
        setCanvasReady(false);
      }
    }, 500); // Add a 500ms delay to ensure DOM is ready
    
    return () => clearTimeout(timer);
  }, [canvas]);
  
  // Update selection from canvas when selected objects change
  useEffect(() => {
    if (!canvasReady || !selectedObjects) return;
    
    if (selectedObjects.length === 1) {
      const obj = selectedObjects[0];
      if (obj && obj.id) {
        selectLayer(obj.id);
      }
    }
  }, [selectedObjects, selectLayer, canvasReady]);
  
  // Update group/ungroup status - with debouncing to prevent loops
  const statusUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (!canvas || !canvasReady) return;
    
    // Clear any existing timeout
    if (statusUpdateTimeoutRef.current) {
      clearTimeout(statusUpdateTimeoutRef.current);
    }
    
    statusUpdateTimeoutRef.current = setTimeout(() => {
      try {
        // Can group if 2+ objects are selected, either via canvas or UI
        let canGroupItems = false;
        
        // Check UI selections first (shift+click selected items)
        if (selectedIds.length >= 2) {
          console.log('Multiple items selected in UI:', selectedIds.length);
          canGroupItems = true;
        } else {
          // Check canvas selections
          const activeObjects = canvas.getActiveObjects();
          canGroupItems = !!(activeObjects && activeObjects.length >= 2);
        }
        
        // Update the group button state
        console.log('Setting can group:', canGroupItems);
        setCanGroup(canGroupItems);
        
        // Can ungroup if a group is selected
        const selected = selectedLayer();
        setCanUngroup(!!selected && selected.isGroup);
        
        statusUpdateTimeoutRef.current = null;
      } catch (err) {
        console.error('Error updating group status:', err);
      }
    }, 200);
    
    return () => {
      if (statusUpdateTimeoutRef.current) {
        clearTimeout(statusUpdateTimeoutRef.current);
      }
    };
  }, [canvas, canvasReady, selectedLayer, selectedId, selectedIds]); // Added selectedIds to dependencies
  
  // Handle selecting a layer from the UI
  const handleSelectLayer = (id: string, shiftKey: boolean = false) => {
    if (!canvasReady) return;
    
    console.log('Layer selected with shift:', id, shiftKey);
    selectLayer(id, shiftKey);
    
    // Only update canvas selection for non-shift selections
    // This preserves multi-selection in the layer panel
    if (!shiftKey) {
      selectLayerOnCanvas(id);
    }
  };
  
  // Handle creating a group from selected objects - enhanced for multi-selection
  const handleCreateGroup = () => {
    if (!canvas || !canvasReady) return;
    
    try {
      // First, check if we have shift-selected layers in the UI
      if (selectedIds.length >= 2) {
        console.log('Creating group from UI selections:', selectedIds);
        createGroup(selectedIds);
        return;
      }
      
      // If no shift-selections, check canvas selections
      const activeObjects = canvas.getActiveObjects();
      
      if (activeObjects && activeObjects.length >= 2) {
        // Get IDs of selected objects
        const ids = activeObjects.map(obj => obj.id as string).filter(Boolean);
        
        if (ids.length >= 2) {
          console.log('Creating group from canvas selections:', ids);
          createGroup(ids);
        } else {
          console.log('Not enough valid objects selected');
          alert('Please select at least 2 layers to create a group.');
        }
      } else {
        console.log('Not enough selections for grouping');
        alert('Please select at least 2 layers to create a group. You can use Shift+Click to select multiple layers.');
      }
    } catch (err) {
      console.error('Error creating group:', err);
    }
  };
  
  // Handle ungrouping a layer group
  const handleUngroup = () => {
    if (!selectedId) return;
    
    const layer = selectedLayer();
    if (!layer || !layer.isGroup) {
      console.log('No group selected to ungroup');
      return;
    }
    
    ungroup(selectedId);
  };
  
  // Enhanced move layer up with canvas sync
  const handleMoveLayerUp = (layerId: string) => {
    if (!canvas || !canvasReady) return;
    
    // Update UI layer order
    moveLayerUp(layerId);
    
    // Sync with canvas object order
    syncLayerOrderToCanvas(layerId, 'up');
  };
  
  // Enhanced move layer down with canvas sync
  const handleMoveLayerDown = (layerId: string) => {
    if (!canvas || !canvasReady) return;
    
    // Update UI layer order
    moveLayerDown(layerId);
    
    // Sync with canvas object order
    syncLayerOrderToCanvas(layerId, 'down');
  };
  
  // Sync layer order to canvas
  const syncLayerOrderToCanvas = (layerId: string, direction: 'up' | 'down') => {
    if (!canvas) return;
    
    try {
      const fabricCanvas = canvas as any; // Cast to access fabric.js methods
      const objects = fabricCanvas.getObjects();
      const objectIndex = objects.findIndex((obj: any) => obj.id === layerId);
      
      if (objectIndex === -1) return;
      
      const targetObject = objects[objectIndex];
      
      if (direction === 'up' && objectIndex < objects.length - 1) {
        // Move object up in z-order (bringForward)
        fabricCanvas.bringForward(targetObject);
      } else if (direction === 'down' && objectIndex > 0) {
        // Move object down in z-order (sendBackwards)
        fabricCanvas.sendBackwards(targetObject);
      }
      
      fabricCanvas.renderAll();
    } catch (error) {
      console.error('Error syncing layer order to canvas:', error);
    }
  };
  
  // Enhanced delete with canvas sync
  const handleDeleteLayer = (layerId: string) => {
    if (!canvas || !canvasReady) return;
    
    try {
      // Find and remove the object from canvas
      const objects = canvas.getObjects();
      const objectToDelete = objects.find(obj => obj.id === layerId);
      
      if (objectToDelete) {
        canvas.remove(objectToDelete);
        canvas.renderAll();
      }
      
      // Update UI layer state
      deleteLayer(layerId);
    } catch (error) {
      console.error('Error deleting layer:', error);
    }
  };
  
  // For debugging
  const isEmptyState = !layers || layers.length === 0;
  
  // Create a stable div reference
  const renderLayerContent = () => {
    if (!canvasReady) {
      return (
        <div className="h-[300px] pr-2 flex items-center justify-center">
          <div className="text-xs text-muted-foreground p-2 text-center">
            Initializing canvas...
          </div>
        </div>
      );
    }
    
    if (isEmptyState) {
      return (
        <div className="h-[300px] pr-2 flex items-center justify-center">
          <div className="text-xs text-muted-foreground p-2 text-center">
            No layers available
          </div>
        </div>
      );
    }
    
    // Only render ScrollArea when we actually have layers
    return (
      <ScrollArea className="h-[300px] pr-2">
        <div className="space-y-1">
          <LayerGroup
            layers={layers}
            selectedId={selectedId}
            selectedIds={selectedIds}
            onSelect={handleSelectLayer}
            onToggleVisibility={toggleVisibility}
            onRename={renameLayer}
            onToggleExpand={toggleExpand}
            onMoveUp={handleMoveLayerUp}
            onMoveDown={handleMoveLayerDown}
            onDelete={handleDeleteLayer}
          />
        </div>
      </ScrollArea>
    );
  };
  
  // Add state for delete confirmation dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [layerToDelete, setLayerToDelete] = useState<string | null>(null);
  
  // Handle the actual deletion
  const handleConfirmDelete = () => {
    if (selectedId) {
      handleDeleteLayer(selectedId);
      setShowDeleteDialog(false);
      setLayerToDelete(null);
    }
  };
  
  const handleCancelDelete = () => {
    setShowDeleteDialog(false);
    setLayerToDelete(null);
  };
  
  // Get the layer to be deleted for the dialog
  const layerToDeleteInfo = selectedId ? selectedLayer() : null;
  
  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Delete' && selectedId) {
      event.preventDefault();
      event.stopPropagation();
      setShowDeleteDialog(true);
      setLayerToDelete(selectedId);
    }
  }, [selectedId]);
  
  return (
    <div className="layers-panel" onKeyDown={handleKeyDown} tabIndex={0}>
      <h3 className="text-xs font-medium mb-2">Layers</h3>
      
      <LayerControls
        onCreateGroup={handleCreateGroup}
        onUngroup={handleUngroup}
        canGroup={canGroup}
        canUngroup={canUngroup}
      />
      
      {renderLayerContent()}
      
      {showDeleteDialog && (
        <Dialog open={showDeleteDialog} onOpenChange={(open) => !open && handleCancelDelete()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Layer</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete layer "{layerToDeleteInfo?.name}"?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={handleCancelDelete} variant="outline">Cancel</Button>
              <Button onClick={handleConfirmDelete} variant="destructive">
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
