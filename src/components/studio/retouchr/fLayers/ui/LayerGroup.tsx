"use client";

import React from 'react';
import { GroupLayerItem, LayerItem as LayerItemType } from '../core/types';
import { LayerItem } from './LayerItem';

interface LayerGroupProps {
  layers: LayerItemType[];
  selectedId: string | null;
  selectedIds?: string[]; // Array of selected IDs for multi-selection
  onSelect: (id: string, shiftKey?: boolean) => void; // Updated to support shift-click
  onToggleVisibility: (id: string) => void;
  onRename?: (id: string, name: string) => void;
  onToggleExpand?: (id: string) => void;
  onMoveUp?: (id: string) => void;
  onMoveDown?: (id: string) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  nestingLevel?: number;
}

/**
 * Component for recursively rendering layer hierarchy
 */
export const LayerGroup: React.FC<LayerGroupProps> = ({
  layers,
  selectedId,
  selectedIds = [], // Default to empty array if not provided
  onSelect,
  onToggleVisibility,
  onRename,
  onToggleExpand,
  onMoveUp,
  onMoveDown,
  onDelete,
  onDuplicate,
  nestingLevel = 0
}) => {
  return (
    <div className="space-y-1">
      {layers.map(layer => (
        <div key={layer.id} className="relative">
          {/* Render layer item */}
          <LayerItem
            layer={layer}
            selected={layer.id === selectedId || selectedIds.includes(layer.id)}
            onSelect={onSelect}
            onToggleVisibility={onToggleVisibility}
            onRename={onRename}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onToggleExpand={onToggleExpand}
            nestingLevel={nestingLevel}
          />
          
          {/* Recursively render children for expanded groups */}
          {layer.isGroup && layer.expanded && (
            <div className="pl-2 mt-0.5 space-y-1">
              <LayerGroup
                layers={(layer as GroupLayerItem).children}
                selectedId={selectedId}
                selectedIds={selectedIds}
                onSelect={onSelect}
                onToggleVisibility={onToggleVisibility}
                onRename={onRename}
                onToggleExpand={onToggleExpand}
                onMoveUp={onMoveUp}
                onMoveDown={onMoveDown}
                onDelete={onDelete}
                onDuplicate={onDuplicate}
                nestingLevel={nestingLevel + 1}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
