"use client";

import { useCallback, useState } from 'react';
import { fabric } from '../../utils/fabric-imports';
import { useCanvas } from '../../hooks/use-canvas';
import { useTemplates } from './useTemplates';
import { CanvasObjectType } from '../../types';
import { toast } from 'sonner';

export interface TemplateMetadata {
  name: string;
  description?: string;
  width: string;
  height: string;
  isCommon?: boolean;
  category?: string;
  tags?: string[];
}

/**
 * Hook for creating templates from canvas content
 */
export const useTemplateCreator = () => {
  const { canvas, canvasData } = useCanvas();
  const { createTemplate } = useTemplates();
  const [isSaving, setIsSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Generate a thumbnail preview of the canvas
  const generatePreview = useCallback(() => {
    if (!canvas) return null;
    
    try {
      // Temporarily remove selection styling
      const activeObjects = canvas.getActiveObjects();
      canvas.discardActiveObject();
      canvas.renderAll();
      
      // Generate dataURL for thumbnail preview (client-side only)
      const dataUrl = canvas.toDataURL({
        format: 'png',
        quality: 0.8,
        multiplier: 0.5,
      });
      
      // Restore selection if needed
      if (activeObjects.length > 0) {
        if (activeObjects.length === 1) {
          canvas.setActiveObject(activeObjects[0]);
        } else {
          const activeSelection = new fabric.ActiveSelection(activeObjects, { canvas });
          canvas.setActiveObject(activeSelection);
        }
        canvas.renderAll();
      }
      
      setPreviewUrl(dataUrl); // Set preview for UI display only
      return dataUrl;
    } catch (error) {
      console.error('Error generating preview:', error);
      return null;
    }
  }, [canvas]);
  
  // Upload thumbnail to S3 (server-side)
  const uploadThumbnail = useCallback(async (dataUrl: string): Promise<string> => {
    if (!dataUrl) throw new Error('No thumbnail data available');
    
    try {
      // Convert data URL to blob for upload
      const response = await fetch('/api/app/studio/retouchr/templates/upload-thumbnail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          dataUrl,
          filename: `template-${Date.now()}.png`
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload thumbnail');
      }
      
      const { url } = await response.json();
      return url;
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      throw error;
    }
  }, []);

  // Filter objects to exclude background when creating template
  const getFilteredObjects = useCallback(() => {
    if (!canvas) return [];
    
    const allObjects = canvas.getObjects();
    
    // Filter out background objects
    return allObjects.filter(obj => {
      // Check object type or properties to determine if it's a background
      const objectType = obj.get('objectType');
      const isBackground = objectType === CanvasObjectType.Background;
      
      // We want to include everything that is NOT a background
      return !isBackground;
    });
  }, [canvas]);

  // Create a template from the current canvas
  const createTemplateFromCanvas = useCallback(async (metadata: TemplateMetadata) => {
    if (!canvas) {
      throw new Error('Canvas is not initialized');
    }
    
    try {
      setIsSaving(true);
      
      // Get canvas dimensions
      const width = canvas.width?.toString() || '1080';
      const height = canvas.height?.toString() || '1080';
      
      // Generate thumbnail if not already generated
      const previewDataUrl = previewUrl || generatePreview();
      
      if (!previewDataUrl) {
        throw new Error('Failed to generate template preview');
      }
      
      // Upload thumbnail to S3
      let thumbnailUrl;
      try {
        thumbnailUrl = await uploadThumbnail(previewDataUrl);
      } catch (error) {
        console.error('Failed to upload thumbnail, using data URL as fallback');
        // Use data URL as fallback, but warn user
        toast.warning('Using local thumbnail as S3 upload failed');
        thumbnailUrl = previewDataUrl;
      }
      
      // Get filtered objects (excluding background)
      const templateObjects = getFilteredObjects();
      
      if (templateObjects.length === 0) {
        throw new Error('No objects to include in template. Add some elements to the canvas first.');
      }
      
      // Create template content structure
      // We store each object's JSON + its relative position in the canvas
      const templateContent = {
        version: '1.0',
        objects: templateObjects.map(obj => {
          // Ensure we save the full object JSON including type and custom properties
          // Use obj.toObject() to get all properties instead of limited toJSON
          const objData = (obj as any).toObject([
            'id', 'objectType', 'name', 'type',
            // Include enhanced text specific properties
            'padding', 'borderRadius',
            // Include all standard text properties
            'fontFamily', 'fontSize', 'fontWeight', 'fontStyle',
            'textAlign', 'textBackgroundColor', 'charSpacing',
            'lineHeight', 'underline', 'overline', 'fill', 'stroke',
            'strokeWidth', 'backgroundColor'
          ]);
          
          // Calculate relative positions (0-1) for better scaling later
          const left = obj.left || 0;
          const top = obj.top || 0;
          
          return {
            ...objData,
            // Store relative positions (as percentage of canvas size)
            relativeX: parseFloat(width) > 0 ? left / parseFloat(width) : 0,
            relativeY: parseFloat(height) > 0 ? top / parseFloat(height) : 0,
            // Store original dimensions for reference
            originalCanvasWidth: width,
            originalCanvasHeight: height,
          };
        }),
      };
      
      // Create the template
      const newTemplate = await createTemplate({
        name: metadata.name,
        description: metadata.description || '',
        width, 
        height,
        templateContent,
        thumbnailUrl,
        isCommon: metadata.isCommon,
      });
      
      return newTemplate;
    } catch (error) {
      console.error('Error creating template from canvas:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [canvas, previewUrl, generatePreview, getFilteredObjects, createTemplate]);

  // Check if user is a super admin with access to create common templates
  const checkIsSuperAdmin = useCallback(async (): Promise<boolean> => {
    try {
      // Make request to the super-admin check endpoint
      const response = await fetch('/api/super-admin/check-access', {
        method: 'GET',
      });
      
      if (!response.ok) {
        // Server error, assume not admin
        console.error('Failed to check admin status:', response.status);
        return false;
      }
      
      // Parse the response to get the admin status
      const data = await response.json();
      return data.isAdmin === true;
    } catch (error) {
      console.error('Error checking super admin status:', error);
      return false;
    }
  }, []);

  return {
    createTemplateFromCanvas,
    generatePreview,
    previewUrl,
    isSaving,
    checkIsSuperAdmin,
  };
};
