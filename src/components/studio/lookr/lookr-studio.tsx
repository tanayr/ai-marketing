"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { ProductSelectionPanel } from './panels/product-selection-panel';
import { AvatarSelectionPanel } from './panels/avatar-selection-panel';
import { ResultsPanel } from './panels/results-panel';
import { useAvatars } from './hooks/use-avatars';
import { usePredictions } from './hooks/use-predictions';
import { ProductSource, Avatar, SavedPrediction, PredictionOptions } from './types';
import { toast } from 'sonner';
import { useAssets } from '@/lib/assets/useAssets';

interface LookrStudioProps {
  // Any props needed for the studio
}

export function LookrStudio({}: LookrStudioProps) {
  // State for selected product and avatar
  const [selectedProduct, setSelectedProduct] = useState<ProductSource | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<Avatar | null>(null);
  const [activePrediction, setActivePrediction] = useState<SavedPrediction | null>(null);
  
  // Fetch avatars using our custom hook
  const { avatars, isLoading: avatarsLoading } = useAvatars();
  
  // Use the predictions hook for managing try-on predictions
  const { 
    predictions, 
    isCreating,
    createPrediction,
    refreshPredictions,
    isPredictionActive 
  } = usePredictions();
  
  // Asset management
  const { createAsset } = useAssets();
  
  // Handle product selection
  const handleProductSelected = useCallback((product: ProductSource) => {
    setSelectedProduct(product);
  }, []);
  
  // Handle avatar selection
  const handleAvatarSelected = useCallback((avatar: Avatar) => {
    setSelectedAvatar(avatar);
  }, []);
  
  // Create a new prediction when both product and avatar are selected
  const handleCreatePrediction = useCallback(async () => {
    if (!selectedProduct || !selectedAvatar) {
      toast.error('Please select both a product and an avatar');
      return;
    }
    
    // Create a temporary prediction with 'starting' status immediately
    // This allows us to show the animation right away
    const tempId = `temp-${Date.now()}`;
    const tempPrediction: SavedPrediction = {
      id: tempId,
      status: 'starting', // This is properly typed as PredictionStatusResponse['status']
      createdAt: new Date().toISOString(),
      productSource: selectedProduct,
      avatarId: selectedAvatar.id,
      outputUrls: []
    };
    
    // Set the temporary prediction to trigger UI updates immediately
    setActivePrediction(tempPrediction);
    
    // Show toast immediately
    toast.success('Try-on process started');
    
    // Now create the actual prediction via API
    try {
      const newPrediction = await createPrediction(
        selectedProduct,
        selectedAvatar.id
      );
      
      if (newPrediction) {
        // Replace temporary prediction with the real one
        setActivePrediction(newPrediction);
      }
    } catch (error) {
      // If API call fails, make sure we show error state
      console.error('Prediction creation failed:', error);
      // Keep UI showing the temp prediction but update its status to failed
      setActivePrediction(prev => prev?.id === tempId ? {...prev, status: 'failed'} : prev);
    }
  }, [selectedProduct, selectedAvatar, createPrediction]);
  
  // Save the prediction result as an asset
  const handleSaveAsset = useCallback(async (name: string) => {
    if (!activePrediction?.resultUrl) {
      toast.error('No result to save');
      return;
    }
    
    // Create a new asset with the result image
    await createAsset({
      name,
      type: 'image',
      studioTool: 'lookr',
      status: 'ready',
      thumbnail: activePrediction.resultUrl,
      content: {
        // Required version property
        version: 1,
        // Store reference to the original product and avatar
        metadata: {
          productSource: activePrediction.productSource,
          avatarId: activePrediction.avatarId,
          predictionId: activePrediction.id
        }
      }
    });
  }, [activePrediction, createAsset]);
  
  // Update active prediction when predictions change
  useEffect(() => {
    if (activePrediction && predictions.length > 0) {
      const updated = predictions.find(p => p.id === activePrediction.id);
      if (updated) {
        console.log('Updating active prediction:', {
          id: updated.id,
          status: updated.status,
          hasOutput: !!updated.outputUrls?.length,
          resultUrl: updated.resultUrl,
          internalUrl: updated.internalUrl
        });
        
        // Only update if the prediction has actually changed (especially status or output URLs)
        if (activePrediction.status !== updated.status || 
            activePrediction.resultUrl !== updated.resultUrl || 
            !activePrediction.outputUrls?.length && updated.outputUrls?.length) {
          // Force this to run outside the current render cycle to avoid React update conflicts
          setTimeout(() => {
            setActivePrediction(updated);
          }, 0);
          
          // If the prediction is completed, show a notification
          if (updated.status === 'completed' && activePrediction.status !== 'completed') {
            toast.success('Try-on completed successfully!');
          }
        }
      }
    }
  }, [predictions, activePrediction]);
  
  return (
    <div className="h-[calc(100vh-4rem)] flex overflow-hidden bg-muted/5">
      {/* Column 1: Product Selection */}
      <div className="w-1/4 border-r flex-none bg-background">
        <ProductSelectionPanel
          onProductSelected={handleProductSelected}
          selectedProduct={selectedProduct}
        />
      </div>
      
      {/* Column 2: Avatar Selection */}
      <div className="w-1/3 border-r flex-none bg-background">
        <AvatarSelectionPanel
          avatars={avatars}
          isLoading={avatarsLoading}
          selectedAvatarId={selectedAvatar?.id || null}
          onAvatarSelected={handleAvatarSelected}
        />
      </div>
      
      {/* Column 3: Results Display */}
      <div className="flex-1 bg-background">
        <ResultsPanel
          prediction={activePrediction}
          isPolling={activePrediction ? isPredictionActive(activePrediction.id) : false}
          onSaveAsset={handleSaveAsset}
          onRetry={handleCreatePrediction}
        />
      </div>
      
      {/* Action button for creating prediction */}
      {selectedProduct && selectedAvatar && !activePrediction && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <button
            onClick={handleCreatePrediction}
            disabled={isCreating}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-shadow"
          >
            Generate Try-on
          </button>
        </div>
      )}
    </div>
  );
}
