"use client";

import React from 'react';
import { CreativeInspiration } from '@/db/schema/creative-inspirations';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wand2 } from 'lucide-react';

interface InspirationThumbnailProps {
  inspiration: CreativeInspiration;
  onClick: (inspiration: CreativeInspiration) => void;
  isSelected?: boolean;
}

/**
 * Component for displaying a creative inspiration thumbnail
 */
export const InspirationThumbnail: React.FC<InspirationThumbnailProps> = ({
  inspiration,
  onClick,
  isSelected = false,
}) => {
  return (
    <Card 
      data-inspiration-id={inspiration.id}
      className={`
        relative cursor-pointer transition-all duration-200 hover:shadow-md overflow-hidden
        ${isSelected ? 'ring-2 ring-primary border-primary' : 'hover:border-gray-400'}
      `}
    >
      <CardContent className="p-0 overflow-hidden">
        <div className="relative aspect-square w-full h-48 bg-gray-100">
          {inspiration.imageUrl ? (
            // Use regular img tag for data URLs which Next Image doesn't handle well
            inspiration.imageUrl.startsWith('data:') ? (
              <img
                src={inspiration.imageUrl}
                alt={inspiration.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Image
                src={inspiration.imageUrl}
                alt={inspiration.name}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover"
              />
            )
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No image
            </div>
          )}
        </div>
        
        {/* Hover overlay with Replicate button */}
        <div className="absolute inset-0 opacity-0 hover:opacity-100 bg-black/50 transition-opacity duration-200 flex flex-col justify-between p-2">
          <div className="flex flex-wrap gap-1">
            {inspiration.tags && inspiration.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="bg-black/60 text-white text-xs">
                {tag}
              </Badge>
            ))}
          </div>
          
          <div className="flex flex-col gap-2 w-full">
            <div className="text-white text-sm font-medium px-2">
              {inspiration.name}
            </div>
            <Button 
              onClick={(e) => {
                e.stopPropagation();
                onClick(inspiration);
              }}
              className="w-full"
              size="sm"
            >
              <Wand2 className="mr-2 h-4 w-4" />
              Replicate
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
