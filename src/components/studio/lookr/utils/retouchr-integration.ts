import { SavedPrediction } from '../types';
import { toast } from 'sonner';

/**
 * Utility to get dimensions of an image from its URL
 */
export const getImageDimensions = (imageUrl: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageUrl;
  });
};

/**
 * Create a new Retouchr design with the Lookr prediction image as background
 */
export const createRetouchrDesignFromPrediction = async (
  prediction: SavedPrediction
): Promise<string | null> => {
  try {
    // Get the image URL (internal URL first, then output URL, then result URL)
    const imageUrl = prediction.internalUrl || 
                    (prediction.outputUrls && prediction.outputUrls[0]) || 
                    prediction.resultUrl;
    
    if (!imageUrl) {
      throw new Error('No image URL available for this prediction');
    }
    
    // Create a meaningful name for the design
    const designName = `${prediction.productSource.name} on avatar (edited)`;
    
    // Get image dimensions
    const { width, height } = await getImageDimensions(imageUrl);
    
    // Step 1: Create a new design with the correct dimensions
    const createResponse = await fetch('/api/app/studio/retouchr', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: designName,
        width,
        height,
        backgroundColor: '#ffffff' // Start with white background
      })
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
    
    // Step 2: Update the design to add the image as a base layer
    // Parse the canvas JSON from the initial design
    const initialCanvas = design.content.fabricCanvas || {
      version: "5.3.0",
      objects: [],
      background: '#ffffff',
      width,
      height,
    };
    
    // Create updated canvas with image as a background object
    const updatedCanvas = {
      ...initialCanvas,
      objects: [
        {
          type: 'image',
          src: imageUrl,
          scaleX: 1,
          scaleY: 1,
          width,
          height,
          left: 0,
          top: 0,
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
    
    return designId;
  } catch (error) {
    console.error('Error creating Retouchr design:', error);
    toast.error(error instanceof Error ? error.message : 'Failed to create design in Retouchr');
    return null;
  }
};
