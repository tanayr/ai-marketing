"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Trash2, 
  Eye, 
  EyeOff,
  Copy,
  ChevronDown,
  ChevronRight,
  FileText,
  Image,
  SquareIcon,
  CircleIcon,
  PenTool
} from 'lucide-react';
import { EditableName } from './editable-name';
import { LayerItem, ObjectLayerItem, LayerGroupItem } from './layer-types';

interface LayerItemProps {
  layer: LayerItem;
  selected: boolean;
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
 * Component for displaying a single layer or group in the layers panel
 */
export const LayerItemComponent: React.FC<LayerItemProps> = ({
  layer,
  selected,
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
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    onSelect(layer);
  };
  
  // Style classes for the layer item
  const containerClasses = `
    p-1 rounded border text-xs
    ${selected ? 'border-primary bg-primary/5' : 'border-border'}
    ${!layer.visible ? 'opacity-50' : ''}
    hover:bg-accent/10 transition-colors duration-150
  `;
  
  // Padding left based on nesting level
  const indentStyle = {
    paddingLeft: `${nestingLevel * 8 + 4}px`
  };
  
  return (
    <div className={containerClasses}>
      <div className="flex items-center justify-between">
        {/* Layer name and toggle */}
        <div 
          className="flex items-center flex-grow cursor-pointer overflow-hidden"
          onClick={handleClick}
        >
          {/* Expand/collapse toggle for groups */}
          {layer.isGroup ? (
            <button 
              className="mr-0.5 hover:text-primary focus:outline-none"
              onClick={(e) => {
                e.stopPropagation();
                if (onToggleExpand) onToggleExpand(layer);
              }}
            >
              {layer.expanded ? 
                <ChevronDown className="h-3 w-3" /> : 
                <ChevronRight className="h-3 w-3" />
              }
            </button>
          ) : (
            <div style={{ width: '12px' }}></div>
          )}
          
          {/* Layer type icon and name */}
          <div className="flex items-center flex-grow truncate" style={indentStyle}>
            {/* Layer type icon */}
            <span className="mr-1 flex-shrink-0">
              {layer.isGroup ? (
                <span className="text-primary text-xs">📁</span>
              ) : layer.type === 'text' ? (
                <FileText className="h-3 w-3 text-blue-500" />
              ) : layer.type === 'image' ? (
                <Image className="h-3 w-3 text-green-500" />
              ) : layer.type === 'rect' ? (
                <SquareIcon className="h-3 w-3 text-orange-500" />
              ) : layer.type === 'circle' ? (
                <CircleIcon className="h-3 w-3 text-purple-500" />
              ) : layer.type === 'path' ? (
                <PenTool className="h-3 w-3 text-pink-500" />
              ) : (
                <div className="h-3 w-3 rounded-sm bg-gray-400" />
              )}
            </span>
            
            {/* Layer name - editable for groups */}
            {layer.isGroup && onRenameGroup ? (
              <EditableName 
                name={layer.name || 'Group'} 
                onChangeName={(newName) => onRenameGroup(layer, newName)}
                className="flex-grow"
              />
            ) : (
              <span className="truncate">{layer.name || layer.type}</span>
            )}
          </div>
        </div>
        
        {/* Layer controls */}
        <div className="flex space-x-0.5 ml-1">
          {/* Visibility toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 p-0.5"
            title={layer.visible ? "Hide layer" : "Show layer"}
            onClick={() => onToggleVisibility(layer)}
          >
            {layer.visible ? 
              <Eye className="h-2.5 w-2.5" /> : 
              <EyeOff className="h-2.5 w-2.5" />
            }
          </Button>
          
          {/* Move up button (if not a group) */}
          {!layer.isGroup && onMoveUp && (
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 p-0.5"
              title="Move layer up"
              onClick={() => onMoveUp(layer)}
            >
              <ArrowUpCircle className="h-2.5 w-2.5" />
            </Button>
          )}
          
          {/* Move down button (if not a group) */}
          {!layer.isGroup && onMoveDown && (
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 p-0.5"
              title="Move layer down"
              onClick={() => onMoveDown(layer)}
            >
              <ArrowDownCircle className="h-2.5 w-2.5" />
            </Button>
          )}
          
          {/* Duplicate button (if not a group) */}
          {!layer.isGroup && onDuplicate && (
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 p-0.5"
              title="Duplicate layer"
              onClick={() => onDuplicate(layer)}
            >
              <Copy className="h-2.5 w-2.5" />
            </Button>
          )}
          
          {/* Delete button */}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 p-0.5"
              title="Delete layer"
              onClick={() => onDelete(layer)}
            >
              <Trash2 className="h-2.5 w-2.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LayerItemComponent;
