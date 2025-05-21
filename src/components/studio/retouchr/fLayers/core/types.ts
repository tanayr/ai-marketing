"use client";

import { fabric } from '../../utils/fabric-imports';

/**
 * Base interface for all layer items in the fLayers system
 */
export interface BaseLayerItem {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  editable: boolean;
  zIndex?: number;
}

/**
 * Interface for objects that are not groups
 */
export interface ObjectLayerItem extends BaseLayerItem {
  isGroup: false;
  objectRef: string; // ID reference to the actual fabric object
}

/**
 * Interface for group layers in the UI
 */
export interface GroupLayerItem extends BaseLayerItem {
  isGroup: true;
  expanded: boolean;
  children: LayerItem[];
}

/**
 * Union type for all layer items
 */
export type LayerItem = ObjectLayerItem | GroupLayerItem;

/**
 * Events for layer state management
 */
export type LayerEvent = 
  | { type: 'SELECT'; id: string }
  | { type: 'TOGGLE_VISIBILITY'; id: string }
  | { type: 'RENAME'; id: string; name: string }
  | { type: 'GROUP'; ids: string[]; name?: string }
  | { type: 'UNGROUP'; id: string }
  | { type: 'TOGGLE_EXPAND'; id: string }
  | { type: 'MOVE_UP'; id: string }
  | { type: 'MOVE_DOWN'; id: string }
  | { type: 'DELETE'; id: string }
  | { type: 'SET_LAYERS'; layers: LayerItem[] }
  | { type: 'INITIALIZE_WITH_GROUPS'; groups: GroupLayerItem[] };
