"use client";

import React, { useEffect, useState } from 'react';
import { useCanvas } from '../hooks/use-canvas';
import { ColorPicker } from '../utils/color-picker';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { FileUploader } from '@/components/uploads/file-uploader';
import { fabric, FabricImage, FabricRect } from '../utils/fabric-imports';

export const BackgroundTool: React.FC = () => {
  const { canvas } = useCanvas();
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  
  // Initialize with current canvas background
  useEffect(() => {
    if (canvas) {
      const currentBg = canvas.backgroundColor as string;
      if (currentBg) {
        setBackgroundColor(currentBg);
      }
    }
  }, [canvas]);
  
  // Apply solid color background
  const applyBackgroundColor = (color: string) => {
    if (!canvas) return;
    
    // Remove any existing background image
    removeBackgroundImage();
    
    // Set background color
    canvas.setBackgroundColor(color, () => {
      canvas.renderAll();
    });
    
    setBackgroundColor(color);
  };
  
  // Apply background image
  const applyBackgroundImage = (imageUrl: string) => {
    if (!canvas) return;
    
    fabric.Image.fromURL(
      imageUrl,
      (img: FabricImage) => {
        const canvasWidth = canvas.width ?? 800;
        const canvasHeight = canvas.height ?? 600;
        
        // Scale to fill canvas
        img.scaleToWidth(canvasWidth);
        if (img.getScaledHeight() < canvasHeight) {
          img.scaleToHeight(canvasHeight);
        }
        
        // Center image
        const left = (canvasWidth - img.getScaledWidth()) / 2;
        const top = (canvasHeight - img.getScaledHeight()) / 2;
        
        // Set as background
        canvas.setBackgroundImage(img, () => {
          canvas.renderAll();
        }, {
          originX: 'left',
          originY: 'top',
          left,
          top
        });
      },
      { crossOrigin: 'anonymous' }
    );
  };
  
  // Remove background image
  const removeBackgroundImage = () => {
    if (!canvas) return;
    
    canvas.setBackgroundImage(null, () => {
      canvas.renderAll();
    });
  };
  
  return (
    <div className="space-y-4 p-4">
      <h3 className="font-medium text-sm">Background</h3>
      
      <Tabs defaultValue="color">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="color">Color</TabsTrigger>
          <TabsTrigger value="image">Image</TabsTrigger>
        </TabsList>
        
        <TabsContent value="color" className="pt-4">
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Background Color</Label>
              <ColorPicker
                color={backgroundColor}
                onChange={applyBackgroundColor}
              />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="image" className="pt-4">
          <div className="space-y-3">
            <FileUploader
              onFileUploaded={applyBackgroundImage}
              acceptTypes="image/*"
              buttonText="Upload Background Image"
              maxSizeMB={5}
            />
            
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-4"
              onClick={() => {
                removeBackgroundImage();
                canvas?.setBackgroundColor(backgroundColor, () => {
                  canvas.renderAll();
                });
              }}
            >
              Remove Background Image
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
