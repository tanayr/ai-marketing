"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ImagePlus, Loader2 } from 'lucide-react';

interface GenerationStepProps {
  streamingImage: string | null;
  finalImage: string | null;
  generationStatus: 'idle' | 'starting' | 'in_progress' | 'generating' | 'completed' | 'error';
  isCreatingDesign?: boolean;
  onUseImage: () => void;
}

export function GenerationStep({
  streamingImage,
  finalImage,
  generationStatus,
  isCreatingDesign = false,
  onUseImage
}: GenerationStepProps) {
  // Rotating status messages to show during generation
  const statusMessages = [
    "Analyzing product and inspiration...",
    "Generating creative concepts...",
    "Creating visual elements...",
    "Combining product with inspiration style...",
    "Adding final details...",
    "Optimizing image quality...",
    "Rendering final image..."
  ];
  
  const [statusIndex, setStatusIndex] = useState(0);
  const [generationStage, setGenerationStage] = useState<string | null>(null);
  
  // Rotate through status messages during generation
  useEffect(() => {
    if (!finalImage) {
      const interval = setInterval(() => {
        setStatusIndex((prev) => (prev + 1) % statusMessages.length);
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [finalImage, statusMessages.length]);
  
  // Update generation stage based on status
  useEffect(() => {
    switch (generationStatus) {
      case 'starting':
        setGenerationStage("Initializing generation...");
        break;
      case 'in_progress':
        setGenerationStage("Preparing generation...");
        break;
      case 'generating':
        setGenerationStage("Creating your image...");
        break;
      case 'completed':
        setGenerationStage("Generation complete!");
        // Stop rotating status messages when generation is complete
        setStatusIndex(statusMessages.length - 1);
        break;
      case 'error':
        setGenerationStage("Generation failed. Please try again.");
        break;
      default:
        setGenerationStage(null);
    }
  }, [generationStatus, statusMessages.length]);
  
  return (
    <div className="p-8 sm:p-10 md:w-2/3 overflow-hidden bg-muted/10 flex flex-col">
      <div className="flex items-center gap-2 mb-6">
        <div>
          <h3 className="font-semibold text-xl">Generating Creative</h3>
          <p className="text-muted-foreground text-sm animate-pulse">
            {generationStage || statusMessages[statusIndex]}
          </p>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center">
        {streamingImage ? (
          <div className="relative max-w-xl mx-auto transition-all duration-300 ease-in-out">
            <div className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden shadow-lg flex items-center justify-center p-2">
              {/* Use regular img tag for better base64 handling */}
              <img
                src={streamingImage}
                alt="AI Generated Preview"
                className="max-h-full max-w-full object-contain transition-opacity duration-300"
              />
              
              {/* Full overlay that only disappears when generation is completed */}
              {generationStatus !== 'completed' && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                  <div className="animate-spin h-8 w-8 border-3 border-white border-t-transparent rounded-full mb-3"></div>
                  <p className="text-white font-medium text-center px-4">
                    {generationStatus === 'generating' ? 'Generating image...' : 'Preparing your creation...'}
                  </p>
                  <p className="text-white/70 text-sm mt-2 text-center px-4">
                    This preview will update as your image is created
                  </p>
                </div>
              )}
            </div>
            
            {/* Status indicator at bottom right */}
            {generationStatus !== 'completed' && generationStatus !== 'idle' && (
              <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1.5 rounded-full text-sm flex items-center gap-2">
                <span className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full"></span>
                {generationStatus === 'generating' ? 'Generating...' : 'Preparing...'}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 bg-gray-50 rounded-lg">
            <Loader2 className="h-12 w-12 animate-spin mb-4 text-primary" />
            <p className="text-gray-600">Starting AI generation...</p>
            <p className="text-gray-400 text-sm mt-2">This may take a few moments</p>
          </div>
        )}
        
        {finalImage && (
          <Button 
            size="lg" 
            className="mt-6" 
            onClick={onUseImage}
            disabled={isCreatingDesign}
          >
            {isCreatingDesign ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating design...
              </>
            ) : (
              <>
                <ImagePlus className="mr-2 h-4 w-4" />
                Use This Image
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
