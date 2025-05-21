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

  constructor(text: string, options: any = {}) {
    super(text, options);
    this.type = EnhancedText.type;
    this.padding = options.padding || 0;
    this.borderRadius = options.borderRadius || 0;
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
   * Override the _render method to add padding and border radius
   */
  _render(ctx: CanvasRenderingContext2D) {
    // If we have padding or border radius, draw the background with these features
    if ((this.padding > 0 || this.borderRadius > 0) && this.backgroundColor) {
      // Save the current context
      ctx.save();

      // Calculate the text width and height with padding
      const width = this.width + this.padding * 2;
      const height = this.height + this.padding * 2;
      const left = -this.width / 2 - this.padding;
      const top = -this.height / 2 - this.padding;

      // Draw the background with rounded corners if borderRadius is set
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

      // Restore the context before drawing the text
      ctx.restore();
    }

    // Call the original render method to draw the text
    super._render(ctx);
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
    // Only skip standard background rendering when we're handling it in _render 
    // (when both padding/borderRadius AND backgroundColor exist)
    if ((this.padding > 0 || this.borderRadius > 0) && this.backgroundColor) {
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
   * Forces a complete refresh of the object by applying a micro-scale
   * This helps ensure the object is properly re-rendered after property changes
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
    
    // Force cache regeneration
    if (typeof this.setCacheAsDirty === 'function') {
      this.setCacheAsDirty();
    }
    
    return this;
  }

  /**
   * Register class with fabric to enable JSON serialization/deserialization
   */
  static fromObject(options: any, callback: Function) {
    return callback && callback(new EnhancedText(options.text, options));
  }
}

// Register custom class with fabric
fabric.EnhancedText = EnhancedText;

// Set caching properties to ensure Fabric.js knows our class properties should be serialized
if (!fabric.Text.prototype._textDerivedPropertiesForSerialization) {
  // Initialize property if not already present
  fabric.Text.prototype._textDerivedPropertiesForSerialization = [];
}

// Add the custom properties to be serialized with our text objects
fabric.Text.prototype._textDerivedPropertiesForSerialization.push(
  'padding',
  'borderRadius'
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
    return callback(new EnhancedText(object.text, object));
  } catch (err) {
    console.error('Error creating EnhancedText:', err);
    // Fallback to regular text in case of errors
    return callback(new fabric.Text(object.text, object));
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
    return callback(new fabric.Text(object.text, object));
  }
};

// Add type definition to fabric namespace
declare global {
  namespace fabric {
    class EnhancedText extends fabric.IText {
      padding: number;
      borderRadius: number;
      constructor(text: string, options?: any);
    }
  }
}

// Export the enhanced text class
export type { fabric };
