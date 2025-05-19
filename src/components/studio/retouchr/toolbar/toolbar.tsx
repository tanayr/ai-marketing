"use client";

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TextTool } from './text-tool';
import { RetouchrImageTool } from './retouchr-image-tool';
import { BackgroundTool } from './background-tool';
import { LayersTool } from './layers-tool';
import { ExportTool } from './export-tool';
import { useCanvas } from '../hooks/use-canvas';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Type, 
  Image, 
  Layers, 
  PaintBucket, 
  Download 
} from 'lucide-react';

interface ToolbarProps {
  onSave?: () => void;
  isSaving?: boolean;
  defaultCollapsed?: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({ 
  onSave,
  isSaving = false,
  defaultCollapsed = false
}) => {
  const [activeTool, setActiveTool] = useState<string>("text");
  const { selectedObjects } = useCanvas();
  
  // Apply default collapsed state on component mount
  useEffect(() => {
    // If defaultCollapsed is true, the toolbar is already rendered in collapsed state
    // No additional action needed as we've already made the default layout collapsed
  }, [defaultCollapsed]);
  
  // Effect to handle object selection changes
  useEffect(() => {
    if (selectedObjects.length > 0) {
      const obj = selectedObjects[0];
      // Switch to relevant tool based on selected object type
      if (obj.type === 'text') {
        setActiveTool('text');
      } else if (obj.type === 'image') {
        setActiveTool('image');
      }
    }
  }, [selectedObjects]);

  // Tool button component to reduce repetition
  const ToolButton = ({ name, icon, title }: { name: string; icon: React.ReactNode; title: string }) => (
    <button 
      className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors
        ${activeTool === name 
          ? 'bg-primary/30 text-primary border-l-2 border-primary shadow-sm font-medium ring-1 ring-primary/20' 
          : 'text-muted-foreground hover:bg-accent/40'}`}
      onClick={() => setActiveTool(name)}
      title={title}
    >
      <div className={`${activeTool === name ? 'scale-110' : ''} transition-transform`}>
        {icon}
      </div>
    </button>
  );
  
  return (
    <>
      {/* Collapsed sidebar with icons only */}
      <div className="w-14 border-r h-full flex flex-col bg-card overflow-hidden">
        <div className="flex flex-col items-center py-3 gap-1 mt-2">
          <ToolButton 
            name="text" 
            icon={<Type className="h-5 w-5" />} 
            title="Text Tool"
          />
          
          <ToolButton 
            name="image" 
            icon={<Image className="h-5 w-5" />} 
            title="Image Tool"
          />
          
          <ToolButton 
            name="background" 
            icon={<PaintBucket className="h-5 w-5" />} 
            title="Background Tool"
          />
          
          <ToolButton 
            name="layers" 
            icon={<Layers className="h-5 w-5" />} 
            title="Layers"
          />
        </div>
      </div>
      
      {/* Tool panel - shows based on selected tool */}
      {activeTool && (
        <div className="w-64 border-r h-full flex flex-col bg-card overflow-hidden">
          <div className="py-2 px-3 border-b flex items-center">
            <h2 className="font-medium text-sm text-muted-foreground">
              {activeTool === 'text' && 'Text Tool'}
              {activeTool === 'image' && 'Image Tool'}
              {activeTool === 'background' && 'Background'}
              {activeTool === 'layers' && 'Layers'}
            </h2>
          </div>
          
          <ScrollArea className="flex-1">
            <div>
              {activeTool === 'text' && <TextTool />}
              {activeTool === 'image' && <RetouchrImageTool />}
              {activeTool === 'background' && <BackgroundTool />}
              {activeTool === 'layers' && <LayersTool />}
            </div>
          </ScrollArea>
        </div>
      )}
    </>
  );
};
