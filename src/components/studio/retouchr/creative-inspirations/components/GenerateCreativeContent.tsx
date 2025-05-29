"use client";

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ShopifyProduct } from '@/db/schema/shopify-products';
import { CreativeInspiration } from '@/db/schema/creative-inspirations';
import { GenerationStep } from './GenerationStep';
import { useAIImageGeneration } from '../hooks/useAIImageGeneration';
import { toast } from 'sonner';
import { createDesignWithAIImage } from '../utils/canvas-integration';

interface GenerateCreativeContentProps {
  inspiration: CreativeInspiration;
  product: ShopifyProduct;
  onComplete: () => void;
}

export function GenerateCreativeContent({
  inspiration,
  product,
  onComplete
}: GenerateCreativeContentProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [generationAttempts, setGenerationAttempts] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isCreatingDesign, setIsCreatingDesign] = useState(false);
  const { 
    isGenerating, 
    streamingImage, 
    finalImage, 
    generationStatus,
    generateImage 
  } = useAIImageGeneration();
  
  // Start generation automatically when component mounts
  useEffect(() => {
    // Prevent starting new generations when we already have a final image
    if (finalImage) {
      console.log('Already have a final image, skipping generation');
      return;
    }
    
    const startGeneration = async () => {
      try {
        setIsRetrying(generationAttempts > 0);
        console.log(`Starting AI image generation... (Attempt ${generationAttempts + 1})`);
        console.log('Inspiration:', inspiration.name, `(${inspiration.width}x${inspiration.height})`);
        console.log('Product:', product.title);
        console.log('Using partial images: 3 (maximum allowed by OpenAI API)');
        
        setError(null);
        const result = await generateImage(inspiration, product);
        
        if (result) {
          console.log('Generation completed successfully with result:', result.substring(0, 50) + '...');
          // Stop further generations when we have a result
          return;
        } else {
          console.log('Generation completed but no image was returned');
          // If we didn't get an error but also didn't get an image, retry up to 2 times
          if (generationAttempts < 2) {
            // Use timeout to avoid immediate retry that could cause race conditions
            setTimeout(() => setGenerationAttempts(prev => prev + 1), 1000);
          } else {
            setError('Failed to generate image after multiple attempts');
            toast.error('Failed to generate creative');
          }
        }
      } catch (error) {
        console.error('Error during generation:', error);
        setError(error instanceof Error ? error.message : 'Failed to generate image');
        toast.error('Failed to generate creative');
        
        // Retry up to 2 times on error
        if (generationAttempts < 2) {
          // Use timeout to avoid immediate retry that could cause race conditions
          setTimeout(() => setGenerationAttempts(prev => prev + 1), 1000);
        }
      }
    };
    
    // Only start a new generation if we're not already generating
    if (!isGenerating) {
      startGeneration();
    }
  }, [inspiration, product, generateImage, generationAttempts, isGenerating, finalImage]);
  
  // Handle using the generated image
  const handleUseImage = async () => {
    // Prevent multiple clicks
    if (isCreatingDesign) {
      return;
    }
    
    if (!finalImage) {
      toast.error('No image has been generated yet');
      return;
    }
    
    try {
      setIsCreatingDesign(true);
      toast.loading('Creating your design...', { id: 'create-design' });
      
      await createDesignWithAIImage({
        imageUrl: finalImage,
        inspiration,
        product,
        router
      });
      
      toast.success('Design created successfully!', { id: 'create-design' });
      onComplete();
    } catch (error) {
      console.error('Error creating design:', error);
      toast.error('Failed to create design with generated image', { id: 'create-design' });
    } finally {
      setIsCreatingDesign(false);
    }
  };
  
  // Show error state if something went wrong and we're not retrying
  if (error && !isRetrying) {
    return (
      <div className="p-8 sm:p-10 md:w-2/3 overflow-hidden bg-muted/10 flex flex-col">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="bg-red-50 p-4 rounded-lg mb-4">
            <p className="text-red-600">{error}</p>
          </div>
          <div className="mt-2 mb-4">
            <p className="text-sm text-muted-foreground">
              This could be due to temporary issues with the AI service. You can try again or go back.
            </p>
          </div>
          <div className="flex gap-4">
            <Button 
              variant="outline" 
              onClick={() => setGenerationAttempts(prev => prev + 1)}
              className="mt-4"
            >
              Try Again
            </Button>
            <Button 
              variant="outline" 
              onClick={onComplete}
              className="mt-4"
            >
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <GenerationStep
      streamingImage={streamingImage}
      finalImage={finalImage}
      generationStatus={generationStatus}
      onUseImage={handleUseImage}
      isCreatingDesign={isCreatingDesign}
    />
  );
}
