"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { FolderPlus, FolderMinus, Layers as LayersIcon } from 'lucide-react';

interface LayerControlsProps {
  onCreateGroup: () => void;
  onUngroup: () => void;
  canGroup: boolean;
  canUngroup: boolean;
}

/**
 * Component for layer control buttons (group, ungroup, etc.)
 */
export const LayerControls: React.FC<LayerControlsProps> = ({
  onCreateGroup,
  onUngroup,
  canGroup,
  canUngroup
}) => {
  return (
    <div className="flex space-x-1 mb-2">
      <Button
        variant="outline"
        size="sm"
        className="h-7 text-xs w-full flex items-center justify-center"
        onClick={onCreateGroup}
        disabled={!canGroup}
        title="Create a group from selected layers"
      >
        <FolderPlus className="h-3.5 w-3.5 mr-1" />
        Group
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        className="h-7 text-xs w-full flex items-center justify-center"
        onClick={onUngroup}
        disabled={!canUngroup}
        title="Ungroup selected group"
      >
        <FolderMinus className="h-3.5 w-3.5 mr-1" />
        Ungroup
      </Button>
    </div>
  );
};
