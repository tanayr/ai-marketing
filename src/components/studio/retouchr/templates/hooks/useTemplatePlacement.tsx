"use client";

import { useCallback } from 'react';
import { fabric } from '../../utils/fabric-imports';
import { EnhancedText } from '../../utils/enhanced-text';
import { useCanvas } from '../../hooks/use-canvas';
import { Template } from '@/db/schema/templates';
import { toast } from 'sonner';

/**
 * Hook for placing templates on the canvas
 */
export const useTemplatePlacement = () => {
  const { canvas } = useCanvas();

  // Place a template on the canvas
  const placeTemplateOnCanvas = useCallback(async (template: Template) => {
    if (!canvas) {
      toast.error('Canvas is not initialized');
      return false;
    }

    try {
      // Get current canvas dimensions
      const canvasWidth = canvas.width || 1080;
      const canvasHeight = canvas.height || 1080;
      
      // Get template dimensions
      const templateWidth = parseFloat(template.width);
      const templateHeight = parseFloat(template.height);
      
      // Calculate scaling factors for width and height
      const scaleX = canvasWidth / templateWidth;
      const scaleY = canvasHeight / templateHeight;
      
      // Use the smaller scale to ensure template fits within canvas
      const scale = Math.min(scaleX, scaleY);
      
      // Skip if there's no content
      if (!template.templateContent || !template.templateContent.objects) {
        toast.error('Template has no content');
        return false;
      }
      
      // Create objects from template content
      const templateObjects: fabric.Object[] = [];
      
      // Keep track of loaded objects for grouping
      let objectsToLoad = template.templateContent.objects.length;
      let loadedObjects = 0;
      
      // Create a promise to wait for all objects to load
      const objectsLoadedPromise = new Promise((resolve, reject) => {
        // If there are no objects, resolve immediately
        if (objectsToLoad === 0) {
          resolve(true);
          return;
        }
        
        // Process each object in the template
        template.templateContent.objects.forEach((objData: any) => {
          // Calculate actual position based on relative coordinates
          const left = objData.relativeX * canvasWidth;
          const top = objData.relativeY * canvasHeight;
          
          // Handle different object types
          if (objData.type === 'image') {
            // For images, we need to load them from URL
            fabric.Image.fromURL(objData.src, (img: fabric.Image) => {
              // Apply all properties from template
              delete objData.src; // Remove src to avoid overriding with toObject
              
              // Apply adjusted position and scale
              img.set({
                ...objData,
                left,
                top,
                scaleX: (objData.scaleX || 1) * scale,
                scaleY: (objData.scaleY || 1) * scale,
              });
              
              templateObjects.push(img as unknown as fabric.Object);
              loadedObjects++;
              
              // If all objects loaded, resolve the promise
              if (loadedObjects >= objectsToLoad) {
                resolve(true);
              }
            }, { crossOrigin: 'anonymous' });
          } else if (objData.type === 'enhanced-text') {
            // For enhanced text objects (with padding, border radius, etc.)
            const text = new EnhancedText(objData.text || 'Text', {
              ...objData,
              left,
              top,
              scaleX: (objData.scaleX || 1) * scale,
              scaleY: (objData.scaleY || 1) * scale,
            });
            
            templateObjects.push(text as unknown as fabric.Object);
            loadedObjects++;
          } else if (objData.type === 'text' || objData.type === 'i-text') {
            // For regular text objects
            const text = new fabric.Text(objData.text || 'Text', {
              ...objData,
              left,
              top,
              scaleX: (objData.scaleX || 1) * scale,
              scaleY: (objData.scaleY || 1) * scale,
            });
            
            templateObjects.push(text);
            loadedObjects++;
            
            if (loadedObjects >= objectsToLoad) {
              resolve(true);
            }
          } else if (objData.type === 'rect' || objData.type === 'circle' || objData.type === 'path') {
            // For basic shapes
            let shape;
            if (objData.type === 'rect') {
              shape = new fabric.Rect();
            } else if (objData.type === 'circle') {
              shape = new fabric.Circle();
            } else if (objData.type === 'path') {
              shape = new fabric.Path(objData.path);
            }
            
            if (shape) {
              shape.set({
                ...objData,
                left,
                top,
                scaleX: (objData.scaleX || 1) * scale,
                scaleY: (objData.scaleY || 1) * scale,
              });
              
              templateObjects.push(shape);
            }
            
            loadedObjects++;
            if (loadedObjects >= objectsToLoad) {
              resolve(true);
            }
          } else {
            // Skip unknown object types
            loadedObjects++;
            if (loadedObjects >= objectsToLoad) {
              resolve(true);
            }
          }
        });
        
        // Set a timeout to avoid hanging if some objects fail to load
        setTimeout(() => {
          if (loadedObjects < objectsToLoad) {
            console.warn(`Only ${loadedObjects} of ${objectsToLoad} template objects loaded`);
            resolve(true);
          }
        }, 5000);
      });
      
      // Wait for all objects to load
      await objectsLoadedPromise;
      
      // If we have objects to add
      if (templateObjects.length > 0) {
        // Create a name for the group based on template name
        const groupName = `Template: ${template.name}`;
        
        // Add all objects to canvas
        templateObjects.forEach(obj => {
          canvas.add(obj);
        });
        
        // Group the objects
        const group = new fabric.Group(templateObjects, {
          name: groupName,
        });
        
        // Ungroup to maintain the original objects but with the group structure
        const items = group._objects;
        group._restoreObjectsState();
        canvas.remove(group);
        
        // Add objects back to canvas
        for (let i = 0; i < items.length; i++) {
          canvas.add(items[i]);
        }
        
        // Create active selection from objects (visual grouping)
        if (items.length > 1) {
          const selection = new fabric.ActiveSelection(items, { canvas });
          canvas.setActiveObject(selection);
        } else if (items.length === 1) {
          canvas.setActiveObject(items[0]);
        }
        
        canvas.renderAll();
        toast.success(`Template "${template.name}" placed on canvas`);
        return true;
      } else {
        toast.error('No objects could be loaded from the template');
        return false;
      }
    } catch (error) {
      console.error('Error placing template on canvas:', error);
      toast.error('Failed to place template on canvas');
      return false;
    }
  }, [canvas]);

  return {
    placeTemplateOnCanvas,
  };
};
