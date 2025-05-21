"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Pencil } from 'lucide-react';

interface EditableNameProps {
  name: string;
  onChangeName: (newName: string) => void;
  className?: string;
}

/**
 * A component that displays a name that can be edited inline
 */
export const EditableName: React.FC<EditableNameProps> = ({
  name,
  onChangeName,
  className = ''
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Update internal value when prop changes
  useEffect(() => {
    setEditValue(name);
  }, [name]);
  
  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      // Select all text
      inputRef.current.select();
    }
  }, [isEditing]);
  
  const handleStartEdit = () => {
    setIsEditing(true);
  };
  
  const handleBlur = () => {
    setIsEditing(false);
    if (editValue.trim() !== '') {
      onChangeName(editValue);
    } else {
      // Reset to original if empty
      setEditValue(name);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(name);
    }
  };
  
  return (
    <div className={`relative flex items-center ${className}`}>
      {isEditing ? (
        <Input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="py-0 px-1 h-4 text-xs"
          autoFocus
        />
      ) : (
        <div className="flex items-center justify-between w-full group text-xs">
          <span className="truncate">{name}</span>
          <button 
            onClick={handleStartEdit}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-primary focus:outline-none"
            aria-label="Edit name"
          >
            <Pencil className="h-2.5 w-2.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default EditableName;
