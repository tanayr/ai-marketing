"use client";

import { useState } from 'react';
import { ToolDebugPanel } from './ToolDebugPanel';
import { Button } from '@/components/ui/button';
import { X, Wrench } from 'lucide-react';

export function ToolDebugContainer() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed top-4 right-4 z-50">
      {isOpen ? (
        <div className="relative">
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-2 top-2 z-10 rounded-full bg-background shadow-sm hover:bg-muted"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
          <ToolDebugPanel />
        </div>
      ) : (
        <Button 
          variant="default" 
          size="sm" 
          className="flex items-center gap-2 shadow-lg"
          onClick={() => setIsOpen(true)}
        >
          <Wrench className="h-4 w-4" />
          Debug Tools
        </Button>
      )}
    </div>
  );
}
