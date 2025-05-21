"use client";

import React, { useEffect, useCallback, useState, useRef } from 'react';
import { fabric } from '../../utils/fabric-imports';
import { LayerItem, ObjectLayerItem, GroupLayerItem } from '../core/types';
import { getLayerName } from '../core/utils';

/**
 * Hook to synchronize fabric.js canvas with layer state
 */
export function useFabricSync(
  canvas: fabric.Canvas | null,
  setLayers: (layers: LayerItem[]) => void,
  groups: GroupLayerItem[]
) {
  // Keep track of if we've attached listeners to specific objects
  const [objectListeners, setObjectListeners] = useState<Set<string>>(new Set());

  // Process canvas objects into layer items
  const processCanvasObjects = useCallback((objects: any[], groups: GroupLayerItem[]) => {
    // Return empty array for invalid or empty objects to avoid crashes
    if (!objects || !Array.isArray(objects)) return [];
    if (objects.length === 0) return [];
    
    // Ensure all objects have IDs
    let validObjectsCount = 0;
    
    objects.forEach((obj, index) => {
      if (!obj || !obj.type) return; // Skip invalid objects
      validObjectsCount++;
      
      if (!obj.id) {
        obj.id = `layer-${Date.now()}-${index}`;
      }
    });
    
    // If no valid objects, return empty array
    if (validObjectsCount === 0) return [];
    
    // Create object layer items
    const objectLayerItems: ObjectLayerItem[] = objects.map((obj, index) => ({
      id: obj.id,
      name: getLayerName(obj, index),
      type: obj.type || 'unknown',
      isGroup: false,
      objectRef: obj.id,
      visible: obj.visible !== false,
      editable: true,
      zIndex: objects.length - index - 1
    }));
    
    // Track which objects are in groups
    const objectsInGroups = new Set<string>();
    
    // Find all objects in groups
    const findObjectsInGroups = (groupItems: GroupLayerItem[]) => {
      groupItems.forEach(group => {
        group.children.forEach(child => {
          if (!child.isGroup) {
            objectsInGroups.add(child.id);
          }
        });
        
        // Recursively process nested groups
        const nestedGroups = group.children.filter(child => child.isGroup) as GroupLayerItem[];
        if (nestedGroups.length > 0) {
          findObjectsInGroups(nestedGroups);
        }
      });
    };
    
    // Process existing groups
    findObjectsInGroups(groups);
    
    // Update existing groups with latest object data
    const updateGroupChildren = (group: GroupLayerItem): GroupLayerItem => {
      // Update non-group children with latest data
      const updatedChildren = group.children.map(child => {
        if (!child.isGroup) {
          // Find matching object from canvas
          const matchingObject = objectLayerItems.find(obj => obj.id === child.id);
          if (matchingObject) {
            return {
              ...child,
              name: matchingObject.name, // Update name from current object state
              type: matchingObject.type,
              visible: matchingObject.visible
            };
          }
        } else {
          // Recursively update nested groups
          return updateGroupChildren(child as GroupLayerItem);
        }
        return child;
      });
      
      // Filter out any children that no longer exist on canvas
      const validChildren = updatedChildren.filter(child => {
        if (child.isGroup) return true; // Keep all groups
        return objects.some(obj => obj.id === child.id);
      });
      
      return {
        ...group,
        children: validChildren
      };
    };
    
    // Create updated groups with current object data
    const updatedGroups = groups.map(updateGroupChildren);
    
    // Find top-level objects (not in any group)
    const topLevelObjects = objectLayerItems.filter(obj => !objectsInGroups.has(obj.id));
    
    // Combine top-level objects with groups
    return [...topLevelObjects, ...updatedGroups];
  }, []);

  // Setup text change listeners with improved monitoring
  const setupTextListeners = useCallback((canvas: fabric.Canvas, newListeners: Set<string>) => {
    // Use a ref for managing update debouncing within this closure
    const updateTimeoutRef = { current: null as NodeJS.Timeout | null };
    
    // Define the update function that refreshes layer names - with debouncing
    const updateFromCanvas = () => {
      try {
        // Clear any pending timeout
        if (updateTimeoutRef.current) {
          clearTimeout(updateTimeoutRef.current);
        }
        
        // Schedule the update with a small delay to batch updates
        updateTimeoutRef.current = setTimeout(() => {
          try {
            if (!canvas || typeof canvas.getObjects !== 'function') {
              console.log('Canvas not ready for update');
              return;
            }
            
            const objects = canvas.getObjects();
            
            // Skip update if there are no objects to avoid unnecessary renders
            if (!objects || !Array.isArray(objects) || objects.length === 0) {
              console.log('No canvas objects to process');
              // Still update with empty array to keep UI in sync
              setLayers([]);
              return;
            }
            
            const processedLayers = processCanvasObjects(objects, groups);
            setLayers(processedLayers);
          } catch (err) {
            console.error('Error in delayed canvas update:', err);
          }
          updateTimeoutRef.current = null;
        }, 50); // Small delay to batch updates
      } catch (err) {
        console.error('Error scheduling update:', err);
      }
    };
    
    // Add listeners to a specific text object
    const addTextListener = (obj: any) => {
      // Only add listeners to text objects and avoid duplicates
      if (!obj || obj.type !== 'text' || !obj.id) return;
      
      // Skip if we already have a listener for this object
      if (newListeners.has(obj.id)) return;
      
      console.log('Adding text change listener to:', obj.id, obj.text);
      
      // Mark we've added a listener
      newListeners.add(obj.id);
      
      // Listen for direct text changes
      if (typeof obj.on === 'function') {
        // Listen for the main change event
        obj.on('changed', function() {
          console.log('Text changed event:', obj.id, obj.text);
          updateFromCanvas();
        });
        
        // Also listen for text modifications via the editing interface
        obj.on('editing:entered', function() {
          console.log('Text editing started:', obj.id);
        });
        
        obj.on('editing:exited', function() {
          console.log('Text editing finished:', obj.id, obj.text);
          updateFromCanvas();
        });
      }
    };
    
    // Add listeners to all existing text objects
    try {
      if (!canvas || typeof canvas.getObjects !== 'function') {
        console.log('Canvas not ready for adding text listeners');
        return updateFromCanvas;
      }
      
      const objects = canvas.getObjects();
      if (objects && Array.isArray(objects)) {
        objects.forEach(obj => {
          if (obj && obj.type === 'text') {
            addTextListener(obj);
          }
        });
      }
    } catch (err) {
      console.error('Error setting up text listeners:', err);
    }
    
    return updateFromCanvas;
  }, [processCanvasObjects, setLayers, groups]);

  // Track text listeners in a ref instead of state to avoid re-renders
  const textListenersRef = React.useRef<Set<string>>(new Set());
  
  // Track previous props to prevent unnecessary updates
  const prevPropsRef = useRef({ canvas: null as fabric.Canvas | null, groups: [] as GroupLayerItem[] });
  
  // Flag to skip first update when only getting set up
  const isFirstRenderRef = useRef(true);
  
  // Main effect to sync canvas with layer state
  useEffect(() => {
    // Avoid unnecessary re-renders by comparing with previous props
    const prevProps = prevPropsRef.current;
    const canvasChanged = canvas !== prevProps.canvas;
    
    // Deep comparison for groups to avoid false positives on reference changes
    let groupsChanged = false;
    try {
      // Use basic length check first (faster)
      if (groups.length !== prevProps.groups.length) {
        groupsChanged = true;
      } else if (groups.length > 0) {
        // Only do expensive JSON comparison if needed
        // Serialize both current and previous groups for deep comparison
        const currentGroupsJSON = JSON.stringify(groups);
        const prevGroupsJSON = JSON.stringify(prevProps.groups);
        groupsChanged = currentGroupsJSON !== prevGroupsJSON;
      }
    } catch (err) {
      console.error('Error comparing groups:', err);
      // Default to false to avoid unnecessary updates
      groupsChanged = false;
    }
    
    // Skip update if nothing important changed and it's not first render
    if (!canvasChanged && !groupsChanged && !isFirstRenderRef.current) {
      return;
    }
    
    // Log only when groups actually changed (not just references)
    if (groupsChanged) {
      console.log('Groups have meaningful changes - updating');
    }
    
    // Update refs for next comparison
    prevPropsRef.current = { canvas, groups };
    
    // First render is complete
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
    }
    
    console.log('useFabricSync effect running', { canvasChanged, groupsChanged });
    
    // Ensure canvas is properly initialized
    if (!canvas || !(canvas as any).getContext || typeof canvas.getObjects !== 'function') {
      console.log('Canvas not fully initialized yet, skipping sync');
      return;
    }
    
    // Add a safety check for the canvas context
    try {
      // Test if canvas is accessible - this will throw if canvas isn't ready
      const objects = canvas.getObjects();
      if (!objects) {
        console.log('Canvas objects not available yet');
        return;
      }
    } catch (err) {
      console.error('Error accessing canvas:', err);
      return;
    }
    
    // Use ref for tracking listeners instead of state
    const newListeners = textListenersRef.current;
    
    // Setup text change listeners
    const updateFromCanvas = setupTextListeners(canvas, newListeners);
    
    // Limit canvas updates to reduce potential for infinite loops
    const debounceTimeoutRef = { current: null as NodeJS.Timeout | null };
    const debouncedUpdate = () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      
      debounceTimeoutRef.current = setTimeout(() => {
        if (canvas) {
          updateFromCanvas();
        }
        debounceTimeoutRef.current = null;
      }, 50); // Small delay to batch updates
    };
    
    // Update layers when canvas changes - with debouncing
    const handleCanvasModified = () => {
      debouncedUpdate();
    };
    
    // Function to add listeners to text objects
    const addTextListener = (textObj: any) => {
      if (!textObj || textObj.type !== 'text' || !textObj.id) return;
      
      // Skip if we already have a listener for this object
      if (newListeners.has(textObj.id)) return;
      
      console.log('Adding text change listener to:', textObj.id, textObj.text);
      newListeners.add(textObj.id);
      
      // Listen for direct text changes
      if (typeof textObj.on === 'function') {
        textObj.on('changed', function() {
          console.log('Text content updated:', textObj.text);
          handleCanvasModified(); // Use debounced update
        });
      }
    };
    
    // Define handlers for event references (for cleanup)
    const objectAddedHandler = (e: { target: any }) => {
      // When a new object is added, add text listener if needed
      if (e.target && e.target.type === 'text') {
        addTextListener(e.target);
      }
      handleCanvasModified();
    };
    
    const objectModifiedHandler = (e: { target: any }) => {
      // Special case: modified text object might have new content
      if (e.target && e.target.type === 'text') {
        console.log('Text object modified:', e.target.id, (e.target as any).text);
        // Ensure text objects always have listeners
        addTextListener(e.target);
      }
      handleCanvasModified();
    };
    
    const textChangedHandler = (e: { target: any }) => {
      if (e.target) {
        console.log('Text changed direct event:', (e.target as any).text);
        // Force update the name immediately
        handleCanvasModified();
      }
    };
    
    const textEditingEnteredHandler = (e: { target: any }) => {
      console.log('Text editing entered:', e.target ? (e.target as any).id : 'unknown');
    };
    
    const textEditingExitedHandler = (e: { target: any }) => {
      if (e.target) {
        console.log('Text editing exited:', (e.target as any).id, (e.target as any).text);
      }
      // Always update when text editing is done
      handleCanvasModified();
    };
    
    // Attach handlers with proper references for later cleanup
    // Only register once - not duplicating handlers
    canvas.on('object:added', objectAddedHandler);
    canvas.on('object:removed', handleCanvasModified);
    canvas.on('object:modified', objectModifiedHandler);
    canvas.on('text:changed', textChangedHandler);
    canvas.on('text:editing:entered', textEditingEnteredHandler);
    canvas.on('text:editing:exited', textEditingExitedHandler);
    
    // Initial update
    updateFromCanvas();
    
    // Cleanup with proper handler references
    return () => {
      // Clear debounce timeout if it exists
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      
      // Make sure canvas exists before trying to remove listeners
      if (!canvas) return;
      
      // Remove all event handlers with proper references
      canvas.off('object:added', objectAddedHandler);
      canvas.off('object:removed', handleCanvasModified);
      canvas.off('object:modified', objectModifiedHandler);
      canvas.off('text:changed', textChangedHandler);
      canvas.off('text:editing:entered', textEditingEnteredHandler);
      canvas.off('text:editing:exited', textEditingExitedHandler);
      
      // Also clean up any listeners added directly to objects
      try {
        canvas.getObjects().forEach(obj => {
          if (obj.type === 'text' && typeof (obj as any).off === 'function') {
            (obj as any).off('changed');
          }
        });
      } catch (err) {
        console.error('Error cleaning up object listeners:', err);
      }
    };
  }, [canvas, setupTextListeners, groups, setLayers]); // Removed objectListeners from dependencies

  // Function to select a layer on the canvas
  const selectLayerOnCanvas = useCallback((id: string) => {
    if (!canvas) return;
    
    try {
      // Make sure canvas is ready
      if (typeof canvas.getObjects !== 'function') {
        console.log('Canvas not ready for selection');
        return;
      }
      
      // Get all objects on the canvas
      const objects = canvas.getObjects();
      if (!objects || !Array.isArray(objects)) {
        console.log('Invalid objects array from canvas');
        return;
      }
      
      // Find the object with matching ID
      const targetObject = objects.find(obj => obj && obj.id === id);
      
      if (targetObject) {
        // Clear current selection
        // Use type assertion to access fabric.js specific methods
        if (typeof (canvas as any).discardActiveObject === 'function') {
          (canvas as any).discardActiveObject();
        }
        
        // Select the target object
        if (typeof canvas.setActiveObject === 'function') {
          canvas.setActiveObject(targetObject);
          
          // Use type assertion for render method
          if (typeof (canvas as any).requestRenderAll === 'function') {
            (canvas as any).requestRenderAll();
          }
        }
      }
    } catch (err) {
      console.error('Error in selectLayerOnCanvas:', err);
    }
  }, [canvas]);

  return { selectLayerOnCanvas };
}
