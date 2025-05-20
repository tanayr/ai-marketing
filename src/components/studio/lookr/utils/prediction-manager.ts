import { PredictionStatusResponse, SavedPrediction, ProductSource } from '../types';

// Local storage keys
const PREDICTION_KEY_PREFIX = 'lookr_prediction_';
const PREDICTION_INDEX_KEY = 'lookr_prediction_index';

// Maximum number of predictions to store in local storage to prevent quota issues
const MAX_STORED_PREDICTIONS = 3; // Reduced from 5 to conserve space

// Size limit for a single prediction in bytes (approximately 10KB)
const MAX_PREDICTION_SIZE = 10 * 1024;

/**
 * Save prediction data to local storage with cleanup for quota management
 */
/**
 * Optimize prediction data to minimize storage usage
 */
const optimizePrediction = (prediction: SavedPrediction): SavedPrediction => {
  // Create a minimal version with only essential data
  return {
    id: prediction.id,
    status: prediction.status,
    createdAt: prediction.createdAt,
    productSource: {
      type: prediction.productSource.type,
      id: prediction.productSource.id,
      name: prediction.productSource.name,
      url: prediction.productSource.url,
      // Remove any unnecessary nested data
      ...(prediction.productSource.localStorageKey ? { localStorageKey: prediction.productSource.localStorageKey } : {})
    },
    avatarId: prediction.avatarId,
    // Only keep essential URLs
    ...(prediction.resultUrl ? { resultUrl: prediction.resultUrl } : {}),
    ...(prediction.assetId ? { assetId: prediction.assetId } : {}),
    ...(prediction.internalUrl ? { internalUrl: prediction.internalUrl } : {}),
    // Only keep first output URL if we have multiple (to save space)
    ...(prediction.outputUrls && prediction.outputUrls.length > 0 ? { 
      outputUrls: [prediction.outputUrls[0]] 
    } : { outputUrls: [] })
  };
};

export const savePredictionToLocalStorage = (prediction: SavedPrediction): void => {
  const key = `${PREDICTION_KEY_PREFIX}${prediction.id}`;
  
  // Optimize the prediction data to reduce size
  const optimizedPrediction = optimizePrediction(prediction);
  let predictionJson = JSON.stringify(optimizedPrediction);
  
  // Check if the data is too large
  if (predictionJson.length > MAX_PREDICTION_SIZE) {
    console.warn(`Prediction data exceeds maximum size (${predictionJson.length} bytes). Performing aggressive compression.`);
    
    // Further optimize by removing all but absolutely critical data
    const criticalPrediction = {
      id: prediction.id,
      status: prediction.status,
      createdAt: prediction.createdAt,
      productSource: {
        type: prediction.productSource.type,
        name: prediction.productSource.name,
      },
      avatarId: prediction.avatarId,
      resultUrl: prediction.resultUrl || (prediction.outputUrls && prediction.outputUrls[0]) || ''
    };
    
    const criticalJson = JSON.stringify(criticalPrediction);
    console.log(`Reduced prediction size from ${predictionJson.length} to ${criticalJson.length} bytes`);
    predictionJson = criticalJson;
  }
  
  try {
    // Try to save the prediction data
    localStorage.setItem(key, predictionJson);
    
    // Update the index
    const existingIndex = getPredictionIndex();
    if (!existingIndex.includes(prediction.id)) {
      // Add the new prediction ID to the index
      existingIndex.push(prediction.id);
      
      // Check if we need to clean up old predictions to prevent quota issues
      while (existingIndex.length > MAX_STORED_PREDICTIONS) {
        const oldestId = existingIndex.shift(); // Remove oldest prediction ID
        if (oldestId && oldestId !== prediction.id) {
          // Delete the old prediction from storage
          localStorage.removeItem(`${PREDICTION_KEY_PREFIX}${oldestId}`);
        }
      }
      
      // Save the updated index
      localStorage.setItem(PREDICTION_INDEX_KEY, JSON.stringify(existingIndex));
    }
  } catch (error) {
    console.error('Error saving prediction to local storage:', error);
    
    // If we hit a quota error, perform emergency cleanup
    if (error instanceof DOMException && (
      error.name === 'QuotaExceededError' || 
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
    )) {
      try {
        console.log('Attempting emergency cleanup of local storage');
        
        // More aggressive cleanup - remove ALL existing predictions except current
        const ids = getPredictionIndex();
        const currentId = prediction.id;
        
        // Remove all predictions except the current one
        ids.forEach(id => {
          if (id !== currentId) {
            localStorage.removeItem(`${PREDICTION_KEY_PREFIX}${id}`);
          }
        });
        
        // Update the index to only include the current prediction
        localStorage.setItem(PREDICTION_INDEX_KEY, JSON.stringify([currentId]));
        
        // Try again with a simplified version of the prediction to reduce size
        const minimalPrediction = {
          id: prediction.id,
          status: prediction.status,
          createdAt: prediction.createdAt,
          productSource: {
            type: prediction.productSource.type,
            id: prediction.productSource.id,
            name: prediction.productSource.name,
            url: prediction.productSource.url
          },
          avatarId: prediction.avatarId,
          // Only keep essential URLs
          resultUrl: prediction.resultUrl,
          outputUrls: prediction.outputUrls && prediction.outputUrls.length > 0 ? [prediction.outputUrls[0]] : []
        };
        
        // Try to save the minimal prediction
        localStorage.setItem(key, JSON.stringify(minimalPrediction));
        console.log('Emergency cleanup successful, saved minimal prediction data');
      } catch (cleanupError) {
        console.error('Failed to clean up storage after quota exceeded:', cleanupError);
        
        try {
          // Last resort - clear everything except the prediction index
          console.log('Attempting last-resort cleanup - clearing all predictions');
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(PREDICTION_KEY_PREFIX)) {
              localStorage.removeItem(key);
            }
          }
          
          // Reset the index to empty
          localStorage.setItem(PREDICTION_INDEX_KEY, JSON.stringify([]));
          console.log('All prediction data cleared');
        } catch (e) {
          console.error('Complete cleanup failed:', e);
        }
      }
    }
  }
};

/**
 * Update an existing prediction in local storage with new status data
 */
export const updatePredictionStatus = (
  predictionId: string, 
  statusData: Partial<PredictionStatusResponse>
): SavedPrediction | null => {
  const prediction = getPredictionFromLocalStorage(predictionId);
  
  if (!prediction) return null;
  
  // Process the output URLs from the status data
  let outputUrls = prediction.outputUrls;
  if (statusData.output && statusData.output.length > 0) {
    // Make sure we have valid URLs (non-empty strings)
    outputUrls = statusData.output.filter(url => url && typeof url === 'string' && url.trim() !== '');
    console.log(`Found ${outputUrls.length} valid output URLs for prediction ${predictionId}`);
  }

  // Update the prediction with new data
  const updatedPrediction: SavedPrediction = {
    ...prediction,
    status: statusData.status || prediction.status,
    // Make sure to use the first output URL when available
    resultUrl: outputUrls && outputUrls.length > 0 ? outputUrls[0] : prediction.resultUrl,
    // Store all output URLs
    outputUrls: outputUrls || prediction.outputUrls,
    // Handle asset ID and internal URL if they are provided
    ...(statusData.assetId && { assetId: statusData.assetId }),
    ...(statusData.internalUrl && { internalUrl: statusData.internalUrl })
  };
  
  console.log('Updated prediction:', { 
    id: predictionId, 
    status: updatedPrediction.status, 
    hasOutput: !!updatedPrediction.outputUrls?.length,
    resultUrl: updatedPrediction.resultUrl ? 'present' : 'missing',
    outputCount: updatedPrediction.outputUrls?.length || 0
  });
  
  // Save the updated prediction
  savePredictionToLocalStorage(updatedPrediction);
  
  return updatedPrediction;
};

/**
 * Get a single prediction from local storage
 */
export const getPredictionFromLocalStorage = (id: string): SavedPrediction | null => {
  const key = `${PREDICTION_KEY_PREFIX}${id}`;
  
  try {
    const predictionJson = localStorage.getItem(key);
    if (!predictionJson) return null;
    
    return JSON.parse(predictionJson) as SavedPrediction;
  } catch (error) {
    console.error('Error retrieving prediction from local storage:', error);
    return null;
  }
};

/**
 * Get all locally stored predictions
 */
export const getAllPredictions = (): SavedPrediction[] => {
  const predictionIds = getPredictionIndex();
  
  return predictionIds
    .map(id => getPredictionFromLocalStorage(id))
    .filter((pred): pred is SavedPrediction => pred !== null)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

/**
 * Get predictions for a specific avatar
 */
export const getPredictionsByAvatar = (avatarId: string): SavedPrediction[] => {
  return getAllPredictions().filter(pred => pred.avatarId === avatarId);
};

/**
 * Remove a prediction from local storage
 */
export const removePredictionFromLocalStorage = (id: string): void => {
  const key = `${PREDICTION_KEY_PREFIX}${id}`;
  
  try {
    // Remove the prediction
    localStorage.removeItem(key);
    
    // Update index
    const existingIndex = getPredictionIndex();
    const updatedIndex = existingIndex.filter(predId => predId !== id);
    localStorage.setItem(PREDICTION_INDEX_KEY, JSON.stringify(updatedIndex));
  } catch (error) {
    console.error('Error removing prediction from local storage:', error);
  }
};

/**
 * Get the index of all local predictions
 */
const getPredictionIndex = (): string[] => {
  try {
    const indexJson = localStorage.getItem(PREDICTION_INDEX_KEY);
    if (!indexJson) return [];
    
    return JSON.parse(indexJson) as string[];
  } catch (error) {
    console.error('Error retrieving prediction index from local storage:', error);
    return [];
  }
};

/**
 * Create a new prediction record
 */
export const createPrediction = (
  predictionId: string,
  productSource: ProductSource,
  avatarId: string
): SavedPrediction => {
  const prediction: SavedPrediction = {
    id: predictionId,
    productSource,
    avatarId,
    createdAt: new Date().toISOString(),
    status: 'starting',
    outputUrls: []
  };
  
  savePredictionToLocalStorage(prediction);
  return prediction;
};
