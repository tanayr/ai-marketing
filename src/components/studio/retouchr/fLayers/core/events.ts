"use client";

import { LayerEvent, LayerItem, GroupLayerItem } from './types';
import { 
  findLayerById, 
  deleteLayer, 
  updateLayer, 
  createGroup, 
  moveLayerUp, 
  moveLayerDown,
  setChildrenVisibility
} from './utils';

/**
 * Reducer for handling layer state actions
 */
export function layerReducer(state: LayerItem[], event: LayerEvent): LayerItem[] {
  switch (event.type) {
    case 'SELECT':
      // Selection is handled separately in state
      return state;
      
    case 'TOGGLE_VISIBILITY': {
      const layer = findLayerById(state, event.id);
      if (!layer) return state;
      
      return updateLayer(state, event.id, layer => {
        const newVisibility = !layer.visible;
        
        // If it's a group, update all children
        if (layer.isGroup) {
          return setChildrenVisibility(layer as GroupLayerItem, newVisibility);
        }
        
        // Otherwise just update this layer
        return { ...layer, visible: newVisibility };
      });
    }
    
    case 'RENAME': {
      return updateLayer(state, event.id, layer => ({
        ...layer,
        name: event.name
      }));
    }
    
    case 'GROUP': {
      // Find all layers to be grouped
      const layersToGroup: LayerItem[] = [];
      const idsSet = new Set(event.ids);
      
      // Helper function to extract layers to group
      const extractLayers = (layers: LayerItem[]): LayerItem[] => {
        return layers.filter(layer => {
          if (idsSet.has(layer.id)) {
            layersToGroup.push(layer);
            return false;
          }
          
          if (layer.isGroup) {
            layer = {
              ...layer,
              children: extractLayers(layer.children)
            } as GroupLayerItem;
            
            // If all children were removed, remove the group too
            if (layer.isGroup && layer.children.length === 0) {
              return false;
            }
          }
          
          return true;
        });
      };
      
      // Process the layers to find and remove those being grouped
      const remainingLayers = extractLayers([...state]);
      
      // If we found at least 2 layers, create a group
      if (layersToGroup.length >= 2) {
        const newGroup = createGroup(layersToGroup, event.name);
        return [...remainingLayers, newGroup];
      }
      
      return state;
    }
    
    case 'UNGROUP': {
      const group = findLayerById(state, event.id) as GroupLayerItem | undefined;
      if (!group || !group.isGroup) return state;
      
      // First remove the group
      const layersWithoutGroup = deleteLayer(state, event.id);
      
      // Helper to find the insertion index
      const findInsertionIndex = (layers: LayerItem[]): number => {
        for (let i = 0; i < layers.length; i++) {
          if (layers[i].id === event.id) {
            return i;
          }
          
          if (layers[i].isGroup) {
            const groupIdx = findInsertionIndex(layers[i].children);
            if (groupIdx !== -1) {
              return i;
            }
          }
        }
        
        return -1;
      };
      
      // Insert the group's children at the same position the group was
      const insertionIndex = findInsertionIndex(state);
      if (insertionIndex !== -1) {
        return [
          ...layersWithoutGroup.slice(0, insertionIndex),
          ...group.children,
          ...layersWithoutGroup.slice(insertionIndex)
        ];
      }
      
      // Fallback: just add them at the end
      return [...layersWithoutGroup, ...group.children];
    }
    
    case 'TOGGLE_EXPAND': {
      return updateLayer(state, event.id, layer => {
        if (!layer.isGroup) return layer;
        
        return {
          ...layer,
          expanded: !(layer as GroupLayerItem).expanded
        };
      });
    }
    
    case 'MOVE_UP': {
      return moveLayerUp(state, event.id);
    }
    
    case 'MOVE_DOWN': {
      return moveLayerDown(state, event.id);
    }
    
    case 'DELETE': {
      return deleteLayer(state, event.id);
    }
    
    case 'SET_LAYERS': {
      return event.layers;
    }
    
    case 'INITIALIZE_WITH_GROUPS': {
      // Merge saved groups with existing canvas objects
      // We keep state (existing canvas objects) and add the saved groups to it
      
      // Create a lookup of existing objects by ID to avoid duplicates
      const existingObjectIds = new Set();
      state.forEach(item => {
        if (!item.isGroup) {
          existingObjectIds.add(item.id);
        }
      });
      
      // Filter saved group children to remove any that don't exist in current canvas
      const processedGroups = event.groups.map(group => {
        const validChildren = group.children.filter(child => {
          if (child.isGroup) return true; // Keep nested groups
          return existingObjectIds.has(child.id); // Only keep existing objects
        });
        
        return {
          ...group,
          children: validChildren
        };
      }).filter(group => group.children.length > 0); // Only keep groups with children
      
      // Combine state with saved groups, prioritizing groups
      return [...state, ...processedGroups];
    }
    
    default:
      return state;
  }
}
