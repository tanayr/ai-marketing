"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { InspirationGallery } from './components/InspirationGallery';
import { ProductSelector } from './components/ProductSelector';
import { CreativeInspiration } from '@/db/schema/creative-inspirations';
import { ShopifyProduct } from '@/db/schema/shopify-products';
import { toast } from 'sonner';

interface CreativeInspirationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateDesign: (imageUrl: string, size: { width: number, height: number }, name: string) => void;
  initialStep?: ModalStep;
  initialInspiration?: CreativeInspiration | null;
}

type ModalStep = 'inspiration' | 'product' | 'new-design';

/**
 * Modal component for the Creative Inspirations feature
 */
export const CreativeInspirationsModal: React.FC<CreativeInspirationsModalProps> = ({
  isOpen,
  onClose,
  onCreateDesign,
  initialStep = 'inspiration',
  initialInspiration = null
}) => {
  const [step, setStep] = useState<ModalStep>(initialStep);
  const [selectedInspiration, setSelectedInspiration] = useState<CreativeInspiration | null>(initialInspiration);
  
  const handleSelectInspiration = (inspiration: CreativeInspiration) => {
    setSelectedInspiration(inspiration);
    setStep('product');
  };
  
  const handleSelectProduct = async (product: ShopifyProduct) => {
    if (!selectedInspiration || !product.images || product.images.length === 0) {
      toast.error('Product must have at least one image');
      return;
    }
    
    try {
      // In the future, this will call the AI generation endpoint
      // For now, just use the inspiration image directly
      
      // Mock implementation - would be replaced with actual API call
      const generatedImageUrl = selectedInspiration.imageUrl;
      const designName = `${selectedInspiration.name} - ${product.title}`;
      
      // Create the design with the "generated" image
      onCreateDesign(
        generatedImageUrl, 
        {
          width: parseInt(selectedInspiration.width),
          height: parseInt(selectedInspiration.height)
        },
        designName
      );
      
      toast.success('Design created successfully!');
      handleClose();
    } catch (error) {
      console.error('Error creating design:', error);
      toast.error('Failed to create design');
    }
  };
  
  const handleBackToInspirations = () => {
    setStep('inspiration');
    setSelectedInspiration(null);
  };
  
  const handleClose = () => {
    onClose();
    // Reset state after closing
    setTimeout(() => {
      setStep('inspiration');
      setSelectedInspiration(null);
    }, 300);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {step === 'inspiration' ? (
          <>
            <DialogHeader>
              <DialogTitle>Creative Inspirations</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <InspirationGallery onSelect={handleSelectInspiration} />
            </div>
          </>
        ) : step === 'product' ? (
          <ProductSelector 
            onSelect={handleSelectProduct}
            onBack={handleBackToInspirations}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
};
