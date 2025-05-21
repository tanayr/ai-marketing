"use client";

import { fabric } from '../../utils/fabric-imports';
import { LayerItem, ObjectLayerItem, GroupLayerItem } from './types';

/**
 * Find a layer by its ID in the layer hierarchy
 */
export function findLayerById(layers: LayerItem[], id: string): LayerItem | undefined {
  // First check at the current level
  const directMatch = layers.find(layer => layer.id === id);
  if (directMatch) return directMatch;
  
  // Then check recursively in groups
  for (const layer of layers) {
    if (layer.isGroup) {
      const foundInGroup = findLayerById(layer.children, id);
      if (foundInGroup) return foundInGroup;
    }
  }
  
  return undefined;
}

/**
 * Update a layer by its ID
 */
export function updateLayer(
  layers: LayerItem[], 
  id: string, 
  updater: (layer: LayerItem) => LayerItem
): LayerItem[] {
  return layers.map(layer => {
    if (layer.id === id) {
      return updater(layer);
    }
    
    if (layer.isGroup) {
      return {
        ...layer,
        children: updateLayer(layer.children, id, updater)
      };
    }
    
    return layer;
  });
}

/**
 * Create a new UI group from layer items
 */
export function createGroup(
  items: LayerItem[], 
  name: string = "New Group"
): GroupLayerItem {
  return {
    id: `group-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    name,
    type: 'group',
    isGroup: true,
    expanded: true,
    visible: true,
    editable: true,
    children: [...items]
  };
}

/**
 * Extract filename from an image URL
 */
export function extractFilename(url: string): string {
  if (!url) return 'Image';
  
  try {
    // Handle data URLs
    if (url.startsWith('data:')) {
      return 'Image';
    }
    
    // Extract the last part of the path
    const urlParts = url.split('/');
    let filename = urlParts[urlParts.length - 1] || 'Image';
    
    // Remove query parameters
    filename = filename.split('?')[0];
    
    // URL decode if needed
    try {
      filename = decodeURIComponent(filename);
    } catch (e) {
      // If decoding fails, use as is
    }
    
    // Clean up and truncate if too long
    return filename.length > 20 ? `${filename.substring(0, 17)}...` : filename;
  } catch (e) {
    console.error('Error extracting filename:', e);
    return 'Image';
  }
}

/**
 * Get a display name for a layer based on its fabric.js object
 */
export function getLayerName(obj: any, index: number): string {
  // Check if object exists
  if (!obj) return `Layer ${index + 1}`;
  
  // Handle text layers
  if (obj.type === 'text') {
    // Try multiple ways to access the text content
    let textContent = '';
    
    // Approach 1: Direct text property
    if (typeof obj.text === 'string') {
      textContent = obj.text;
    }
    // Approach 2: Via get method (fabric method)
    else if (obj.get && typeof obj.get === 'function') {
      try {
        const content = obj.get('text');
        if (typeof content === 'string') {
          textContent = content;
        }
      } catch (e) {
        // Ignore errors from get
      }
    }
    // Approach 3: Check _textLines array (internal fabric property)
    else if (obj._textLines && Array.isArray(obj._textLines) && obj._textLines.length > 0) {
      textContent = obj._textLines.join(' ');
    }
    // Approach 4: Check _text property (another internal fabric property)
    else if (obj._text && typeof obj._text === 'string') {
      textContent = obj._text;
    }
    
    // Fallback
    if (!textContent.trim()) {
      return 'Text';
    }
    
    // Truncate if too long
    return textContent.length > 15 ? `${textContent.substring(0, 15)}...` : textContent;
  }
  
  // Handle image layers
  if (obj.type === 'image') {
    const src = obj.src || (obj._element && obj._element.src) || '';
    return extractFilename(src);
  }
  
  // Handle other types
  const typeMap: Record<string, string> = {
    rect: 'Rectangle',
    circle: 'Circle',
    path: 'Path',
    line: 'Line',
    polygon: 'Polygon',
    polyline: 'Polyline',
    triangle: 'Triangle',
    group: 'Group',
  };
  
  return typeMap[obj.type] || `${obj.type || 'Object'} ${index + 1}`;
}

/**
 * Delete a layer from the layer structure
 */
export function deleteLayer(layers: LayerItem[], id: string): LayerItem[] {
  // Filter out the layer at the current level
  const filteredLayers = layers.filter(layer => layer.id !== id);
  
  // If we didn't find the layer, recursively check groups
  if (filteredLayers.length === layers.length) {
    return layers.map(layer => {
      if (layer.isGroup) {
        return {
          ...layer,
          children: deleteLayer(layer.children, id)
        };
      }
      return layer;
    });
  }
  
  return filteredLayers;
}

/**
 * Check if all children of a group are visible
 */
export function areAllChildrenVisible(group: GroupLayerItem): boolean {
  return group.children.every(child => {
    if (!child.visible) return false;
    if (child.isGroup) return areAllChildrenVisible(child);
    return true;
  });
}

/**
 * Set visibility for all children of a group
 */
export function setChildrenVisibility(
  group: GroupLayerItem, 
  visible: boolean
): GroupLayerItem {
  return {
    ...group,
    children: group.children.map(child => {
      if (child.isGroup) {
        return setChildrenVisibility(child, visible);
      }
      return { ...child, visible };
    })
  };
}

/**
 * Move a layer up in the stack (decrease z-index)
 */
export function moveLayerUp(layers: LayerItem[], id: string): LayerItem[] {
  // Find the layer and its index
  for (let i = 0; i < layers.length; i++) {
    if (layers[i].id === id && i > 0) {
      // Swap with the layer above
      const newLayers = [...layers];
      [newLayers[i], newLayers[i - 1]] = [newLayers[i - 1], newLayers[i]];
      return newLayers;
    }
  }
  
  // If not found, check in groups
  return layers.map(layer => {
    if (layer.isGroup) {
      return {
        ...layer,
        children: moveLayerUp(layer.children, id)
      };
    }
    return layer;
  });
}

/**
 * Move a layer down in the stack (increase z-index)
 */
export function moveLayerDown(layers: LayerItem[], id: string): LayerItem[] {
  // Find the layer and its index
  for (let i = 0; i < layers.length; i++) {
    if (layers[i].id === id && i < layers.length - 1) {
      // Swap with the layer below
      const newLayers = [...layers];
      [newLayers[i], newLayers[i + 1]] = [newLayers[i + 1], newLayers[i]];
      return newLayers;
    }
  }
  
  // If not found, check in groups
  return layers.map(layer => {
    if (layer.isGroup) {
      return {
        ...layer,
        children: moveLayerDown(layer.children, id)
      };
    }
    return layer;
  });
}
