"use client";

import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, Wand2 } from 'lucide-react';
import { ShopifyProduct } from '@/db/schema/shopify-products';
import { CreativeInspiration } from '@/db/schema/creative-inspirations';

interface ConfirmationStepProps {
  product: ShopifyProduct;
  inspiration: CreativeInspiration;
  onBack: () => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

export function ConfirmationStep({
  product,
  inspiration,
  onBack,
  onGenerate,
  isGenerating
}: ConfirmationStepProps) {
  return (
    <div className="p-8 sm:p-10 md:w-2/3 overflow-hidden bg-muted/10 flex flex-col">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" className="p-0 h-8 w-8" onClick={onBack}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h3 className="font-semibold text-xl">Confirm Your Selection</h3>
          <p className="text-muted-foreground text-sm">Review and generate creative</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        {/* Product preview */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Selected Product</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="aspect-square relative bg-gray-100 mb-3">
              {product.images && product.images.length > 0 ? (
                <Image
                  src={product.images[0].src}
                  alt={product.title}
                  fill
                  className="object-contain"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No image
                </div>
              )}
            </div>
            <h3 className="font-medium">{product.title}</h3>
          </CardContent>
        </Card>
        
        {/* Inspiration preview */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Inspiration</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="aspect-square relative bg-gray-100 mb-3">
              <Image
                src={inspiration.imageUrl}
                alt={inspiration.name}
                fill
                className="object-contain"
              />
            </div>
            <h3 className="font-medium">{inspiration.name}</h3>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-6">
        <Button 
          className="w-full"
          size="lg"
          onClick={onGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
              Generating...
            </>
          ) : (
            <>
              <Wand2 className="mr-2 h-4 w-4" />
              Generate Creative
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
