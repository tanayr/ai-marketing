"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Text, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { TextToolbarProps } from './types';

/**
 * Text case transformation control (lowercase, UPPERCASE, Capitalize)
 */
export const TextCaseControl: React.FC<TextToolbarProps> = ({ 
  canvas
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs px-1.5 gap-0.5"
          title="Change text case"
        >
          <Text className="h-3 w-3" />
          <ChevronDown className="h-2.5 w-2.5 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem
          className="text-xs cursor-pointer"
          onClick={() => {
            // Apply lowercase to the text
            const activeObject = canvas?.getActiveObject() as any;
            if (activeObject?.text) {
              activeObject.text = activeObject.text.toLowerCase();
              canvas?.renderAll();
            }
          }}
        >
          lowercase
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-xs cursor-pointer"
          onClick={() => {
            // Apply UPPERCASE to the text
            const activeObject = canvas?.getActiveObject() as any;
            if (activeObject?.text) {
              activeObject.text = activeObject.text.toUpperCase();
              canvas?.renderAll();
            }
          }}
        >
          UPPERCASE
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-xs cursor-pointer"
          onClick={() => {
            // Apply Capitalize to the text
            const activeObject = canvas?.getActiveObject() as any;
            if (activeObject?.text) {
              activeObject.text = activeObject.text
                .split(' ')
                .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
              canvas?.renderAll();
            }
          }}
        >
          Capitalize
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
