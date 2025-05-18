"use client";

import { useState, useRef } from 'react';
import { useFileUpload } from '@/lib/uploads/useFileUpload';
import { FileUploadOptions } from '@/lib/uploads/types';
import { Button } from '@/components/ui/button';
import { Upload, X, Check, Loader2 } from 'lucide-react';

interface FileUploaderProps extends FileUploadOptions {
  onFileUploaded: (fileUrl: string) => void;
  acceptTypes: string;
  buttonText?: string;
  className?: string;
}

export function FileUploader({
  onFileUploaded,
  acceptTypes,
  buttonText = "Upload File",
  className,
  ...options
}: FileUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, isUploading, error } = useFileUpload();
  const [isDragging, setIsDragging] = useState(false);
  
  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      const result = await uploadFile(file, options);
      onFileUploaded(result.url);
    } catch (err) {
      // Error handling is done in useFileUpload
    } finally {
      // Reset the file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    
    try {
      const result = await uploadFile(file, options);
      onFileUploaded(result.url);
    } catch (err) {
      // Error handling is done in useFileUpload
    }
  };
  
  return (
    <div className={className}>
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center ${
          isDragging ? 'border-primary bg-primary/10' : 'border-gray-300'
        } ${error ? 'border-destructive' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isUploading ? (
          <div className="flex flex-col items-center justify-center py-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p>Uploading...</p>
          </div>
        ) : (
          <>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelected}
              className="hidden"
              accept={acceptTypes}
            />
            <div className="flex flex-col items-center justify-center py-4">
              <Upload className="h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 mb-2">
                Drag and drop your file here or
              </p>
              <Button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                variant="secondary"
              >
                {buttonText}
              </Button>
            </div>
          </>
        )}
        
        {error && (
          <div className="mt-2 text-sm text-destructive">
            {error.message}
          </div>
        )}
      </div>
    </div>
  );
}
