"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface PartialImage {
  index: number;
  base64: string;
}

interface StreamingImageProgressProps {
  partialImages: PartialImage[];
  progress: number;
  isGenerating: boolean;
}

/**
 * Component to display streaming image generation progress
 * Shows partial images as they become available during generation
 */
export function StreamingImageProgress({
  partialImages,
  progress,
  isGenerating,
}: StreamingImageProgressProps) {
  if (!isGenerating && partialImages.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Generation Progress</h2>
          <div className="text-sm text-muted-foreground">{progress}% Complete</div>
        </div>
        
        <Progress value={progress} className="mb-6" />
        
        {partialImages.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {partialImages.map((image) => (
              <div key={image.index} className="rounded-md overflow-hidden border">
                <div className="aspect-square relative">
                  <img
                    src={`data:image/png;base64,${image.base64}`}
                    alt={`Generation step ${image.index + 1}`}
                    className="object-cover w-full h-full"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-center py-1">
                    Step {image.index + 1}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
