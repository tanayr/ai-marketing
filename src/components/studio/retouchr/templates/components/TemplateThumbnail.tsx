"use client";

import React from 'react';
import { Template } from '@/db/schema/templates';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TemplateThumbnailProps {
  template: Template;
  onClick: (template: Template) => void;
  isSelected?: boolean;
}

/**
 * Component for displaying a template thumbnail
 */
export const TemplateThumbnail: React.FC<TemplateThumbnailProps> = ({
  template,
  onClick,
  isSelected = false,
}) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card 
            className={`
              cursor-pointer transition-all duration-200 hover:shadow-md overflow-hidden
              ${isSelected ? 'ring-2 ring-primary border-primary' : 'hover:border-gray-400'}
            `}
            onClick={() => onClick(template)}
          >
            <CardContent className="p-0 overflow-hidden">
              <div className="relative aspect-square w-full h-24 bg-gray-100">
                {template.thumbnailUrl ? (
                  // Use regular img tag for data URLs which Next Image doesn't handle well
                  template.thumbnailUrl.startsWith('data:') ? (
                    <img
                      src={template.thumbnailUrl}
                      alt={template.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Image
                      src={template.thumbnailUrl}
                      alt={template.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                    />
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                    No preview
                  </div>
                )}
              </div>
              <div className="p-2">
                <h3 className="text-xs font-medium truncate">{template.name}</h3>
                <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                  {template.width} × {template.height}
                </p>
              </div>
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <div className="text-xs">
            <div className="font-semibold">{template.name}</div>
            {template.description && (
              <div className="mt-1 text-gray-400">{template.description}</div>
            )}
            <div className="mt-1 text-gray-400">Size: {template.width}×{template.height}</div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
