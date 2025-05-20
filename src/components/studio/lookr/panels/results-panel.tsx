"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Download, Save, RefreshCw, Loader2 } from 'lucide-react';
import { SavedPrediction } from '../types';
import { toast } from 'sonner';
import Image from 'next/image';
import { useAssets } from '@/lib/assets/useAssets';
import { EditInRetouchrButton } from '../components/edit-in-retouchr-button';

interface ResultsPanelProps {
  prediction: SavedPrediction | null;
  isPolling: boolean;
  onSaveAsset: (name: string) => Promise<void>;
  onRetry: () => void;
}

export function ResultsPanel({
  prediction,
  isPolling,
  onSaveAsset,
  onRetry
}: ResultsPanelProps) {
  // State to force refreshes when needed
  const [refreshCounter, setRefreshCounter] = useState(0);
  
  // Debug effect to monitor prediction changes and force UI updates when needed
  useEffect(() => {
    if (prediction) {
      console.log('Prediction state changed:', { 
        id: prediction.id, 
        status: prediction.status, 
        hasOutputUrls: !!prediction.outputUrls?.length,
        firstOutputUrl: prediction.outputUrls?.[0],
        resultUrl: prediction.resultUrl,
        internalUrl: prediction.internalUrl,
        assetId: prediction.assetId,
        isPolling
      });
      
      // If we have a completed prediction with output URLs but no UI update,
      // force a refresh by updating the refresh counter
      if (prediction.status === 'completed' && ((prediction.outputUrls && prediction.outputUrls.length > 0) || prediction.resultUrl)) {
        const timer = setTimeout(() => {
          setRefreshCounter(prev => prev + 1);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [prediction, isPolling, refreshCounter]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [assetName, setAssetName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Random loading messages for better UX
  const loadingMessages = [
    "Getting AI model ready...",
    "Scanning your selected avatar...",
    "Model is trying on your clothes...",
    "Analyzing style and fit...",
    "Adjusting for perfect alignment...",
    "Adding finishing touches...",
    "Almost ready for your reveal...",
    "Creating your virtual try-on...",
    "Perfecting the final look...",
    "Making fashion magic happen..."
  ];
  
  // State for the current loading message
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  
  // Cycle through loading messages during processing states
  useEffect(() => {
    if (prediction && ['starting', 'in_queue', 'processing'].includes(prediction.status)) {
      const interval = setInterval(() => {
        setCurrentMessageIndex(prev => (prev + 1) % loadingMessages.length);
      }, 3000); // Change message every 3 seconds
      
      return () => clearInterval(interval);
    }
  }, [prediction]);
  
  // Get loading progress estimate based on status
  const getProgressEstimate = (status: string): number => {
    switch (status) {
      case 'starting': return 10;
      case 'in_queue': return 25;
      case 'processing': return 60;
      case 'completed': return 100;
      case 'failed': return 0;
      default: return 0;
    }
  };
  
  // Get status message based on status
  const getStatusMessage = (status: string): string => {
    switch (status) {
      case 'starting': return 'Initializing try-on process...';
      case 'in_queue': return 'Waiting in queue...';
      case 'processing': return 'Processing your try-on request...';
      case 'completed': return 'Try-on completed successfully!';
      case 'failed': return 'Try-on process failed. Please try again.';
      default: return 'Select a product and avatar to start';
    }
  };
  
  // Handle save button click
  const handleSave = () => {
    if (!prediction?.resultUrl) return;
    
    // Set initial asset name based on product name
    setAssetName(`${prediction.productSource.name} try-on`);
    setSaveDialogOpen(true);
  };
  
  // Handle save confirmation
  const handleSaveConfirm = async () => {
    if (!assetName.trim()) {
      toast.error('Please enter a name for this asset');
      return;
    }
    
    try {
      setIsSaving(true);
      await onSaveAsset(assetName.trim());
      setSaveDialogOpen(false);
      toast.success('Asset saved successfully');
    } catch (error) {
      console.error('Error saving asset:', error);
      toast.error('Failed to save asset');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle download button click
  const handleDownload = () => {
    if (!prediction?.resultUrl) return;
    
    // Create a temporary anchor element to download the image
    const a = document.createElement('a');
    a.href = prediction.resultUrl;
    a.download = `${prediction.productSource.name}-tryon.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-none p-4 border-b">
        <h2 className="text-lg font-semibold">Try-on Results</h2>
        <p className="text-sm text-muted-foreground">
          {getStatusMessage(prediction?.status || '')}
        </p>
        
        {/* Progress bar for processing states */}
        {prediction && ['starting', 'in_queue', 'processing'].includes(prediction.status) && (
          <div className="w-full h-1.5 mt-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500 ease-in-out"
              style={{ width: `${getProgressEstimate(prediction.status)}%` }}
            />
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-hidden p-4 flex flex-col">
        {!prediction ? (
          // Initial empty state
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">No prediction selected</h3>
              <p className="text-muted-foreground text-sm">
                Select a product and avatar, then start a try-on to see results.
              </p>
            </div>
          </div>
        ) : prediction.status === 'completed' ? (
          // Success state with result
          <div className="flex-1 flex flex-col items-center justify-center gap-4 relative">
            <div className="relative w-full max-w-2xl aspect-[3/4] rounded-lg overflow-hidden shadow-lg">
              {/* Use internal URL (from assets) first, then outputUrls, then fallback to resultUrl */}
              {prediction.internalUrl || (prediction.outputUrls && prediction.outputUrls.length > 0) || prediction.resultUrl ? (
                <>
                  <Image 
                    src={prediction.internalUrl || (prediction.outputUrls && prediction.outputUrls[0]) || prediction.resultUrl || ''}
                    alt="Try-on Result" 
                    fill 
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 50vw"
                    className="object-contain"
                    priority
                  />
                  {/* Add EditInRetouchr button as a floating button on the image */}
                  <EditInRetouchrButton prediction={prediction} />
                </>
              ) : (
                <div className="flex items-center justify-center h-full w-full bg-muted">
                  <p>No result image available</p>
                </div>
              )}
              {prediction.assetId && (
                <div className="absolute bottom-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                  Saved to Assets
                </div>
              )}
            </div>
            
            <div className="flex gap-3 mt-4 justify-center">
              <Button 
                variant="outline" 
                className="relative overflow-hidden group hover:bg-primary/5 transition-colors duration-300"
                onClick={handleDownload}
              >
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 transform -translate-x-full group-hover:animate-[shimmer_2s_ease-in-out_infinite]"></span>
                <Download className="mr-2 h-4 w-4 group-hover:text-primary transition-colors duration-300" /> 
                Download
              </Button>
              
              <Button 
                className="relative overflow-hidden group bg-primary hover:bg-primary/90 transition-colors duration-300"
                onClick={handleSave}
              >
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-primary-foreground/0 via-primary-foreground/10 to-primary-foreground/0 transform -translate-x-full group-hover:animate-[shimmer_2s_ease-in-out_infinite]"></span>
                <Save className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform duration-300" /> 
                Save as Asset
              </Button>
            </div>
          </div>
        ) : prediction.status === 'failed' ? (
          // Error state with enhanced retry button
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md mx-auto">
              <div className="mb-6 p-4 bg-destructive/10 rounded-full inline-block">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-destructive mb-2">Try-on process failed</h3>
              <p className="text-muted-foreground mb-6">We couldn't process your request. Let's try a different approach.</p>
              
              <Button 
                onClick={onRetry} 
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 relative overflow-hidden group">
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-primary-foreground/0 via-primary-foreground/10 to-primary-foreground/0 transform -translate-x-full animate-shimmer group-hover:animate-[shimmer_1s_ease-in-out_infinite] duration-1000"></span>
                <RefreshCw className="mr-2 h-5 w-5 group-hover:animate-spin transition-all duration-300" /> 
                Try Again
              </Button>
            </div>
          </div>
        ) : prediction.status === 'starting' || prediction.status === 'in_queue' || prediction.status === 'processing' ? (
          // Loading/processing state with scanning animation
          <div className="flex-1 flex items-center justify-center">
            <Card className="w-full max-w-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative h-16 w-16 rounded-md overflow-hidden bg-muted flex-none">
                    <Image 
                      src={prediction.productSource.url} 
                      alt="Product" 
                      fill 
                      className="object-cover"
                    />
                    {/* Product scanning animation */}
                    <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent animate-pulse"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{prediction.productSource.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {isPolling ? (
                        <span className="flex items-center">
                          <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                          {/* Use the dynamic loading messages */}
                          {loadingMessages[currentMessageIndex]}
                        </span>
                      ) : (
                        'Preparing to process...'
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="w-full aspect-[3/4] rounded-md bg-muted relative overflow-hidden">
                  {/* Avatar skeleton with scanning animation */}
                  <Skeleton className="w-full h-full" />
                  
                  {/* Scanning overlay */}
                  <div className="absolute top-0 left-0 w-full h-2 bg-primary/30 animate-[scanDownward_3s_ease-in-out_infinite]"></div>
                  
                  {/* Circular pulse animation in the center */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full border-4 border-primary/40 animate-ping"></div>
                    <div className="absolute w-12 h-12 rounded-full border-4 border-primary/60 animate-pulse"></div>
                  </div>
                </div>
                
                <div className="mt-4 text-center">
                  <p className="text-sm font-medium text-primary/80 mb-1 animate-pulse">
                    {loadingMessages[currentMessageIndex]}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    This may take up to 30-40 seconds
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Default fallback state
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">Unknown state</h3>
              <p className="text-muted-foreground text-sm">
                Current status: {prediction.status}
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Save asset dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save as Asset</DialogTitle>
            <DialogDescription>
              Save this try-on result as an asset in your organization's library.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="asset-name">Asset Name</Label>
              <Input
                id="asset-name"
                value={assetName}
                onChange={(e) => setAssetName(e.target.value)}
                placeholder="Enter a name for this asset"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveConfirm} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
