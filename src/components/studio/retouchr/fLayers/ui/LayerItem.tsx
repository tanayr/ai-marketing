"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Eye, 
  EyeOff, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Trash2, 
  Copy, 
  ChevronDown, 
  ChevronRight,
  FileText,
  Image,
  SquareIcon,
  CircleIcon,
  PenTool
} from 'lucide-react';
import { LayerItem as LayerItemType } from '../core/types';
import { EditableName } from './EditableName';

interface LayerItemProps {
  layer: LayerItemType;
  selected: boolean;
  onSelect: (id: string, shiftKey?: boolean) => void;
  onToggleVisibility: (id: string) => void;
  onRename?: (id: string, name: string) => void;
  onMoveUp?: (id: string) => void;
  onMoveDown?: (id: string) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onToggleExpand?: (id: string) => void;
  nestingLevel?: number;
}

/**
 * Component for rendering a single layer item
 */
export const LayerItem: React.FC<LayerItemProps> = ({
  layer,
  selected,
  onSelect,
  onToggleVisibility,
  onRename,
  onMoveUp,
  onMoveDown,
  onDelete,
  onDuplicate,
  onToggleExpand,
  nestingLevel = 0
}) => {
  // Handle click to select this layer with improved shift key detection
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Log the click event for debugging
    console.log(`Clicked layer ${layer.id}, shift key:`, e.shiftKey);
    
    // Pass the shift key state to support multi-selection
    onSelect(layer.id, e.shiftKey);
  };
  
  // Additional keyboard event handler for better multi-selection support
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle keyboard-based selection (e.g. Shift+Enter)
    if (e.key === 'Enter') {
      e.stopPropagation();
      onSelect(layer.id, e.shiftKey);
    }
  };
  
  // CSS classes for the layer item
  const containerClasses = `
    p-1 rounded border text-xs
    ${selected ? 'border-primary bg-primary/5' : 'border-border'}
    ${!layer.visible ? 'opacity-50' : ''}
    hover:bg-accent/10 transition-colors duration-150
  `;
  
  // Padding based on nesting level
  const indentStyle = {
    paddingLeft: `${nestingLevel * 8 + 4}px`
  };
  
  // Handle rename if editable
  const handleRename = (newName: string) => {
    if (onRename) {
      onRename(layer.id, newName);
    }
  };
  
  // Get icon for layer type
  const getLayerIcon = () => {
    if (layer.isGroup) {
      return <span className="text-primary text-xs">📁</span>;
    }
    
    switch (layer.type) {
      case 'text':
        return <FileText className="h-3 w-3 text-blue-500" />;
      case 'image':
        return <Image className="h-3 w-3 text-green-500" />;
      case 'rect':
        return <SquareIcon className="h-3 w-3 text-orange-500" />;
      case 'circle':
        return <CircleIcon className="h-3 w-3 text-purple-500" />;
      case 'path':
        return <PenTool className="h-3 w-3 text-pink-500" />;
      default:
        return <div className="h-3 w-3 rounded-sm bg-gray-400" />;
    }
  };
  
  return (
    <div className={containerClasses}>
      <div className="flex items-center justify-between">
        {/* Main content - left section with expand/collapse and name */}
        <div 
          className="flex items-center gap-1 flex-1 cursor-pointer" 
          style={indentStyle}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          tabIndex={0} /* Make the div focusable for keyboard navigation */
          role="button"
          aria-selected={selected}
        >
          {/* Expand/collapse toggle for groups */}
          {layer.isGroup ? (
            <button 
              className="mr-0.5 hover:text-primary focus:outline-none"
              onClick={(e) => {
                e.stopPropagation();
                if (onToggleExpand) onToggleExpand(layer.id);
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
              {getLayerIcon()}
            </span>
            
            {/* Layer name */}
            {layer.editable ? (
              <EditableName 
                name={layer.name} 
                onRename={handleRename}
                className="flex-grow truncate"
              />
            ) : (
              <span className="truncate">{layer.name}</span>
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
            onClick={(e) => {
              e.stopPropagation();
              onToggleVisibility(layer.id);
            }}
          >
            {layer.visible ? 
              <Eye className="h-2.5 w-2.5" /> : 
              <EyeOff className="h-2.5 w-2.5" />
            }
          </Button>
          
          {/* Move up button */}
          {onMoveUp && (
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 p-0.5"
              title="Move layer up"
              onClick={(e) => {
                e.stopPropagation();
                onMoveUp(layer.id);
              }}
            >
              <ArrowUpCircle className="h-2.5 w-2.5" />
            </Button>
          )}
          
          {/* Move down button */}
          {onMoveDown && (
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 p-0.5"
              title="Move layer down"
              onClick={(e) => {
                e.stopPropagation();
                onMoveDown(layer.id);
              }}
            >
              <ArrowDownCircle className="h-2.5 w-2.5" />
            </Button>
          )}
          
          {/* Duplicate button */}
          {!layer.isGroup && onDuplicate && (
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 p-0.5"
              title="Duplicate layer"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate(layer.id);
              }}
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
              onClick={(e) => {
                e.stopPropagation();
                onDelete(layer.id);
              }}
            >
              <Trash2 className="h-2.5 w-2.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
