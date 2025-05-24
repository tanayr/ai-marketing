"use client";

import { GroupLayerItem, LayerItem } from '../core/types';

// Storage key prefix to avoid conflicts
const STORAGE_KEY_PREFIX = 'fLayers_';

/**
 * Save layer groups to localStorage
 * @param groups Layer groups to save
 */
export function saveLayerGroups(groups: GroupLayerItem[]): void {
  try {
    const groupsJson = JSON.stringify(groups);
    localStorage.setItem(`${STORAGE_KEY_PREFIX}groups`, groupsJson);
    console.log('Layer groups saved to storage:', groups.length);
  } catch (error) {
    console.error('Error saving layer groups to storage:', error);
  }
}

/**
 * Load layer groups from localStorage
 * @returns Saved layer groups or empty array
 */
export function loadLayerGroups(): GroupLayerItem[] {
  try {
    const groupsJson = localStorage.getItem(`${STORAGE_KEY_PREFIX}groups`);
    if (!groupsJson) {
      return [];
    }
    
    const groups = JSON.parse(groupsJson) as GroupLayerItem[];
    console.log('Layer groups loaded from storage:', groups.length);
    return groups;
  } catch (error) {
    console.error('Error loading layer groups from storage:', error);
    return [];
  }
}

/**
 * Save canvas-specific layer groups
 * @param canvasId Unique identifier for the canvas
 * @param groups Layer groups to save
 */
export function saveLayerGroupsForCanvas(canvasId: string, groups: GroupLayerItem[]): void {
  try {
    const key = `${STORAGE_KEY_PREFIX}canvas_${canvasId}`;
    const groupsJson = JSON.stringify(groups);
    localStorage.setItem(key, groupsJson);
    console.log(`Layer groups saved for canvas ${canvasId}:`, groups.length);
  } catch (error) {
    console.error('Error saving layer groups for canvas:', error);
  }
}

/**
 * Load canvas-specific layer groups
 * @param canvasId Unique identifier for the canvas
 * @returns Saved layer groups for this canvas or empty array
 */
export function loadLayerGroupsForCanvas(canvasId: string): GroupLayerItem[] {
  try {
    const key = `${STORAGE_KEY_PREFIX}canvas_${canvasId}`;
    const groupsJson = localStorage.getItem(key);
    if (!groupsJson) {
      return [];
    }
    
    const groups = JSON.parse(groupsJson) as GroupLayerItem[];
    console.log(`Layer groups loaded for canvas ${canvasId}:`, groups.length);
    return groups;
  } catch (error) {
    console.error('Error loading layer groups for canvas:', error);
    return [];
  }
}

/**
 * Clear all layer groups from storage
 */
export function clearLayerGroups(): void {
  try {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}groups`);
    console.log('Layer groups cleared from storage');
    
    // Also clear any canvas-specific groups
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.error('Error clearing layer groups from storage:', error);
  }
}

/**
 * Generate a hash ID for a canvas state
 * @param canvasData Serialized canvas data
 * @returns Hash string to identify this canvas state
 */
export function generateCanvasHash(canvasData: string): string {
  if (!canvasData) return '';
  
  // Simple hash of the canvas data to use as an identifier
  const hash = canvasData.length.toString(16) + '-' + 
               Math.abs(canvasData.split('').reduce(
                 (hash, char) => ((hash << 5) - hash) + char.charCodeAt(0), 0)
               ).toString(16).substring(0, 8);
  
  return hash;
}

/**
 * Get current layer groups for the given canvas
 * This function is used when saving design data to include layer groups
 * @param canvasId Unique identifier for the canvas
 * @returns Current layer groups for this canvas
 */
export function getCurrentLayerGroups(canvasId?: string): GroupLayerItem[] {
  if (canvasId) {
    return loadLayerGroupsForCanvas(canvasId);
  }
  return loadLayerGroups();
}
