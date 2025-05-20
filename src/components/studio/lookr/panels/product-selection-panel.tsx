"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Image as ImageIcon, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAssets } from '@/lib/assets/useAssets';
import { fileToDataUrl, saveImageToLocalStorage, getAllLocalImages } from '../utils/image-storage';
import { ProductSource } from '../types';
import Image from 'next/image';

interface ProductSelectionPanelProps {
  onProductSelected: (product: ProductSource) => void;
  selectedProduct: ProductSource | null;
}

export function ProductSelectionPanel({ 
  onProductSelected, 
  selectedProduct 
}: ProductSelectionPanelProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'assets'>('upload');
  const [localImages, setLocalImages] = useState<Array<{id: string, dataUrl: string, name: string}>>([]);
  const [productName, setProductName] = useState('');
  
  // Fetch organization assets from API
  const { assets, isLoading } = useAssets({ type: 'image' });

  // Load local images on initial render
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const images = getAllLocalImages();
      setLocalImages(images);
    }
  }, []);

  // Handle file drops
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    try {
      const file = acceptedFiles[0];
      // Convert file to data URL
      const dataUrl = await fileToDataUrl(file);
      
      // Use file name as product name if not specified
      const name = productName || file.name.split('.')[0];
      
      // Save to local storage
      const savedImage = saveImageToLocalStorage(dataUrl, name);
      
      // Update local images state
      setLocalImages(prev => [savedImage, ...prev]);
      
      // Select this product
      onProductSelected({
        type: 'upload',
        name: savedImage.name,
        url: savedImage.dataUrl,
        localStorageKey: savedImage.id
      });
      
      // Reset product name field
      setProductName('');
      
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error('Failed to process image');
    }
  }, [onProductSelected, productName]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    maxFiles: 1,
    multiple: false
  });

  // Handle asset selection
  const handleAssetSelect = (asset: any) => {
    onProductSelected({
      type: 'asset',
      id: asset.id,
      name: asset.name,
      url: asset.thumbnail || ''
    });
  };

  // Handle local image selection
  const handleLocalImageSelect = (image: {id: string, dataUrl: string, name: string}) => {
    onProductSelected({
      type: 'upload',
      name: image.name,
      url: image.dataUrl,
      localStorageKey: image.id
    });
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-none p-4 border-b">
        <h2 className="text-lg font-semibold">Select Product</h2>
        <p className="text-sm text-muted-foreground">Choose a product image to try on</p>
      </div>
      
      <Tabs
        defaultValue="upload"
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as 'upload' | 'assets')}
        className="flex-1 flex flex-col overflow-hidden"
      >
        <div className="flex-none px-4 pt-2">
          <TabsList className="w-full">
            <TabsTrigger value="upload" className="flex-1">Upload</TabsTrigger>
            <TabsTrigger value="assets" className="flex-1">Your Assets</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="upload" className="flex-1 flex flex-col mt-0 overflow-hidden">
          <div className="p-4">
            <div className="space-y-2">
              <Label htmlFor="product-name">Product Name</Label>
              <Input
                id="product-name"
                placeholder="Enter product name"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
              />
            </div>
            
            <div 
              {...getRootProps()} 
              className={`mt-4 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/20'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium">
                {isDragActive ? 'Drop image here' : 'Drag & drop or click to upload'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Supports PNG, JPG, JPEG, WEBP up to 5MB
              </p>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <h3 className="text-sm font-medium">Recent Uploads</h3>
            
            {localImages.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent uploads</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {localImages.map((image) => (
                  <Card 
                    key={image.id}
                    className={`overflow-hidden cursor-pointer transition-all ${
                      selectedProduct?.localStorageKey === image.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => handleLocalImageSelect(image)}
                  >
                    <CardContent className="p-0 aspect-square relative">
                      <Image 
                        src={image.dataUrl} 
                        alt={image.name} 
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
                        priority={selectedProduct?.localStorageKey === image.id}
                        className="object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm p-2">
                        <p className="text-xs font-medium truncate">{image.name}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="assets" className="flex-1 overflow-y-auto mt-0 p-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading assets...</p>
          ) : assets.length === 0 ? (
            <div className="text-center py-8">
              <ImageIcon className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium">No assets found</p>
              <p className="text-xs text-muted-foreground mt-1">
                Upload images in the Assets section
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {assets.map((asset) => (
                <Card 
                  key={asset.id}
                  className={`overflow-hidden cursor-pointer transition-all ${
                    selectedProduct?.id === asset.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => handleAssetSelect(asset)}
                >
                  <CardContent className="p-0 aspect-square relative">
                    {asset.thumbnail ? (
                      <Image 
                        src={asset.thumbnail} 
                        alt={asset.name} 
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-muted">
                        <ImageIcon className="h-10 w-10 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm p-2">
                      <p className="text-xs font-medium truncate">{asset.name}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
