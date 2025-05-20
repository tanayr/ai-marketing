import { useState, useEffect, useCallback, useRef } from 'react';
import { PredictionOptions, PredictionResponse, PredictionStatusResponse, SavedPrediction, ProductSource } from '../types';
import { FashnAIClient } from '@/lib/external-api/fashn-ai-client';
import { createPrediction, updatePredictionStatus, getAllPredictions } from '../utils/prediction-manager';
import { toast } from 'sonner';
import useOrganization from '@/lib/organizations/useOrganization';
import { useAssets } from '@/lib/assets/useAssets';

interface UsePredictionsOptions {
  pollingInterval?: number;
  maxRetries?: number;
}

/**
 * Hook for creating and managing predictions
 */
export function usePredictions(options: UsePredictionsOptions = {}) {
  const { pollingInterval = 5000, maxRetries = 30 } = options;
  
  const [predictions, setPredictions] = useState<SavedPrediction[]>([]);
  const [pollingIntervals, setPollingIntervals] = useState<Record<string, NodeJS.Timeout>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [notifiedPredictions, setNotifiedPredictions] = useState<Record<string, string>>({});
  
  const { organization } = useOrganization();
  const organizationId = organization?.id;
  
  // Use assets hook for creating assets from prediction results
  const { createAsset } = useAssets();

  // Maximum polling time (5 minutes)
  const MAX_POLLING_TIME = 5 * 60 * 1000;

  // Status tracking to prevent unnecessary updates
  const lastKnownStatusRef = useRef<Record<string, string>>({});
  const startTimeRef = useRef<Record<string, number>>({});
  const retryCountRef = useRef<Record<string, number>>({});

  // Clean up all active polling intervals when component unmounts
  useEffect(() => {
    return () => {
      // Stop all active polling when component unmounts
      Object.values(pollingIntervals).forEach(interval => {
        clearInterval(interval);
      });
    };
  }, [pollingIntervals]);

  // Load predictions from localStorage on initial mount
  useEffect(() => {
    const loadPredictions = () => {
      const savedPredictions = getAllPredictions();
      setPredictions(savedPredictions);
    };
    
    loadPredictions();
  }, []);

  /**
   * Function to safely clear an interval and update active polling state
   */
  const clearPredictionPolling = useCallback((predictionId: string) => {
    if (pollingIntervals[predictionId]) {
      clearInterval(pollingIntervals[predictionId]);
      
      setPollingIntervals(prev => {
        const updated = { ...prev };
        delete updated[predictionId];
        return updated;
      });

      // Also clear the tracking refs
      delete lastKnownStatusRef.current[predictionId];
      delete startTimeRef.current[predictionId];
      delete retryCountRef.current[predictionId];

      console.log(`Stopped polling for prediction ${predictionId}`);
    }
  }, [pollingIntervals]);

  /**
   * Save a prediction result as an organization asset
   */
  const savePredictionAsAsset = useCallback(async (prediction: SavedPrediction) => {
    if (!prediction.outputUrls || prediction.outputUrls.length === 0) {
      console.log('No output URLs to save as asset');
      return null;
    }
    
    try {
      // Check if we already saved this as an asset
      if (prediction.assetId) {
        console.log(`Prediction ${prediction.id} already has asset ID ${prediction.assetId}`);
        return { id: prediction.assetId };
      }

      // Get the avatar info to include in asset metadata
      const response = await fetch(`/api/app/studio/lookr/avatars/${prediction.avatarId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch avatar details');
      }
      const avatar = await response.json();
      
      // Create asset from the prediction result
      const asset = await createAsset({
        name: `${prediction.productSource.name} on ${avatar.name}`,
        type: 'image',
        studioTool: 'lookr',
        status: 'ready',
        thumbnail: prediction.outputUrls[0],
        content: {
          version: 1,
          settings: {
            predictionId: prediction.id,
            avatarId: prediction.avatarId,
            avatarName: avatar.name,
            productName: prediction.productSource.name,
            productUrl: prediction.productSource.url,
            imageUrl: prediction.outputUrls[0],
            createdAt: prediction.createdAt
          }
        }
      });
      
      // Extract asset properties safely
      let assetId = '';
      let assetUrl = '';
      
      if (asset && typeof asset === 'object') {
        // Safe property access with type checking
        if ('id' in asset) assetId = String(asset.id);
        if ('thumbnail' in asset) assetUrl = String(asset.thumbnail);
        else if ('url' in asset) assetUrl = String(asset.url);
      }
      
      // Only update if we got a valid asset ID
      if (assetId) {
        const updatedPrediction = updatePredictionStatus(prediction.id, {
          status: prediction.status,
          assetId: assetId,
          internalUrl: assetUrl || prediction.outputUrls[0] || ''
        });
        
        if (updatedPrediction) {
          // Use setTimeout to avoid React rendering conflicts
          setTimeout(() => {
            setPredictions(prev => {
              return prev.map(p => p.id === prediction.id ? updatedPrediction : p);
            });
          }, 50);
        }
      }
      
      return asset;
    } catch (error) {
      console.error('Failed to save prediction as asset:', error);
      return null;
    }
  }, [createAsset]);

  /**
   * Poll for prediction status
   */
  const pollPredictionStatus = useCallback(async (predictionId: string) => {
    try {
      // Safety check - prevent polling if already completed or failed
      if (['completed', 'failed'].includes(lastKnownStatusRef.current[predictionId] || '')) {
        console.log(`Skipping poll for ${predictionId} - already in final state: ${lastKnownStatusRef.current[predictionId]}`);
        clearPredictionPolling(predictionId);
        return;
      }

      // Safety check - stop polling if it's been too long
      const elapsedTime = Date.now() - (startTimeRef.current[predictionId] || Date.now());
      if (elapsedTime > MAX_POLLING_TIME) {
        console.log(`Maximum polling time exceeded for ${predictionId}`);
        clearPredictionPolling(predictionId);

        // Update prediction status to failed if we timed out
        const timeoutPrediction = updatePredictionStatus(predictionId, {
          status: 'failed',
          error: 'Prediction timed out'
        });

        if (timeoutPrediction) {
          setTimeout(() => {
            setPredictions(prev => prev.map(p => p.id === predictionId ? timeoutPrediction : p));
            toast.error(`Prediction timed out after ${MAX_POLLING_TIME / 1000} seconds`);
          }, 50);
        }

        return;
      }
      
      const response = await fetch(`/api/app/studio/lookr/predictions/${predictionId}/status`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch prediction status');
      }
      
      const statusData: PredictionStatusResponse = await response.json();
      
      // Skip unnecessary processing if status hasn't changed
      if (lastKnownStatusRef.current[predictionId] === statusData.status) {
        // Only log status for in-progress items to reduce console spam
        if (!['completed', 'failed'].includes(statusData.status)) {
          console.log(`Polling status for ${predictionId} (no change): ${statusData.status}`);
        }
        return;
      }
      
      // Log status change
      console.log(`Status changed for ${predictionId}: ${lastKnownStatusRef.current[predictionId] || 'unknown'} -> ${statusData.status}`);
      lastKnownStatusRef.current[predictionId] = statusData.status;
      
      // Update the prediction in localStorage
      const updatedPrediction = updatePredictionStatus(predictionId, statusData);
      
      // Only update React state if we have a valid prediction
      if (updatedPrediction) {
        // Use setTimeout to avoid React update errors
        setTimeout(() => {
          setPredictions(prev => {
            // Skip update if nothing changed to prevent re-renders
            const existingPrediction = prev.find(p => p.id === predictionId);
            if (existingPrediction?.status === updatedPrediction.status && 
                existingPrediction?.resultUrl === updatedPrediction.resultUrl) {
              return prev;
            }
            return prev.map(p => p.id === predictionId ? updatedPrediction : p);
          });
        }, 50);
      }
      
      // Stop polling if prediction is complete or failed
      if (['completed', 'failed'].includes(statusData.status)) {
        clearPredictionPolling(predictionId);
        
        // Check if we've already shown a notification for this prediction status
        const notifyKey = `${predictionId}-${statusData.status}`;
        
        if (!notifiedPredictions[notifyKey]) {
          // Mark as notified to prevent duplicate notifications
          setNotifiedPredictions(prev => ({
            ...prev,
            [notifyKey]: new Date().toISOString()
          }));
          
          const statusMessage = statusData.status === 'completed' 
            ? 'Try-on completed successfully' 
            : statusData.status === 'failed' 
              ? `Try-on failed: ${statusData.error || 'Unknown error'}`
              : '';
              
          // Delay toast notifications to prevent React rendering conflicts
          if (statusMessage && typeof window !== 'undefined') {
            // Make sure we only run this code on the client, and outside the current render cycle
            setTimeout(() => {
              if (statusData.status === 'completed') {
                toast.success(statusMessage, {
                  id: `prediction-${predictionId}-completed` // Unique ID to prevent duplicates
                });
                
                // Save results as asset without additional toast but with delay
                if (updatedPrediction?.outputUrls?.length) {
                  setTimeout(() => {
                    savePredictionAsAsset(updatedPrediction).catch(err => {
                      console.error('Error saving asset:', err);
                    });
                  }, 500);
                }
              } else if (statusData.status === 'failed') {
                toast.error(statusMessage, {
                  id: `prediction-${predictionId}-failed` // Unique ID to prevent duplicates
                });
              }
            }, 100);
          }
        }
      }
    } catch (error) {
      console.error('Error polling prediction status:', error);
      
      // Increment retry count
      retryCountRef.current[predictionId] = (retryCountRef.current[predictionId] || 0) + 1;
      
      // Stop polling if we've reached the maximum number of retries
      if ((retryCountRef.current[predictionId] || 0) >= maxRetries) {
        clearPredictionPolling(predictionId);
        
        const errorKey = `${predictionId}-error`;
        if (!notifiedPredictions[errorKey]) {
          setNotifiedPredictions(prev => ({
            ...prev,
            [errorKey]: new Date().toISOString()
          }));
          
          // Update prediction status to failed
          const failedPrediction = updatePredictionStatus(predictionId, {
            status: 'failed',
            error: 'Failed to get prediction status after multiple attempts'
          });
          
          if (failedPrediction) {
            setTimeout(() => {
              setPredictions(prev => prev.map(p => p.id === predictionId ? failedPrediction : p));
              
              toast.error('Failed to get prediction status after multiple attempts', {
                id: `prediction-${predictionId}-failed-polling` // Unique ID to prevent duplicates
              });
            }, 50);
          }
        }
      }
    }
  }, [clearPredictionPolling, MAX_POLLING_TIME, maxRetries, notifiedPredictions, savePredictionAsAsset]);

  /**
   * Start polling for a prediction status
   */
  const startPolling = useCallback((predictionId: string) => {
    console.log(`Starting polling for prediction ${predictionId}`);
    
    // Clear any existing polling for this prediction
    clearPredictionPolling(predictionId);
    
    // Initialize tracking for this prediction
    startTimeRef.current[predictionId] = Date.now();
    retryCountRef.current[predictionId] = 0;
    lastKnownStatusRef.current[predictionId] = '';
    
    // Do an initial poll immediately
    pollPredictionStatus(predictionId);
    
    // Set up new polling interval
    const intervalId = setInterval(() => {
      // Skip polling if we already know it's completed/failed
      if (!['completed', 'failed'].includes(lastKnownStatusRef.current[predictionId] || '')) {
        pollPredictionStatus(predictionId);
      } else {
        // Safety cleanup if we somehow still have an interval for completed items
        clearPredictionPolling(predictionId);
      }
    }, pollingInterval);
    
    // Store the interval reference
    setPollingIntervals(prev => ({
      ...prev,
      [predictionId]: intervalId
    }));
  }, [clearPredictionPolling, pollPredictionStatus, pollingInterval]);

  /**
   * Create a new prediction
   */
  const createNewPrediction = useCallback(async (
    productSource: ProductSource,
    avatarId: string
  ): Promise<SavedPrediction | null> => {
    if (!organizationId) {
      toast.error('Organization not found');
      return null;
    }
    
    try {
      setIsCreating(true);
      
      // Create prediction via API
      const response = await fetch('/api/app/studio/lookr/predictions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          avatarId,
          productSource
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create prediction');
      }
      
      const data: PredictionResponse = await response.json();
      
      // Create local prediction record
      const newPrediction = createPrediction(data.id, productSource, avatarId);
      
      // Update state
      setPredictions(prev => [newPrediction, ...prev]);
      
      // Start polling for status updates
      startPolling(newPrediction.id);
      
      return newPrediction;
    } catch (error) {
      console.error('Error creating prediction:', error);
      
      // Use setTimeout to avoid React rendering conflicts with toast
      setTimeout(() => {
        toast.error(error instanceof Error ? error.message : 'Failed to create prediction', {
          id: 'prediction-creation-error' // Unique ID
        });
      }, 50);
      
      return null;
    } finally {
      setIsCreating(false);
    }
  }, [organizationId, startPolling]);

  /**
   * Refresh predictions from localStorage
   */
  const refreshPredictions = useCallback(() => {
    const savedPredictions = getAllPredictions();
    setPredictions(savedPredictions);
  }, []);

  /**
   * Check if a prediction is currently being polled
   */
  const isPredictionActive = useCallback((predictionId: string): boolean => {
    return Boolean(pollingIntervals[predictionId]);
  }, [pollingIntervals]);

  return {
    predictions,
    isCreating,
    createPrediction: createNewPrediction,
    refreshPredictions,
    isPredictionActive,
  };
}
