"use client";

import { toast } from 'sonner';
import { CreativeInspiration } from '@/db/schema/creative-inspirations';
import { ShopifyProduct } from '@/db/schema/shopify-products';

/**
 * Create a new design with the AI-generated image as the background
 * Uses the organization context from the API route for authentication
 * 
 * This uses a two-step process:
 * 1. Create a blank design with the proper dimensions
 * 2. Update the design to add the AI-generated image as a canvas object
 */
export async function createDesignWithAIImage({
  imageUrl,
  inspiration,
  product,
  router
}: {
  imageUrl: string;
  inspiration: CreativeInspiration;
  product: ShopifyProduct;
  router: any;
}): Promise<string | null> {
  try {
    // Generate a meaningful design name
    const designName = `${inspiration.name} + ${product.title} (AI Generated)`;
    
    // Use the dimensions from the inspiration
    const width = parseInt(inspiration.width);
    const height = parseInt(inspiration.height);
    
    console.log(`Creating design with AI image: ${designName} (${width}x${height})`);
    
    // STEP 1: Create a blank design with correct dimensions
    const createResponse = await fetch('/api/app/studio/retouchr', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: designName,
        width,
        height,
        backgroundColor: '#ffffff'
      }),
    });
    
    if (!createResponse.ok) {
      const errorData = await createResponse.json();
      throw new Error(errorData.error || 'Failed to create design');
    }
    
    const design = await createResponse.json();
    const designId = design.id;
    
    if (!designId) {
      throw new Error('No design ID returned from API');
    }
    
    // STEP 2: Update the design to add the image as a base layer
    // Parse the canvas JSON from the initial design
    const initialCanvas = design.content.fabricCanvas || {
      version: "5.3.0",
      objects: [],
      background: '#ffffff',
      width,
      height,
    };
    
    // Create updated canvas with image as a background object
    // We need to determine the proper positioning and scaling
    // Create an image element to get the actual dimensions of the generated image
    const getImageDimensions = (url: string): Promise<{width: number, height: number}> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          resolve({
            width: img.width,
            height: img.height
          });
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = url;
      });
    };
    
    // Try to get image dimensions, but use canvas dimensions as fallback
    let imageWidth = width;
    let imageHeight = height;
    let imageScaleX = 1;
    let imageScaleY = 1;

    // For base64 images, we'll have to rely on the dimensions we already know
    if (!imageUrl.startsWith('data:')) {
      try {
        const dimensions = await getImageDimensions(imageUrl);
        imageWidth = dimensions.width;
        imageHeight = dimensions.height;
        
        // Calculate scale to fit within canvas
        const scaleX = width / imageWidth;
        const scaleY = height / imageHeight;
        
        // Use the smaller scale to ensure the entire image fits
        const scale = Math.min(scaleX, scaleY);
        
        imageScaleX = scale;
        imageScaleY = scale;
      } catch (error) {
        console.warn('Failed to determine image dimensions, using defaults:', error);
      }
    }
    
    // Get canvas center point - this is the correct way to position centered objects
    const centerX = width / 2;
    const centerY = height / 2;
    
    const updatedCanvas = {
      ...initialCanvas,
      objects: [
        {
          type: 'image',
          src: imageUrl,
          scaleX: imageScaleX,
          scaleY: imageScaleY,
          width: imageWidth,
          height: imageHeight,
          left: centerX,
          top: centerY,
          originX: 'center',
          originY: 'center',
          lockMovementX: true,
          lockMovementY: true,
          selectable: false, // Make it not selectable initially
          evented: false,
          hasControls: false,
          hasBorders: false
        },
        ...initialCanvas.objects
      ]
    };
    
    // Save the updated design using the /save endpoint
    const updateResponse = await fetch(`/api/app/studio/retouchr/${designId}/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        canvasJSON: JSON.stringify(updatedCanvas),
        createVersion: false
      })
    });
    
    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      throw new Error(errorData.error || 'Failed to update design with image');
    }
    
    // Show success message
    toast.success('Design created successfully with AI-generated image');
    
    // Redirect to the new design
    router.push(`/app/studio/retouchr?id=${designId}`);
    return designId;
  } catch (error) {
    console.error('Error creating design with AI image:', error);
    toast.error('Failed to create design with AI image');
    return null;
  }
}
