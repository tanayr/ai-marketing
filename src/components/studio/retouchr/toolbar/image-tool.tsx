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
        
        // Add image to canvas
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
      },
      {
        crossOrigin: 'anonymous'
      }
    );
  };
  
  return (
    <div className="space-y-4 p-4">
      <h3 className="font-medium text-sm">Image Tool</h3>
      
      <Tabs defaultValue="upload">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="url">From URL</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="pt-4">
          <FileUploader
            onFileUploaded={handleImageUploaded}
            acceptTypes="image/*"
            buttonText="Upload Image"
            maxSizeMB={5}
          />
        </TabsContent>
        
        <TabsContent value="url" className="pt-4">
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="image-url">Image URL</Label>
              <Input
                id="image-url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <Button
              onClick={handleAddImageFromUrl}
              disabled={!imageUrl}
              className="w-full"
            >
              Add Image
            </Button>
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
