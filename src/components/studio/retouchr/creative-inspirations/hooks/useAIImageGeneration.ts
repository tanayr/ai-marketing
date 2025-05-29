"use client";

import { useState } from 'react';
import { toast } from 'sonner';
import useOrganization from '@/lib/organizations/useOrganization';
import { ShopifyProduct } from '@/db/schema/shopify-products';
import { CreativeInspiration } from '@/db/schema/creative-inspirations';

interface GenerationParams {
  prompt: string;
  inspirationId: string;
  productId: string;
  width: number;
  height: number;
  referenceImageUrl?: string;
}

export function useAIImageGeneration() {
  const { organization } = useOrganization();
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingImage, setStreamingImage] = useState<string | null>(null);
  const [finalImage, setFinalImage] = useState<string | null>(null);
  const [generationStatus, setGenerationStatus] = useState<'idle' | 'starting' | 'in_progress' | 'generating' | 'completed' | 'error'>('idle');
  const [savedAsset, setSavedAsset] = useState<any | null>(null);
  
  /**
   * Get optimal image size for AI generation based on dimensions
   */
  const getOptimalImageSize = (width: number, height: number): string => {
    const aspectRatio = width / height;
    
    if (aspectRatio > 1.3) return '1792x1024'; // Landscape
    if (aspectRatio < 0.8) return '1024x1792'; // Portrait
    return '1024x1024'; // Square
  };
  
  /**
   * Generate creative image from product and inspiration
   */
  const generateImage = async (
    inspiration: CreativeInspiration,
    product: ShopifyProduct
  ): Promise<string | null> => {
    if (!organization) {
      toast.error("Organization context is required");
      return null;
    }
    
    try {
      setIsGenerating(true);
      setStreamingImage(null);
      setFinalImage(null);
      setGenerationStatus('starting');
      
      // Use the inspiration's predefined prompt directly
      const prompt = inspiration.prompt;
      
      // Get product image URL
      const referenceImageUrl = product.images && 
        product.images.length > 0 ? 
        product.images[0].src : undefined;
      
      // Determine optimal size
      const size = getOptimalImageSize(
        parseInt(inspiration.width), 
        parseInt(inspiration.height)
      );
      
      // Call the streaming API
      const response = await fetch('/api/app/studio/retouchr/ai-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          inspirationId: inspiration.id,
          productId: product.id,
          width: parseInt(inspiration.width),
          height: parseInt(inspiration.height),
          referenceImageUrl,
          size,
          // Max partial images allowed by OpenAI is 3
          partialImages: 3
        })
      });
      
      if (!response.ok || !response.body) {
        throw new Error("Failed to generate image");
      }
      
      // Process the stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let partialImagesReceived = 0;
      let lastPartialImage: string | null = null;
      
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        // Decode the chunk and add to buffer
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        
        // Process complete SSE events from the buffer
        let eventIndex;
        while ((eventIndex = buffer.indexOf('\n\n')) >= 0) {
          const eventData = buffer.slice(0, eventIndex);
          buffer = buffer.slice(eventIndex + 2); // +2 to skip the double newline
          
          // Process event - look for data: lines and event: lines
          const lines = eventData.split('\n');
          let dataJson = '';
          let eventType = '';
          
          for (const line of lines) {
            if (line.startsWith('event:')) {
              eventType = line.slice(7).trim(); // Extract event type
              console.log('Event type:', eventType);
            } else if (line.startsWith('data:')) {
              dataJson = line.slice(5).trim(); // Extract the JSON data
            }
          }
          
          // Process the JSON data if we found any
          if (dataJson) {
            try {
              const data = JSON.parse(dataJson);
              console.log('Stream event:', data.type);
              
              // Update generation status based on event type
              if (data.type === 'response.image_generation_call.in_progress') {
                setGenerationStatus('in_progress');
              } else if (data.type === 'response.image_generation_call.generating') {
                setGenerationStatus('generating');
              } else if (data.type === 'response.image_generation_call.completed') {
                setGenerationStatus('completed');
              }
              
              // Handle partial image events
              if (data.type === 'response.image_generation_call.partial_image') {
                // Extract the base64 image data from multiple possible locations
                const base64Data = data.partial_image_b64 || 
                                (data.content && data.content.image_b64) ||
                                data.image_b64;
                
                if (base64Data) {
                  // Keep track of which partial image we received
                  partialImagesReceived++;
                  console.log(`Received partial image ${partialImagesReceived}`);
                  
                  // Clean the base64 data if needed - some APIs include newlines or whitespace
                  const cleanBase64 = base64Data.replace(/\s/g, '');
                  
                  // Only update the UI with the latest partial image
                  lastPartialImage = `data:image/jpeg;base64,${cleanBase64}`;
                  setStreamingImage(lastPartialImage);
                }
              } 
              // Handle final image when generation is completed
              else if (data.type === 'response.image_generation_call.completed') {
                console.log('Image generation completed event received');
                // Look for image data in various locations
                const imageData = data.result || 
                               (data.content && data.content.image_b64) ||
                               data.image_b64;
                
                if (imageData) {
                  // Clean the base64 data if needed
                  const cleanBase64 = imageData.replace(/\s/g, '');
                  const finalImageUrl = `data:image/jpeg;base64,${cleanBase64}`;
                  setFinalImage(finalImageUrl);
                  
                  // Save the final image to user's assets
                  saveImageToAssets(cleanBase64, inspiration, product);
                  
                  return finalImageUrl;
                } else if (lastPartialImage) {
                  // If no final image but we have a partial image, use the last partial image
                  setFinalImage(lastPartialImage);
                  
                  // Extract base64 data from lastPartialImage and save it
                  const base64Data = lastPartialImage.split(',')[1];
                  saveImageToAssets(base64Data, inspiration, product);
                  
                  return lastPartialImage;
                }
              }
              // Look for final image in response.completed event
              else if (data.type === 'response.completed') {
                console.log('Final response completed event');
                
                // If we already have a final image, return it
                if (finalImage) {
                  return finalImage;
                }
                
                // Try to extract the image from the final response
                if (data.response && data.response.output) {
                  for (const output of data.response.output) {
                    if (output.type === 'image_generation_call' && output.content) {
                      const imageData = output.content.image_b64 || output.result;
                      if (imageData) {
                        const finalImageUrl = `data:image/jpeg;base64,${imageData}`;
                        setFinalImage(finalImageUrl);
                        return finalImageUrl;
                      }
                    }
                  }
                }
                
                // If we got a completion event but no final image, use the last partial image
                if (lastPartialImage) {
                  setFinalImage(lastPartialImage);
                  return lastPartialImage;
                }
              }
            } catch (error) {
              console.error('Error parsing streaming data:', error, '\nRaw data:', dataJson.substring(0, 100));
            }
          }
        }
      }
      
      return finalImage;
    } catch (error) {
      console.error("Error generating image:", error);
      toast.error("Failed to generate creative");
      setGenerationStatus('error');
      return null;
    } finally {
      setIsGenerating(false);
    }
  };
  
  
  /**
   * Save the generated image to the user's assets
   */
  const saveImageToAssets = async (
    base64Image: string,
    inspiration: CreativeInspiration,
    product: ShopifyProduct
  ) => {
    try {
      // Create a meaningful name for the asset
      const name = `${inspiration.name} - ${product.title}`;
      
      // Call the API to save the image to assets
      const response = await fetch('/api/app/studio/retouchr/save-generated-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          base64Image,
          inspirationId: inspiration.id,
          productId: product.id,
          width: parseInt(inspiration.width),
          height: parseInt(inspiration.height),
          name
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save image to assets');
      }
      
      const data = await response.json();
      setSavedAsset(data.asset);
      console.log('Image saved to assets:', data.asset.id);
    } catch (error) {
      console.error('Failed to save image to assets:', error);
      // Don't show an error to the user as this is a background operation
      // The image still works for design creation even if saving to assets fails
    }
  };

  return {
    isGenerating,
    streamingImage,
    finalImage,
    generationStatus,
    savedAsset,
    generateImage
  };
}
