'use client';

import React, { useRef, useState } from 'react';
import { Image, X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ImageUploadProps {
  onImageUpload: (file: File, base64: string) => void;
  onRemove?: () => void;
  uploadedImage?: {
    file: File;
    preview: string;
  } | null;
  disabled?: boolean;
}

export function ImageUpload({ 
  onImageUpload, 
  onRemove, 
  uploadedImage, 
  disabled 
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, GIF, etc.)');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Image must be smaller than 10MB');
      return;
    }

    setIsProcessing(true);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        // Remove the data:image/type;base64, prefix for API
        const base64Data = base64.split(',')[1];
        onImageUpload(file, base64Data);
        setIsProcessing(false);
      };
      reader.onerror = () => {
        alert('Error reading file');
        setIsProcessing(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Error processing image');
      setIsProcessing(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (disabled || isProcessing) return;
    
    handleFiles(e.dataTransfer.files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const openFilePicker = () => {
    if (disabled || isProcessing) return;
    fileInputRef.current?.click();
  };

  // If image is uploaded, show preview
  if (uploadedImage) {
    return (
      <Card className="p-3 border-dashed">
        <div className="flex items-start gap-3">
          <div className="relative">
            <img 
              src={uploadedImage.preview} 
              alt="Reference" 
              className="w-20 h-20 object-cover rounded border"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {uploadedImage.file.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {(uploadedImage.file.size / 1024 / 1024).toFixed(1)}MB
            </p>
            <p className="text-xs text-green-600 mt-1">
              ✓ Ready for analysis
            </p>
          </div>
          {onRemove && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </Card>
    );
  }

  // Upload area
  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        className="hidden"
        disabled={disabled || isProcessing}
      />
      
      <Card
        className={`
          border-2 border-dashed transition-colors cursor-pointer
          ${dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
          ${disabled || isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary/50 hover:bg-primary/5'}
        `}
        onClick={openFilePicker}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="p-6 text-center">
          <div className="flex flex-col items-center gap-3">
            {isProcessing ? (
              <div className="animate-spin">
                <Upload className="h-8 w-8 text-muted-foreground" />
              </div>
            ) : (
              <Image className="h-8 w-8 text-muted-foreground" />
            )}
            <div>
              <p className="text-sm font-medium">
                {isProcessing ? 'Processing image...' : 'Upload reference image'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Drag & drop or click to select (PNG, JPG, max 10MB)
              </p>
            </div>
          </div>
        </div>
      </Card>
    </>
  );
}
