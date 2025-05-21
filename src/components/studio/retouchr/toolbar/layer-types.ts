"use client";

import { FabricObject } from '../utils/fabric-imports';

/**
 * Base interface for any item in the layers list
 */
export interface BaseLayerItem {
  id: string;
  name: string;
  type: string;
  visible: boolean;
}

/**
 * Interface for a layer item that represents a Fabric object
 */
export interface ObjectLayerItem extends BaseLayerItem {
  object: FabricObject;
  isGroup: false;
}

/**
 * Interface for a layer group that contains other layers or groups
 */
export interface LayerGroupItem extends BaseLayerItem {
  children: (ObjectLayerItem | LayerGroupItem)[];
  expanded: boolean;
  isGroup: true;
}

/**
 * Union type for any item in the layers panel
 */
export type LayerItem = ObjectLayerItem | LayerGroupItem;

/**
 * Get the display name for a layer based on its type and index
 */
export function getLayerName(obj: FabricObject, index: number): string {
  const objAny = obj as any; // For accessing non-standard properties
  
  if (obj.type === 'text') {
    // For text objects, get the actual text content
    let text;
    // Try different ways to access text content - Fabric sometimes has it in different places
    if (typeof objAny.text === 'string') {
      text = objAny.text;
    } else if (typeof objAny.get === 'function') {
      text = objAny.get('text') || '';
    } else if (objAny.text !== undefined) {
      text = objAny.text;
    } else {
      text = '';
    }
    
    const content = typeof text === 'string' ? text : '';
    // Return the text content or a placeholder if empty
    if (!content.trim()) {
      return 'Empty Text';
    }
    return content.length > 15 ? `${content.substring(0, 15)}...` : content;
  }
  
  if (obj.type === 'image') {
    // Check if we already have a custom name assigned
    if (objAny._customName && typeof objAny._customName === 'string') {
      return objAny._customName;
    }

    // Try to extract filename from image source
    let source = '';
    
    // Try different ways of accessing the image source
    if (objAny.src) {
      source = objAny.src;
    } else if (objAny._element && objAny._element.src) {
      source = objAny._element.src;
    } else if (objAny.getSrc && typeof objAny.getSrc === 'function') {
      try {
        source = objAny.getSrc();
      } catch (e) {
        // getSrc might throw in some cases
      }
    } else if (objAny.get && typeof objAny.get === 'function') {
      source = objAny.get('src') || '';
    } else if (objAny.srcFromAttribute) {
      source = objAny.srcFromAttribute;
    }
    
    if (source && typeof source === 'string') {
      // For data URLs, create a more user-friendly name
      if (source.startsWith('data:image')) {
        // For uploaded images, use a friendlier name
        return `Image ${index + 1} (uploaded)`;
      }

      try {
        // Try to parse as URL
        const url = new URL(source);
        const pathname = url.pathname;
        // Extract filename from path
        const filename = pathname.split('/').pop() || '';
        // If we have a filename with extension, use it
        if (filename && filename.includes('.')) {
          // Clean up the filename - remove extensions, decode URI components
          const cleanName = decodeURIComponent(filename)
            .replace(/\.[^/.]+$/, '') // Remove extension
            .replace(/-|_/g, ' ') // Replace dashes and underscores with spaces
            .replace(/\b\w/g, (l) => l.toUpperCase()); // Capitalize first letter of each word
          
          return cleanName || `Image ${index + 1}`;
        }
      } catch (e) {
        // URL parsing failed, might be a data URL or relative path
        // Try to extract from the last part of the URL string
        if (source.includes('/')) {
          const parts = source.split('/');
          const lastPart = parts[parts.length - 1];
          if (lastPart && lastPart.includes('.')) {
            // Clean up the filename
            const cleanName = lastPart
              .replace(/\.[^/.]+$/, '') // Remove extension
              .replace(/-|_/g, ' ') // Replace dashes and underscores with spaces
              .replace(/\b\w/g, (l) => l.toUpperCase()); // Capitalize first letter of each word
            
            return cleanName || `Image ${index + 1}`;
          }
        }
        
        // Try to extract from query string if it's there
        if (source.includes('?') && source.includes('=')) {
          const queryMatch = /[?&]name=([^&]+)/.exec(source);
          if (queryMatch && queryMatch[1]) {
            return decodeURIComponent(queryMatch[1]);
          }
          
          // Try to get the filename from the end of URL
          const fileMatch = /\/([^\/]+\.[a-z0-9]+)(\?|$)/i.exec(source);
          if (fileMatch && fileMatch[1]) {
            // Clean up the filename
            const cleanName = fileMatch[1]
              .replace(/\.[^/.]+$/, '') // Remove extension
              .replace(/-|_/g, ' ') // Replace dashes and underscores with spaces
              .replace(/\b\w/g, (l) => l.toUpperCase()); // Capitalize first letter of each word
            
            return cleanName || `Image ${index + 1}`;
          }
        }
      }
    }
    
    // If we couldn't extract a name, use a default one
    return `Image ${index + 1}`;
  }
  
  if (obj.type === 'rect') {
    return `Shape ${index + 1}`;
  }
  
  if (obj.type === 'circle') {
    return `Circle ${index + 1}`;
  }
  
  if (obj.type === 'path') {
    return `Path ${index + 1}`;
  }
  
  return `Layer ${index + 1}`;
}
