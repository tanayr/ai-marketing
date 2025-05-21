"use client";

import React from 'react';
import { LayerItem, LayerGroupItem } from './layer-types';
import { LayerItemComponent } from './layer-item';

interface LayerListProps {
  layers: LayerItem[];
  selectedLayerId: string | number | null;
  onSelect: (layer: LayerItem) => void;
  onToggleVisibility: (layer: LayerItem) => void;
  onMoveUp?: (layer: LayerItem) => void;
  onMoveDown?: (layer: LayerItem) => void;
  onDelete?: (layer: LayerItem) => void;
  onDuplicate?: (layer: LayerItem) => void;
  onToggleExpand?: (group: LayerGroupItem) => void;
  onRenameGroup?: (group: LayerGroupItem, newName: string) => void;
  nestingLevel?: number;
}

/**
 * Recursive component for displaying layers and groups
 */
export const LayerList: React.FC<LayerListProps> = ({
  layers,
  selectedLayerId,
  onSelect,
  onToggleVisibility,
  onMoveUp,
  onMoveDown,
  onDelete,
  onDuplicate,
  onToggleExpand,
  onRenameGroup,
  nestingLevel = 0
}) => {
  return (
    <div className="space-y-1">
      {layers.map((layer) => (
        <div key={layer.id} className="relative">
          <LayerItemComponent
            layer={layer}
            selected={layer.id === selectedLayerId}
            onSelect={onSelect}
            onToggleVisibility={onToggleVisibility}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onToggleExpand={onToggleExpand}
            onRenameGroup={onRenameGroup}
            nestingLevel={nestingLevel}
          />
          
          {/* Recursively render children for expanded groups */}
          {layer.isGroup && layer.expanded && (
            <div className="pl-2 mt-0.5 space-y-1">
              <LayerList
                layers={layer.children}
                selectedLayerId={selectedLayerId}
                onSelect={onSelect}
                onToggleVisibility={onToggleVisibility}
                onMoveUp={onMoveUp}
                onMoveDown={onMoveDown}
                onDelete={onDelete}
                onDuplicate={onDuplicate}
                onToggleExpand={onToggleExpand}
                onRenameGroup={onRenameGroup}
                nestingLevel={nestingLevel + 1}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default LayerList;
