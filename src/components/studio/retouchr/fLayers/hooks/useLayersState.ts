"use client";

import { useReducer, useState, useCallback, useRef } from 'react';
import { LayerItem, LayerEvent, GroupLayerItem } from '../core/types';
import { layerReducer } from '../core/events';
import { findLayerById } from '../core/utils';

/**
 * Core hook for managing layer state
 */
export function useLayersState(initialLayers: LayerItem[] = []) {
  // Main state for layers structure
  const [layers, dispatch] = useReducer(layerReducer, initialLayers);
  
  // Track selected layer ID separately (primary selection)
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  // Track multiple selected IDs for multi-selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Counter for generating unique group names
  const groupCounter = useRef(1);
  
  // Select a layer and update selectedId
  // Enhanced selectLayer function with improved shift-click support
  const selectLayer = useCallback((id: string, shiftKey: boolean = false) => {
    console.log('selectLayer called with:', { id, shiftKey });
    
    if (shiftKey) {
      // Multi-selection mode with shift key
      setSelectedIds(prev => {
        // Create a copy of the previous selections
        const updatedSelections = [...prev];
        
        // Check if the layer is already selected
        const existingIndex = updatedSelections.indexOf(id);
        
        if (existingIndex >= 0) {
          // If already selected, remove it (toggle behavior)
          console.log(`Removing ${id} from selections`);
          updatedSelections.splice(existingIndex, 1);
        } else {
          // Otherwise add it to selections
          console.log(`Adding ${id} to selections`);
          updatedSelections.push(id);
        }
        
        console.log('New selections:', updatedSelections);
        return updatedSelections;
      });
      
      // Always update primary selection with the clicked layer
      // This ensures we have a primary selection even in multi-select mode
      setSelectedId(id);
    } else {
      // Single selection mode
      console.log('Single selection mode, selecting:', id);
      setSelectedId(id);
      setSelectedIds([]); // Clear multi-selection
    }
  }, []);
  
  // Toggle visibility for a layer
  const toggleVisibility = useCallback((id: string) => {
    dispatch({ type: 'TOGGLE_VISIBILITY', id });
  }, []);
  
  // Rename a layer
  const renameLayer = useCallback((id: string, name: string) => {
    dispatch({ type: 'RENAME', id, name });
  }, []);
  
  // Create a group from selected layers
  const createGroup = useCallback((ids?: string[]) => {
    // If IDs are not provided, use the multi-selection
    const idsToGroup = ids || selectedIds;
    
    // Ensure we have at least 2 items to group
    if (!idsToGroup || idsToGroup.length < 2) {
      console.log('Not enough items selected for grouping');
      return;
    }
    
    console.log('Creating group with IDs:', idsToGroup);
    const groupName = `Group ${groupCounter.current++}`;
    dispatch({ type: 'GROUP', ids: idsToGroup, name: groupName });
    
    // Clear multi-selection after grouping
    setSelectedIds([]);
  }, [selectedIds]);
  
  // Ungroup a layer group
  const ungroup = useCallback((id: string) => {
    dispatch({ type: 'UNGROUP', id });
  }, []);
  
  // Toggle group expanded state
  const toggleExpand = useCallback((id: string) => {
    dispatch({ type: 'TOGGLE_EXPAND', id });
  }, []);
  
  // Move a layer up in the stack
  const moveLayerUp = useCallback((id: string) => {
    dispatch({ type: 'MOVE_UP', id });
  }, []);
  
  // Move a layer down in the stack
  const moveLayerDown = useCallback((id: string) => {
    dispatch({ type: 'MOVE_DOWN', id });
  }, []);
  
  // Delete a layer
  const deleteLayer = useCallback((id: string) => {
    dispatch({ type: 'DELETE', id });
    
    // If the deleted layer was selected, clear selection
    if (id === selectedId) {
      setSelectedId(null);
    }
  }, [selectedId]);
  
  // Set entire layer structure
  const setLayers = useCallback((newLayers: LayerItem[]) => {
    dispatch({ type: 'SET_LAYERS', layers: newLayers });
  }, []);
  
  // Get selected layer
  const selectedLayer = useCallback(() => {
    if (!selectedId) return null;
    return findLayerById(layers, selectedId);
  }, [layers, selectedId]);
  
  // Check if a layer is selected
  const isSelected = useCallback((id: string) => {
    return id === selectedId;
  }, [selectedId]);
  
  // Extract all groups from the layer hierarchy
  const getAllGroups = useCallback((): GroupLayerItem[] => {
    const groups: GroupLayerItem[] = [];
    
    // Recursive function to collect groups
    const collectGroups = (items: LayerItem[]) => {
      items.forEach(item => {
        if (item.isGroup) {
          groups.push(item);
          collectGroups(item.children);
        }
      });
    };
    
    collectGroups(layers);
    return groups;
  }, [layers]);
  
  // Initialize with saved groups
  const initializeWithGroups = useCallback((savedGroups: GroupLayerItem[]) => {
    if (!savedGroups || savedGroups.length === 0) return;
    
    // Update the group counter to be higher than any existing group numbers
    savedGroups.forEach(group => {
      const match = group.name.match(/Group (\d+)/);
      if (match && match[1]) {
        const groupNum = parseInt(match[1], 10);
        if (groupNum >= groupCounter.current) {
          groupCounter.current = groupNum + 1;
        }
      }
    });
    
    // Dispatch event to restore groups
    dispatch({ type: 'INITIALIZE_WITH_GROUPS', groups: savedGroups });
  }, []);
  
  return {
    layers,
    selectedId,
    selectedIds, // Added for multi-selection support
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
    selectedLayer,
    isSelected,
    getAllGroups,
    initializeWithGroups
  };
}
