"use client";

import React, { useEffect, useState } from 'react';
import { useCanvas } from '../hooks/use-canvas';
import { fabric, FabricImage } from '../utils/fabric-imports';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  fileToDataUrl, 
  saveImageToLocalStorage, 
  getAllLocalImages, 
  removeImageFromLocalStorage 
} from '../utils/local-storage/image-storage';

// Local image type
interface LocalImageItem {
  id: string;
  dataUrl: string;
  name: string;
  timestamp: number;
}

export const RetouchrImageTool: React.FC = () => {
  const { canvas } = useCanvas();
  const [imageUrl, setImageUrl] = useState('');
  const [recentImages, setRecentImages] = useState<LocalImageItem[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Load recent images from local storage on component mount
  useEffect(() => {
    loadLocalImages();
  }, []);

  // Load local images
  const loadLocalImages = () => {
    const localImages = getAllLocalImages();
    setRecentImages(
      localImages.sort((a, b) => b.timestamp - a.timestamp).slice(0, 10)
    );
  };

  // Handle file selection for direct upload
  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    setUploadingFile(true);
    
    try {
      const file = files[0];
      const dataUrl = await fileToDataUrl(file);
      
      // Save to local storage
      const savedImage = saveImageToLocalStorage(dataUrl, file.name);
      
      // Add to canvas
      addImageToCanvas(dataUrl);
      
      // Refresh images list
      loadLocalImages();
      
      toast.success("Image added", {
        description: "Image has been added to your canvas"
      });
    } catch (error) {
      console.error("Error processing image:", error);
      toast.error("Failed to process image");
    } finally {
      setUploadingFile(false);
      // Reset the input
      event.target.value = '';
    }
  };

  // Add image from URL
  const handleAddImageFromUrl = () => {
    if (!canvas || !imageUrl) return;
    
    toast.loading("Processing image from URL...");
    
    // Create an image element to load and check the URL
    const tempImg = new Image();
    tempImg.crossOrigin = "anonymous";
    
    tempImg.onload = () => {
      try {
        // Convert to canvas to get data URL (to avoid CORS issues)
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = tempImg.width;
        tempCanvas.height = tempImg.height;
        const ctx = tempCanvas.getContext('2d');
        if (!ctx) {
          toast.error("Failed to process image");
          return;
        }
        
        ctx.drawImage(tempImg, 0, 0);
        const dataUrl = tempCanvas.toDataURL('image/png');
        
        // Save locally
        saveImageToLocalStorage(dataUrl, "URL Image");
        
        // Add to canvas
        addImageToCanvas(dataUrl);
        
        // Refresh local images
        loadLocalImages();
        
        toast.success("Image added from URL");
        setImageUrl('');
      } catch (error) {
        console.error("Error processing URL image:", error);
        toast.error("Failed to process image URL");
      }
    };
    
    tempImg.onerror = () => {
      toast.error("Failed to load image from URL", {
        description: "The URL may be invalid or the image isn't accessible"
      });
    };
    
    tempImg.src = imageUrl;
  };

  // Add image from local storage to canvas
  const handleAddLocalImage = (image: LocalImageItem) => {
    addImageToCanvas(image.dataUrl);
    toast.success(`Added ${image.name}`);
  };

  // Remove image from local storage
  const handleRemoveLocalImage = (image: LocalImageItem, event: React.MouseEvent) => {
    event.stopPropagation();
    removeImageFromLocalStorage(image.id);
    loadLocalImages();
    toast.success(`Removed ${image.name}`);
  };

  // Common function to add image to canvas using fabric.js
  const addImageToCanvas = (dataUrl: string) => {
    if (!canvas) return;
    
    // Use fabric to create image from data URL
    fabric.Image.fromURL(
      dataUrl, 
      (img: FabricImage) => {
        // Scale down large images if needed
        const canvasWidth = canvas.width ?? 800;
        const canvasHeight = canvas.height ?? 600;
        
        if (img.width && img.height) {
          if (img.width > canvasWidth * 0.8 || img.height > canvasHeight * 0.8) {
            const scale = Math.min(
              (canvasWidth * 0.8) / img.width,
              (canvasHeight * 0.8) / img.height
            );
            img.scale(scale);
          }
        }
        
        // Get current scale factor (after possible scaling above)
        const scaleFactor = img.getScaledWidth() / (img.width ?? 1);
        
        // Add to center of canvas
        img.set({
          left: (canvasWidth - (img.width ?? 0) * scaleFactor) / 2,
          top: (canvasHeight - (img.height ?? 0) * scaleFactor) / 2,
        });
        
        // Add to canvas
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
      },
      { crossOrigin: 'anonymous' }
    );
  };
  
  return (
    <div className="space-y-4 p-4">
      <h3 className="text-lg font-medium">Add Images</h3>
      
      <Tabs defaultValue="upload">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="url">From URL</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
        </TabsList>
        
        {/* Upload Tab */}
        <TabsContent value="upload" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="image-upload">Upload Image</Label>
            <Input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleFileSelected}
              disabled={uploadingFile}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Images are stored locally until you save your design.
          </p>
        </TabsContent>
        
        {/* URL Tab */}
        <TabsContent value="url" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="image-url">Image URL</Label>
            <div className="flex gap-2">
              <Input
                id="image-url"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
              <Button 
                onClick={handleAddImageFromUrl}
                disabled={!imageUrl}
              >
                Add
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Some images may not load due to CORS restrictions.
          </p>
        </TabsContent>
        
        {/* Recent Tab */}
        <TabsContent value="recent" className="mt-4">
          {recentImages.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {recentImages.map((image) => (
                <div 
                  key={image.id}
                  className="relative group cursor-pointer border rounded-md overflow-hidden"
                  onClick={() => handleAddLocalImage(image)}
                >
                  <img 
                    src={image.dataUrl} 
                    alt={image.name}
                    className="w-full h-24 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={(e) => handleRemoveLocalImage(image, e)}
                      className="absolute top-1 right-1"
                    >
                      ×
                    </Button>
                    <span className="text-white text-xs">Click to add</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-4 text-muted-foreground">
              No recent images found
            </p>
          )}
        </TabsContent>
      </Tabs>
      
      <Separator />
      
      <div>
        <h4 className="text-sm font-medium mb-2">Tips</h4>
        <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
          <li>Images are stored locally in your browser</li>
          <li>Images will be uploaded to the server when you save your design</li>
          <li>Use the Recent tab to quickly reuse images</li>
        </ul>
      </div>
    </div>
  );
};
