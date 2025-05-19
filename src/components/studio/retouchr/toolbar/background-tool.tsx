"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { useCanvas } from '../hooks/use-canvas';
import { ColorPicker } from '../utils/color-picker';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { fabric } from '../utils/fabric-imports';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { X, Image as ImageIcon } from 'lucide-react';

// LocalStorage keys
const STORAGE_KEYS = {
  RECENT_BG_IMAGES: 'retouchr_recent_background_images',
  LAST_BG_COLOR: 'retouchr_last_background_color',
  CURRENT_BG_IMAGE_DATA: 'retouchr_current_bg_image_data' // Store actual image data for quick editing
};

// Type for recent background image
interface RecentBackgroundImage {
  id: string;        // Unique identifier (URL or generated ID)
  timestamp: number; // When it was last used
  localData: string; // Base64 data for fast loading
}

export const BackgroundTool: React.FC = () => {
  const { canvas, saveCanvas } = useCanvas();
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [imageUrl, setImageUrl] = useState('');
  const [recentImages, setRecentImages] = useState<RecentBackgroundImage[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  
  // Initialize with current canvas background and load recent images from localStorage
  useEffect(() => {
    // Get last used color from localStorage
    if (typeof window !== 'undefined') {
      const savedColor = localStorage.getItem(STORAGE_KEYS.LAST_BG_COLOR);
      if (savedColor) {
        setBackgroundColor(savedColor);
      }
      
      // Load recent background images from localStorage
      const savedImagesStr = localStorage.getItem(STORAGE_KEYS.RECENT_BG_IMAGES);
      if (savedImagesStr) {
        try {
          const savedImages = JSON.parse(savedImagesStr) as RecentBackgroundImage[];
          setRecentImages(savedImages);
        } catch (error) {
          console.error('Error loading recent background images:', error);
        }
      }
    }
  }, []);
  
  // Update background color from canvas when it changes
  useEffect(() => {
    if (canvas) {
      const currentBg = canvas.backgroundColor as string;
      if (currentBg) {
        setBackgroundColor(currentBg);
      }
    }
  }, [canvas]);
  
  // Save background color to localStorage
  const saveColorToLocalStorage = (color: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.LAST_BG_COLOR, color);
    }
  };
  
  // Convert file to base64 data URL
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };
  
  // Convert remote URL to base64 via canvas
  const urlToBase64 = async (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } else {
          reject(new Error('Could not get canvas context'));
        }
      };
      img.onerror = () => reject(new Error('Could not load image'));
      img.src = url;
    });
  };
  
  // Add to recent images in localStorage
  const addToRecentBackgroundImages = useCallback((id: string, localData: string) => {
    if (typeof window === 'undefined') return;
    
    // Create new item for recent images
    const newImage: RecentBackgroundImage = {
      id,
      timestamp: Date.now(),
      localData
    };
    
    // Update recent images (remove duplicates)
    const updatedImages = [
      newImage,
      ...recentImages.filter(img => img.id !== id)
    ].slice(0, 10); // Keep only 10 most recent
    
    // Update state and localStorage
    setRecentImages(updatedImages);
    localStorage.setItem(STORAGE_KEYS.RECENT_BG_IMAGES, JSON.stringify(updatedImages));
    
    // Always store current background image data for faster access
    localStorage.setItem(STORAGE_KEYS.CURRENT_BG_IMAGE_DATA, localData);
  }, [recentImages]);
  
  // Apply solid color background
  const applyBackgroundColor = (color: string) => {
    if (!canvas) return;
    
    // Remove any existing background image
    removeBackgroundImage();
    
    // Set background color
    canvas.setBackgroundColor(color, () => {
      canvas.renderAll();
    });
    
    // Save color to localStorage
    saveColorToLocalStorage(color);
    
    // Update state
    setBackgroundColor(color);
    toast.success("Background color applied");
  };
  
  // Apply background image using base64 data directly (no upload)
  const applyBackgroundImage = async (imageData: string) => {
    if (!canvas) return;
    
    try {
      setIsSaving(true);
      const toastId = toast.loading("Applying background image...");
      
      // Store image in localStorage for immediate use
      localStorage.setItem(STORAGE_KEYS.CURRENT_BG_IMAGE_DATA, imageData);
      
      // Generate unique ID
      const imageId = `local-${Date.now()}`;
      
      // Apply to canvas using fabric with added safety checks
      await new Promise<void>((resolve, reject) => {
        try {
          // Make sure imageData is valid
          if (!imageData || typeof imageData !== 'string') {
            reject(new Error('Invalid image data'));
            return;
          }

          // Start loading the image with proper error handling
          fabric.Image.fromURL(
            imageData,
            (img) => {
              try {
                // Check if we still have a valid canvas and image
                if (!img || !canvas) {
                  reject(new Error('Failed to load image or canvas no longer available'));
                  return;
                }
                
                // Make sure image has valid dimensions
                if (!(img.width && img.height)) {
                  reject(new Error('Image has invalid dimensions'));
                  return;
                }
                
                // Calculate scale to cover canvas
                const canvasWidth = canvas.width || 800;
                const canvasHeight = canvas.height || 600;
                
                const scaleX = canvasWidth / (img.width || 1);
                const scaleY = canvasHeight / (img.height || 1);
                const scale = Math.max(scaleX, scaleY);
                
                img.scale(scale);
                
                // Center the image
                img.set({
                  originX: 'center',
                  originY: 'center',
                  left: canvasWidth / 2,
                  top: canvasHeight / 2
                });
                
                // Use a try-catch block for the background image setting
                try {
                  canvas.setBackgroundImage(img, () => {
                    try {
                      canvas.renderAll();
                      resolve();
                    } catch (renderError) {
                      console.error('Error rendering canvas:', renderError);
                      reject(renderError);
                    }
                  });
                } catch (bgImageError) {
                  console.error('Error setting background image:', bgImageError);
                  reject(bgImageError);
                }
              } catch (imgError) {
                console.error('Error processing loaded image:', imgError);
                reject(imgError);
              }
            },
            { 
              crossOrigin: 'anonymous',
              // Add additional fabric options for better error handling
              objectCaching: true
            }
          );
        } catch (fabricError) {
          console.error('Error in fabric.Image.fromURL:', fabricError);
          reject(fabricError);
        }
      });
      
      // Add to recent images
      addToRecentBackgroundImages(imageId, imageData);
      
      toast.dismiss(toastId);
      toast.success("Background image applied");
    } catch (error) {
      console.error("Error applying background image:", error);
      toast.error("Failed to apply background image");
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle local file uploads - use file data directly without uploading
  const handleLocalFileUpload = async (file: File) => {
    if (!canvas) return;
    
    setIsSaving(true);
    const toastId = toast.loading("Processing image...");
    
    try {
      // Convert file to base64 immediately without uploading
      const base64Data = await fileToBase64(file);
      
      // Apply the background using local data
      await applyBackgroundImage(base64Data);
      
      // Dismiss loading toast - success toast is shown by applyBackgroundImage
      toast.dismiss(toastId);
    } catch (error) {
      console.error("Error processing image:", error);
      toast.dismiss(toastId);
      toast.error("Failed to process image");
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle adding image from URL
  const handleAddImageFromUrl = async () => {
    if (!imageUrl || !canvas) return;
    
    setIsSaving(true);
    const toastId = toast.loading("Fetching image...");
    
    try {
      // Convert URL to base64 first, don't directly use the URL
      const base64Data = await urlToBase64(imageUrl);
      
      // Apply the background using local data
      await applyBackgroundImage(base64Data);
      
      // Clear input field
      setImageUrl('');
      
      // Dismiss toast (success is shown by applyBackgroundImage)
      toast.dismiss(toastId);
    } catch (error) {
      console.error("Error fetching URL:", error);
      toast.dismiss(toastId);
      toast.error("Failed to load image from URL");
    } finally {
      setIsSaving(false);
    }
  };
  
  // Remove background image
  const removeBackgroundImage = () => {
    if (!canvas) return;
    
    canvas.setBackgroundImage(null, () => {
      canvas.renderAll();
    });
    
    // Remove from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_BG_IMAGE_DATA);
    }
    
    toast.success("Background image removed");
  };
  
  return (
    <div className="space-y-3 p-3">
      <Tabs defaultValue="color" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-2">
          <TabsTrigger value="color" className="text-xs py-1">Color</TabsTrigger>
          <TabsTrigger value="image" className="text-xs py-1">Image</TabsTrigger>
        </TabsList>
        
        <TabsContent value="color" className="space-y-3 pt-1">
          <ColorPicker
            color={backgroundColor}
            onChange={applyBackgroundColor}
          />
        </TabsContent>
        
        <TabsContent value="image" className="space-y-3 pt-1">
          {/* Upload from local device */}
          <div className="space-y-1 mb-2">
            <Label className="text-xs">Upload Image</Label>
            <div className="relative">
              <input
                type="file"
                id="bg-image-upload"
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleLocalFileUpload(file);
                    // Reset input to allow selecting the same file again
                    e.target.value = '';
                  }
                }}
              />
              <Button
                className="w-full h-8 text-xs"
                variant="outline"
                disabled={isSaving}
                onClick={() => document.getElementById('bg-image-upload')?.click()}
              >
                {isSaving ? (
                  <>
                    <span className="mr-1 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                    Processing...
                  </>
                ) : (
                  <>Choose Image</>
                )}
              </Button>
            </div>
          </div>
          
          {/* Add from URL */}
          <div className="space-y-1 mb-2">
            <Label className="text-xs">Add from URL</Label>
            <div className="flex space-x-1">
              <Input
                className="h-8 text-xs"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                disabled={isSaving}
              />
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2"
                disabled={!imageUrl || isSaving}
                onClick={handleAddImageFromUrl}
              >
                Add
              </Button>
            </div>
          </div>
          
          {/* Remove current background image */}
          <Button
            variant="destructive"
            size="sm"
            className="w-full h-7 text-xs mb-2"
            onClick={removeBackgroundImage}
          >
            Remove Background
          </Button>
          
          {/* Recent background images */}
          {recentImages.length > 0 && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Recent Backgrounds</Label>
              <div className="grid grid-cols-4 gap-1">
                {recentImages.map((img) => (
                  <div
                    key={`bg-img-${img.id}-${img.timestamp}`}
                    className="relative aspect-square cursor-pointer overflow-hidden rounded-sm border border-muted hover:border-primary"
                    onClick={() => applyBackgroundImage(img.localData)}
                    title="Apply background"
                  >
                    <img
                      src={img.localData}
                      alt="Recent background"
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 transition-all duration-150 hover:bg-opacity-10">
                      <div className="opacity-0 transition-opacity duration-150 hover:opacity-100 bg-black/40 rounded-full p-1">
                        <ImageIcon size={12} className="text-white" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
