"use client";

import React, { useState, useRef, useEffect } from 'react';

interface EditableNameProps {
  name: string;
  onRename: (newName: string) => void;
  className?: string;
  placeholder?: string;
}

/**
 * Component for editable text fields, used for renaming layers and groups
 */
export const EditableName: React.FC<EditableNameProps> = ({
  name,
  onRename,
  className = '',
  placeholder = 'Name'
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Update internal state when name prop changes
  useEffect(() => {
    setEditValue(name);
  }, [name]);
  
  // Auto-focus the input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);
  
  // Handle click to start editing
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };
  
  // Handle saving the name
  const handleSave = () => {
    setIsEditing(false);
    
    // Only save if the name has changed and is not empty
    if (editValue.trim() !== name && editValue.trim() !== '') {
      onRename(editValue.trim());
    } else {
      // Reset to original name if empty or unchanged
      setEditValue(name);
    }
  };
  
  // Handle pressing Enter or Escape
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(name);
    }
  };
  
  // Handle input blur (lose focus)
  const handleBlur = () => {
    handleSave();
  };
  
  return (
    <div 
      className={`editable-name ${className}`}
      onClick={handleClick}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full px-1 py-0.5 text-xs rounded border border-primary focus:outline-none"
          placeholder={placeholder}
        />
      ) : (
        <span className="truncate cursor-text">
          {name || placeholder}
        </span>
      )}
    </div>
  );
};
