"use client";

import { LayerGroupItem } from './layer-types';

// Storage keys
const LAYER_GROUPS_STORAGE_KEY = 'retouchr_layer_groups';

/**
 * Saves layer groups to local storage to persist them between sessions
 * @param groups Current layer groups to save
 */
export function saveLayerGroups(groups: LayerGroupItem[]): void {
  try {
    const groupsJson = JSON.stringify(groups);
    localStorage.setItem(LAYER_GROUPS_STORAGE_KEY, groupsJson);
    console.log('Layer groups saved to storage:', groups.length);
  } catch (error) {
    console.error('Error saving layer groups to storage:', error);
  }
}

/**
 * Loads layer groups from local storage
 * @returns The stored layer groups or an empty array if none found
 */
export function loadLayerGroups(): LayerGroupItem[] {
  try {
    const groupsJson = localStorage.getItem(LAYER_GROUPS_STORAGE_KEY);
    if (!groupsJson) {
      return [];
    }
    
    const groups = JSON.parse(groupsJson) as LayerGroupItem[];
    console.log('Layer groups loaded from storage:', groups.length);
    return groups;
  } catch (error) {
    console.error('Error loading layer groups from storage:', error);
    return [];
  }
}

/**
 * Clears all stored layer groups from local storage
 */
export function clearLayerGroups(): void {
  try {
    localStorage.removeItem(LAYER_GROUPS_STORAGE_KEY);
    console.log('Layer groups cleared from storage');
  } catch (error) {
    console.error('Error clearing layer groups from storage:', error);
  }
}

/**
 * Associates groups with a specific canvas state by ID
 * @param canvasId Unique ID for the canvas state
 * @param groups Layer groups to associate with this canvas
 */
export function saveLayerGroupsForCanvas(canvasId: string, groups: LayerGroupItem[]): void {
  try {
    const key = `${LAYER_GROUPS_STORAGE_KEY}_${canvasId}`;
    const groupsJson = JSON.stringify(groups);
    localStorage.setItem(key, groupsJson);
    console.log(`Layer groups saved for canvas ${canvasId}:`, groups.length);
  } catch (error) {
    console.error('Error saving layer groups for canvas:', error);
  }
}

/**
 * Loads groups associated with a specific canvas state
 * @param canvasId Unique ID for the canvas state
 * @returns Layer groups associated with this canvas or empty array if none
 */
export function loadLayerGroupsForCanvas(canvasId: string): LayerGroupItem[] {
  try {
    const key = `${LAYER_GROUPS_STORAGE_KEY}_${canvasId}`;
    const groupsJson = localStorage.getItem(key);
    if (!groupsJson) {
      return [];
    }
    
    const groups = JSON.parse(groupsJson) as LayerGroupItem[];
    console.log(`Layer groups loaded for canvas ${canvasId}:`, groups.length);
    return groups;
  } catch (error) {
    console.error('Error loading layer groups for canvas:', error);
    return [];
  }
}
