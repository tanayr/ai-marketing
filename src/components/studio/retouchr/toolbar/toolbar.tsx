"use client";

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TextTool } from './text-tool';
import { RetouchrImageTool } from './retouchr-image-tool';
import { BackgroundTool } from './background-tool';
import { LayersTool } from './layers-tool';
import { ExportTool } from './export-tool';
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
  onSave?: () => Promise<void>;
  isSaving?: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({ 
  onSave,
  isSaving = false
}) => {
  return (
    <div className="w-72 border-r h-full flex flex-col bg-card overflow-hidden">
      <div className="p-4 border-b">
        <h2 className="font-semibold">Retouchr Tools</h2>
      </div>
      
      <Tabs defaultValue="text" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="w-full justify-between px-4 py-2 h-auto">
          <TabsTrigger value="text" className="flex flex-col items-center p-2 h-auto">
            <Type className="h-4 w-4 mb-1" />
            <span className="text-xs">Text</span>
          </TabsTrigger>
          <TabsTrigger value="image" className="flex flex-col items-center p-2 h-auto">
            <Image className="h-4 w-4 mb-1" />
            <span className="text-xs">Image</span>
          </TabsTrigger>
          <TabsTrigger value="background" className="flex flex-col items-center p-2 h-auto">
            <PaintBucket className="h-4 w-4 mb-1" />
            <span className="text-xs">Background</span>
          </TabsTrigger>
          <TabsTrigger value="layers" className="flex flex-col items-center p-2 h-auto">
            <Layers className="h-4 w-4 mb-1" />
            <span className="text-xs">Layers</span>
          </TabsTrigger>
          <TabsTrigger value="export" className="flex flex-col items-center p-2 h-auto">
            <Download className="h-4 w-4 mb-1" />
            <span className="text-xs">Export</span>
          </TabsTrigger>
        </TabsList>
        
        <Separator />
        
        <ScrollArea className="flex-1">
          <TabsContent value="text" className="m-0">
            <TextTool />
          </TabsContent>
          
          <TabsContent value="image" className="m-0">
            <RetouchrImageTool />
          </TabsContent>
          
          <TabsContent value="background" className="m-0">
            <BackgroundTool />
          </TabsContent>
          
          <TabsContent value="layers" className="m-0">
            <LayersTool />
          </TabsContent>
          
          <TabsContent value="export" className="m-0">
            <ExportTool onSave={onSave} isSaving={isSaving} />
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
};
