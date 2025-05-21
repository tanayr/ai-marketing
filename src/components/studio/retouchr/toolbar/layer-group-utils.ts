"use client";

import { fabric, FabricObject } from '../utils/fabric-imports';
import { 
  LayerItem, 
  ObjectLayerItem, 
  LayerGroupItem,
  getLayerName 
} from './layer-types';

/**
 * Converts flat layer objects from canvas into a hierarchical structure
 * that includes both groups and individual objects.
 * Note: This does not modify canvas objects, only the UI representation.
 */
export function processLayers(
  canvasObjects: FabricObject[],
  existingGroups: LayerGroupItem[] = []
): LayerItem[] {
  console.log('Processing layers with objects:', canvasObjects);
  console.log('Existing groups:', existingGroups);
  
  // Create object layers from canvas objects
  const objectLayers: ObjectLayerItem[] = canvasObjects.map((obj, index) => {
    // Ensure each object has an ID
    if (!obj.id) {
      obj.id = `layer-${Date.now()}-${index}`;
    }
    
    return {
      id: obj.id,
      name: getLayerName(obj, index),
      type: obj.type || 'unknown',
      object: obj,
      visible: obj.visible !== false,
      isGroup: false
    };
  });
  
  console.log('Object layers created:', objectLayers);
  
  // Build a map of object IDs to check group membership efficiently
  const groupMembershipMap = new Map<string | number, string | number>();
  
  // Helper function to recursively process group children
  const processGroupChildren = (group: LayerGroupItem) => {
    group.children.forEach(child => {
      if (child.isGroup) {
        // Handle nested groups recursively
        processGroupChildren(child as LayerGroupItem);
      } else {
        // Add the child object ID to the map with the parent group ID
        groupMembershipMap.set(String(child.id), String(group.id));
      }
    });
  };
  
  // Process all groups recursively
  existingGroups.forEach(group => {
    processGroupChildren(group);
  });
  
  console.log('Group membership map:', groupMembershipMap);
  
  // Find objects that don't belong to any group
  const ungroupedObjects = objectLayers.filter(layer => {
    // Only include objects that are NOT members of any group
    return !groupMembershipMap.has(String(layer.id));
  });
  
  console.log('Ungrouped objects:', ungroupedObjects);

  // Recursive function to update objects in groups with current versions
  const updateGroupChildren = (groupChildren: LayerItem[], currentObjectLayers: ObjectLayerItem[]): LayerItem[] => {
    return groupChildren.map(child => {
      if (child.isGroup) {
        // Recursively update children of nested groups
        const updatedChildren = updateGroupChildren((child as LayerGroupItem).children, currentObjectLayers);
        return {
          ...(child as LayerGroupItem),
          children: updatedChildren
        };
      } else {
        // For objects, find the current version from objectLayers
        const currentObject = currentObjectLayers.find(layer => String(layer.id) === String(child.id));
        return currentObject || child; // Return existing if not found (might be deleted later)
      }
    }).filter(Boolean); // Remove any nulls or undefined values
  };
  
  // Update existing groups with current objects
  const validGroups = existingGroups.map(group => {
    const validChildren = updateGroupChildren(group.children, objectLayers);
    
    return {
      ...group,
      children: validChildren
    };
  }).filter(group => group.children.length > 0);
  
  console.log('Valid groups after processing:', validGroups);
  
  // Combine groups and ungrouped objects - groups first so they appear at the top
  return [...validGroups, ...ungroupedObjects];
}

/**
 * Creates a new layer group with the given name and children
 */
export function createLayerGroup(
  name: string, 
  children: LayerItem[] = []
): LayerGroupItem {
  return {
    id: `group-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name,
    type: 'group',
    visible: true,
    children,
    expanded: true,
    isGroup: true
  };
}

/**
 * Finds a layer by its ID in a hierarchical layer structure
 */
export function findLayerById(
  layers: LayerItem[],
  id: string | number
): LayerItem | null {
  for (const layer of layers) {
    if (layer.id === id) {
      return layer;
    }
    
    if (layer.isGroup) {
      const found = findLayerById(layer.children, id);
      if (found) return found;
    }
  }
  
  return null;
}

/**
 * Updates a layer's visibility state in a hierarchical structure
 */
export function toggleLayerVisibility(
  layers: LayerItem[],
  targetId: string | number
): LayerItem[] {
  return layers.map(layer => {
    if (layer.id === targetId) {
      return { ...layer, visible: !layer.visible };
    }
    
    if (layer.isGroup) {
      return {
        ...layer,
        children: toggleLayerVisibility(layer.children, targetId)
      };
    }
    
    return layer;
  });
}

/**
 * Toggles expansion state of a group in a hierarchical structure
 */
export function toggleGroupExpanded(
  layers: LayerItem[],
  groupId: string | number
): LayerItem[] {
  return layers.map(layer => {
    if (layer.id === groupId && layer.isGroup) {
      return { ...layer, expanded: !layer.expanded };
    }
    
    if (layer.isGroup) {
      return {
        ...layer,
        children: toggleGroupExpanded(layer.children, groupId)
      };
    }
    
    return layer;
  });
}
