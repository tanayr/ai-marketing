"use client";

import React from 'react';
import { useCanvas } from '../hooks/use-canvas';
import { FileUploader } from '@/components/uploads/file-uploader';
import { fabric, FabricImage } from '../utils/fabric-imports';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { toast } from 'sonner';

export const ImageTool: React.FC = () => {
  const { canvas } = useCanvas();
  const [imageUrl, setImageUrl] = useState('');

  // Add the uploaded image to canvas
  const handleImageUploaded = (fileUrl: string) => {
    if (!canvas) return;
    
    addImageToCanvas(fileUrl);
    
    // Show success toast
    toast.success("Image uploaded", {
      description: "Image has been added to the canvas"
    });
  };
  
  // Add image from URL
  const handleAddImageFromUrl = () => {
    if (!canvas || !imageUrl) return;
    
    addImageToCanvas(imageUrl);
    setImageUrl('');
  };
  
  // Common function to add image to canvas
  const addImageToCanvas = (url: string) => {
    if (!canvas) return;
    
    // Show loading indicator
    toast.loading("Loading image...", {
      description: "Please wait while the image is being loaded"
    });
    
    fabric.Image.fromURL(
      url, 
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
        
        // Center image on canvas
        const canvasCenter = canvas.getCenter();
        img.set({
          left: canvasCenter.left,
          top: canvasCenter.top,
          originX: 'center',
          originY: 'center',
        });
        
        // Add image to canvas - cast to any to avoid TypeScript errors
        canvas.add(img as any);
        canvas.setActiveObject(img as any);
        canvas.renderAll();
        
        // Dismiss loading toast
        toast.dismiss();
      },
      {
        crossOrigin: 'anonymous'
      }
    );
  };
  
  return (
    <div className="space-y-3 p-3">
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-2">
          <TabsTrigger value="upload" className="text-xs py-1">Upload</TabsTrigger>
          <TabsTrigger value="url" className="text-xs py-1">URL</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="space-y-3 pt-1">
          <div className="space-y-2">
            <FileUploader
              onFileUploaded={handleImageUploaded}
              acceptTypes="image/*"
              buttonText="Upload Image"
              maxSizeMB={5}
              className="h-24"
            />
          </div>
        </TabsContent>
        
        <TabsContent value="url" className="space-y-3 pt-1">
          <div className="space-y-1">
            <Label htmlFor="image-url" className="text-xs">Image URL</Label>
            <div className="flex space-x-1">
              <Input
                id="image-url"
                className="h-8 text-xs"
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
              <Button 
                onClick={handleAddImageFromUrl}
                disabled={!imageUrl}
                size="sm"
                className="h-8"
              >
                Add
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      <Separator />
      
      <div className="space-y-2">
        <h4 className="text-xs font-medium">Selected Image Options</h4>
        <Button 
          variant="outline" 
          size="sm"
          className="w-full"
          onClick={() => {
            if (!canvas) return;
            
            const activeObject = canvas.getActiveObject();
            if (activeObject && (activeObject.type === 'image')) {
              // Bring to front
              activeObject.bringToFront();
              canvas.renderAll();
            }
          }}
        >
          Bring to Front
        </Button>
        
        <Button 
          variant="outline" 
          size="sm"
          className="w-full"
          onClick={() => {
            if (!canvas) return;
            
            const activeObject = canvas.getActiveObject();
            if (activeObject && (activeObject.type === 'image')) {
              // Send to back
              activeObject.sendToBack();
              canvas.renderAll();
            }
          }}
        >
          Send to Back
        </Button>
        
        <Button 
          variant="destructive" 
          size="sm"
          className="w-full"
          onClick={() => {
            if (!canvas) return;
            
            const activeObject = canvas.getActiveObject();
            if (activeObject) {
              canvas.remove(activeObject);
              canvas.renderAll();
            }
          }}
        >
          Delete Selected
        </Button>
      </div>
    </div>
  );
};
