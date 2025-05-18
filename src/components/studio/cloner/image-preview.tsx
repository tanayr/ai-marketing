"use client";

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';

interface ImagePreviewProps {
  src: string;
  alt?: string;
  className?: string;
}

export function ImagePreview({ src, alt = "Image preview", className }: ImagePreviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

  // Handle image load
  useEffect(() => {
    if (!src) return;
    
    setIsLoading(true);
    setError(null);
    
    const img = new window.Image();
    img.src = src;
    
    img.onload = () => {
      setImageDimensions({ width: img.width, height: img.height });
      setIsLoading(false);
    };
    
    img.onerror = () => {
      setIsLoading(false);
      setError('Failed to load image');
    };
    
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  if (!src) {
    return (
      <div className={`bg-muted flex items-center justify-center rounded-lg ${className}`} style={{ minHeight: '200px' }}>
        <p className="text-muted-foreground">No image available</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`bg-muted flex items-center justify-center rounded-lg ${className}`} style={{ minHeight: '200px' }}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-muted flex items-center justify-center rounded-lg ${className}`} style={{ minHeight: '200px' }}>
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className={`relative rounded-lg overflow-hidden ${className}`}>
      <Image
        src={src}
        alt={alt}
        width={imageDimensions.width || 512}
        height={imageDimensions.height || 512}
        className="w-full h-auto rounded-lg"
        unoptimized={src.startsWith('data:')} // Don't optimize data URLs
      />
      <div className="absolute bottom-2 right-2 bg-background/80 px-2 py-1 text-xs rounded-md">
        {imageDimensions.width} × {imageDimensions.height}
      </div>
    </div>
  );
}
