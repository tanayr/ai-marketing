"use client";

import { fabric } from './fabric-imports';

/**
 * Enhanced Text class that extends the standard Fabric.js IText
 * with support for padding and border radius
 */
export class EnhancedText extends (fabric.IText as any) {
  padding: number;
  borderRadius: number;

  static type = 'enhanced-text';

  constructor(text: string | undefined, options: any = {}) {
    // Ensure text is never undefined to prevent split() errors
    const safeText = text || '';
    super(safeText, options);
    this.type = EnhancedText.type;
    this.padding = options.padding || 0;
    this.borderRadius = options.borderRadius || 0;
    
    // Preserve ID from options or create a new one if not provided
    if (options.id) {
      this.id = options.id;
    } else if (!this.id) {
      this.id = `text_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    }
  }
  
  /**
   * Override toObject to include our custom properties during serialization
   */
  toObject(propertiesToInclude = []) {
    // Get the object from the parent class
    const obj = super.toObject(propertiesToInclude);
    
    // Add our custom properties directly
    obj.type = EnhancedText.type;
    obj.padding = this.padding;
    obj.borderRadius = this.borderRadius;
    
    // Ensure ID is preserved during serialization
    if (this.id) {
      obj.id = this.id;
    }
    
    return obj;
  }
  
  /**
   * Override the set method to properly handle custom properties
   */
  set(key: string | Record<string, any>, value?: any): any {
    // If key is a string and value is provided, handle setting custom properties
    if (typeof key === 'string') {
      if (key === 'padding' || key === 'borderRadius') {
        const oldValue = this[key];
        this[key] = value;
        
        // Force recalculation of bounding box and dimensions
        this.dirty = true;
        
        // Set the object as stale to force a complete redraw
        this.setCoords();
        
        // Set cache as dirty to regenerate
        if (typeof this.setCacheAsDirty === 'function') {
          this.setCacheAsDirty();
        }
        
        return this;
      } else if (key === 'backgroundColor') {
        // Special handling for background color changes
        const result = super.set(key, value);
        this.dirty = true;
        
        // Set cache as dirty to regenerate
        if (typeof this.setCacheAsDirty === 'function') {
          this.setCacheAsDirty();
        }
        
        return result;
      }
    } 
    // For other properties or object notation, use the parent implementation
    return super.set(key, value);
  }

  /**
   * Override the _render method to handle padding and border radius
   */
  _render(ctx: CanvasRenderingContext2D) {
    // Check if we need custom rendering for padding or borderRadius
    if (this.padding > 0 || this.borderRadius > 0) {
      // Save the current context
      ctx.save();

      // Calculate the text width and height with padding
      const width = this.width + this.padding * 2;
      const height = this.height + this.padding * 2;
      const left = -this.width / 2 - this.padding;
      const top = -this.height / 2 - this.padding;

      // Draw the background first if backgroundColor is set
      if (this.backgroundColor && this.backgroundColor !== '' && this.backgroundColor !== 'transparent') {
        ctx.beginPath();
        if (this.borderRadius > 0) {
          // Draw rounded rectangle
          const radius = Math.min(this.borderRadius, Math.min(width, height) / 2);
          ctx.moveTo(left + radius, top);
          ctx.lineTo(left + width - radius, top);
          ctx.arcTo(left + width, top, left + width, top + radius, radius);
          ctx.lineTo(left + width, top + height - radius);
          ctx.arcTo(left + width, top + height, left + width - radius, top + height, radius);
          ctx.lineTo(left + radius, top + height);
          ctx.arcTo(left, top + height, left, top + height - radius, radius);
          ctx.lineTo(left, top + radius);
          ctx.arcTo(left, top, left + radius, top, radius);
          ctx.closePath();
        } else {
          // Draw rectangle without rounded corners
          ctx.rect(left, top, width, height);
        }

        // Fill the background
        ctx.fillStyle = this.backgroundColor;
        ctx.fill();
      }

      // Create clipping path for rounded corners if needed
      if (this.borderRadius > 0) {
        ctx.beginPath();
        const radius = Math.min(this.borderRadius, Math.min(width, height) / 2);
        ctx.moveTo(left + radius, top);
        ctx.lineTo(left + width - radius, top);
        ctx.arcTo(left + width, top, left + width, top + radius, radius);
        ctx.lineTo(left + width, top + height - radius);
        ctx.arcTo(left + width, top + height, left + width - radius, top + height, radius);
        ctx.lineTo(left + radius, top + height);
        ctx.arcTo(left, top + height, left, top + height - radius, radius);
        ctx.lineTo(left, top + radius);
        ctx.arcTo(left, top, left + radius, top, radius);
        ctx.closePath();
        
        // Set clipping region for text
        ctx.clip();
      }

      // Temporarily disable backgroundColor to prevent double rendering
      const originalBgColor = this.backgroundColor;
      this.backgroundColor = '';

      // Call individual rendering methods to avoid default background
      this._renderTextDecoration(ctx);
      this._renderText(ctx);

      // Restore backgroundColor
      this.backgroundColor = originalBgColor;

      // Restore the context
      ctx.restore();
    } else {
      // Use standard rendering when no padding or borderRadius
      super._render(ctx);
    }
  }

  /**
   * Override the _renderTextDecoration method to adjust for padding
   */
  _renderTextDecoration(ctx: CanvasRenderingContext2D) {
    // Move decorations if padding is applied
    if (this.padding > 0) {
      ctx.save();
      // No need to translate here as fabric already does this correctly
    }

    // Call the original decoration render method
    super._renderTextDecoration(ctx);

    if (this.padding > 0) {
      ctx.restore();
    }
  }

  /**
   * Override the _renderTextLinesBackground method to prevent double background
   * only when we're handling it ourselves in _render
   */
  _renderTextLinesBackground(ctx: CanvasRenderingContext2D) {
    // Skip standard background rendering when we have custom rendering (padding or borderRadius)
    if (this.padding > 0 || this.borderRadius > 0) {
      // Skip the background rendering as we've done it in _render
      return;
    }
    // Otherwise, use the standard background rendering
    super._renderTextLinesBackground(ctx);
  }

  /**
   * Get the object's bounding box for selection, considering padding
   */
  _calculateBoundingBox() {
    const bbox = super._calculateBoundingBox ? super._calculateBoundingBox() : null;
    if (!bbox) return null;

    // If the object has padding, adjust the bounding box
    if (this.padding > 0) {
      bbox.left -= this.padding;
      bbox.top -= this.padding;
      bbox.width += this.padding * 2;
      bbox.height += this.padding * 2;
    }
    return bbox;
  }
  
  /**
   * Refresh method to force re-render when properties change
   * Uses micro-scaling to ensure proper redraw
   */
  _refreshObject() {
    // Store current scale values
    const currentScaleX = this.scaleX || 1;
    const currentScaleY = this.scaleY || 1;
    
    // Apply a tiny scale change to force a redraw (invisible to the user)
    this.set('scaleX', currentScaleX * 1.00001);
    this.set('scaleY', currentScaleY * 1.00001);
    
    // Set dirty state to ensure redraw
    this.dirty = true;
    this.setCoords();
    
    // Force cache regeneration if available
    if (typeof this.setCacheAsDirty === 'function') {
      this.setCacheAsDirty();
    }
    
    if (this.canvas) {
      this.canvas.renderAll();
    }
    
    // Reset to original scale after a brief delay
    setTimeout(() => {
      this.set('scaleX', currentScaleX);
      this.set('scaleY', currentScaleY);
      if (this.canvas) {
        this.canvas.renderAll();
      }
    }, 1);
    
    return this;
  }

  /**
   * Register class with fabric to enable JSON serialization/deserialization
   */
  static fromObject(options: any, callback: Function) {
    // Ensure text is never undefined when deserializing
    return callback && callback(new EnhancedText(options.text || '', options));
  }
}

// Register custom class with fabric
fabric.EnhancedText = EnhancedText;

// Set caching properties to ensure Fabric.js knows our class properties should be serialized
fabric.util.object.extend(fabric.EnhancedText.prototype, {
  cacheProperties: fabric.IText.prototype.cacheProperties.concat([
    'padding', 
    'borderRadius',
    'id'
  ])
});

// Initialize the array if it doesn't exist
if (!fabric.Text.prototype._textDerivedPropertiesForSerialization) {
  fabric.Text.prototype._textDerivedPropertiesForSerialization = [];
}

// Add the custom properties to be serialized with our text objects
fabric.Text.prototype._textDerivedPropertiesForSerialization.push(
  'padding',
  'borderRadius',
  'id'
);

// Store the original fromObject function before overriding it
let originalTextFromObject: any;
if (fabric.IText && typeof fabric.IText.fromObject === 'function') {
  originalTextFromObject = fabric.IText.fromObject;
} else if (fabric.Text && typeof fabric.Text.fromObject === 'function') {
  originalTextFromObject = fabric.Text.fromObject;
}

// Define our custom fromObject function for creating EnhancedText objects
const enhancedTextFromObject = function(object: Record<string, any>, callback: Function) {
  try {
    console.log('Creating EnhancedText from object:', object);
    // Ensure text is never undefined
    const safeText = object.text || '';
    return callback(new EnhancedText(safeText, object));
  } catch (err) {
    console.error('Error creating EnhancedText:', err);
    // Fallback to regular text in case of errors
    // Also protect the fallback with safe text
    return callback(new fabric.Text(object.text || '', object));
  }
};

// Register our fromObject function with Fabric.js
fabric.EnhancedText.fromObject = enhancedTextFromObject;

// Override the Text.fromObject to handle our custom type
fabric.Text.fromObject = function(object: Record<string, any>, callback: Function) {
  // Check if this is our enhanced text type
  if (object.type === EnhancedText.type) {
    return enhancedTextFromObject(object, callback);
  } 
  
  // Otherwise, use the original handler or fallback to default
  if (originalTextFromObject) {
    return originalTextFromObject(object, callback);
  } else {
    // Ensure text is never undefined here either
    return callback(new fabric.Text(object.text || '', object));
  }
};

// Add type definition to fabric namespace
declare global {
  namespace fabric {
    class EnhancedText extends fabric.IText {
      padding: number;
      borderRadius: number;
      constructor(text: string | undefined, options?: any);
    }
  }
}

// Export the enhanced text class
export type { fabric };
