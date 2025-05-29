"use client";

import { fabric } from './fabric-imports';

// Text effect interfaces
export interface TextShadow {
  offsetX: number;
  offsetY: number;
  blur: number;
  color: string;
}

export interface TextOutline {
  width: number;
  color: string;
}

export interface TextGradient {
  type: 'linear' | 'radial';
  colors: string[];
  angle?: number; // for linear gradients
}

// Export text effect presets
export const TextEffects = {
  // Preset shadows
  shadows: {
    soft: { offsetX: 2, offsetY: 2, blur: 4, color: 'rgba(0,0,0,0.3)' },
    hard: { offsetX: 3, offsetY: 3, blur: 0, color: 'rgba(0,0,0,0.8)' },
    glow: { offsetX: 0, offsetY: 0, blur: 10, color: 'rgba(255,255,255,0.8)' },
    neon: { offsetX: 0, offsetY: 0, blur: 15, color: 'rgba(0,255,255,0.9)' }
  },

  // Preset gradients
  gradients: {
    sunset: { type: 'linear' as const, colors: ['#ff6b6b', '#feca57', '#ff9ff3'], angle: 45 },
    ocean: { type: 'linear' as const, colors: ['#667eea', '#764ba2'], angle: 90 },
    fire: { type: 'linear' as const, colors: ['#ff9a9e', '#fecfef', '#fecfef'], angle: 135 },
    gold: { type: 'linear' as const, colors: ['#ffd700', '#ffed4e', '#fff200'], angle: 0 },
    chrome: { type: 'linear' as const, colors: ['#bdc3c7', '#2c3e50'], angle: 90 }
  },

  // Preset outlines
  outlines: {
    thin: { width: 1, color: '#000000' },
    medium: { width: 2, color: '#000000' },
    thick: { width: 4, color: '#000000' },
    white: { width: 2, color: '#ffffff' },
    colorful: { width: 3, color: '#ff6b6b' }
  }
};

/**
 * Extend fabric.IText with all advanced text features
 * This function adds padding, border radius, shadows, outlines, gradients, etc.
 * to the base fabric.IText class, eliminating the need for separate text classes.
 */
export function extendFabricIText() {
  // Store original methods to call later
  const originalRender = fabric.IText.prototype._render;
  const originalToObject = fabric.IText.prototype.toObject;
  const originalFromObject = fabric.IText.fromObject;
  const originalTextLinesBackground = fabric.IText.prototype._renderTextLinesBackground;
  const originalTextDecoration = fabric.IText.prototype._renderTextDecoration;
  const originalRenderText = fabric.IText.prototype._renderText;

  // Add new properties directly to IText prototype
  fabric.IText.prototype.padding = 0;
  fabric.IText.prototype.borderRadius = 0;
  fabric.IText.prototype.textShadow = undefined;
  fabric.IText.prototype.textOutline = undefined;
  fabric.IText.prototype.textGradient = undefined;
  fabric.IText.prototype.letterSpacing = 0;
  fabric.IText.prototype.textTransform = 'none';

  // Add refreshObject method for easier updates
  fabric.IText.prototype.refreshObject = function() {
    this.dirty = true;
    this.setCoords();
    
    if (typeof this.setCacheAsDirty === 'function') {
      this.setCacheAsDirty();
    }
    
    // Force the text cache to be cleared
    if (typeof this._clearCache === 'function') {
      this._clearCache();
    }
    
    // Apply a micro-scale to force a redraw
    const currentScaleX = this.scaleX || 1;
    const currentScaleY = this.scaleY || 1;
    this.set('scaleX', currentScaleX * 1.00001);
    this.set('scaleY', currentScaleY * 1.00001);
    
    // Ensure the canvas renders all changes
    if (this.canvas) {
      this.canvas.renderAll();
    }
    
    // Reset scale after a brief delay to ensure rendering completes
    setTimeout(() => {
      this.set('scaleX', currentScaleX);
      this.set('scaleY', currentScaleY);
      
      // Clear cache and force re-render
      if (typeof this._clearCache === 'function') {
        this._clearCache();
      }
      
      if (this.canvas) {
        this.canvas.renderAll();
      }
    }, 50); // Increased timeout for better effect application
    
    return this;
  };

  // Text transform helper
  fabric.IText.prototype.getTransformedText = function() {
    let text = this.text;
    
    switch (this.textTransform) {
      case 'uppercase':
        return text.toUpperCase();
      case 'lowercase':
        return text.toLowerCase();
      case 'capitalize':
        return text.replace(/\b\w/g, (l: string) => l.toUpperCase());
      default:
        return text;
    }
  };

  // Gradient creation helper with improved angle handling and color stop distribution
  fabric.IText.prototype.createGradient = function(ctx: CanvasRenderingContext2D | null): CanvasGradient | null {
    if (!this.textGradient || !ctx) return null;
    if (!this.textGradient.colors || this.textGradient.colors.length < 2) return null;
    
    let gradient;
    
    if (this.textGradient.type === 'linear') {
      // Ensure angle is a number and convert to radians
      const angle = Number(this.textGradient.angle || 0) * Math.PI / 180;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      
      // Calculate width and height, accounting for scale
      const width = this.width || 100;
      const height = this.height || 30;
      
      // Create the gradient with precise positioning
      gradient = ctx.createLinearGradient(
        -width / 2 * cos, -height / 2 * sin,
        width / 2 * cos, height / 2 * sin
      );
    } else {
      // For radial gradients, center in the object and extend to edges
      const maxDimension = Math.max(this.width || 100, this.height || 30);
      gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, maxDimension / 2);
    }

    // Add color stops with proper distribution
    const colors = this.textGradient.colors;
    
    // If only two colors, create a simple gradient
    if (colors.length === 2) {
      gradient.addColorStop(0, colors[0]);
      gradient.addColorStop(1, colors[1]);
    } else {
      // For more colors, distribute evenly
      colors.forEach((color: string, index: number) => {
        const stop = index / (colors.length - 1);
        gradient.addColorStop(stop, color);
      });
    }

    return gradient;
  };

  // Override _render method with combined functionality
  fabric.IText.prototype._render = function(ctx: CanvasRenderingContext2D) {
    const hasEnhancements = 
      this.padding > 0 || 
      this.borderRadius > 0 || 
      this.textShadow || 
      this.textOutline || 
      this.textGradient ||
      this.letterSpacing !== 0 ||
      this.textTransform !== 'none';
    
    if (!hasEnhancements) {
      // Use original rendering for standard text
      originalRender.call(this, ctx);
      return;
    }

    // Start with a clean state
    ctx.save();

    // STEP 1: Render background with padding and border radius if needed
    if (this.padding > 0 || this.borderRadius > 0) {
      // Calculate the text width and height with padding
      const width = this.width + this.padding * 2;
      const height = this.height + this.padding * 2;
      const left = -this.width / 2 - this.padding;
      const top = -this.height / 2 - this.padding;

      // Draw the background if set
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
    }

    // STEP 2: Apply letter spacing if needed
    if (this.letterSpacing !== 0) {
      ctx.letterSpacing = `${this.letterSpacing}px`;
    }

    // STEP 3: Handle advanced text effects
    // Store original properties to restore later
    const originalFill = this.fill;
    const originalStroke = this.stroke;
    const originalStrokeWidth = this.strokeWidth;
    const originalText = this.text;

    // Apply text transform if needed
    if (this.textTransform !== 'none') {
      this.text = this.getTransformedText();
    }
    
    // Apply gradient if set - MUST happen AFTER saving original fill
    if (this.textGradient && this.textGradient.colors?.length >= 2) {
      const gradient = this.createGradient(ctx);
      if (gradient) {
        this.fill = gradient;
      }
    }

    // STEP 4: Handle shadow and outline effects with improved rendering
    if (this.textOutline && this.textOutline.width > 0) {
      // First pass: Render outline with shadow (if set)
      this.stroke = this.textOutline.color;
      this.strokeWidth = this.textOutline.width;
      
      // Apply shadow to the outline if needed
      if (this.textShadow) {
        ctx.shadowOffsetX = this.textShadow.offsetX;
        ctx.shadowOffsetY = this.textShadow.offsetY;
        ctx.shadowBlur = this.textShadow.blur;
        ctx.shadowColor = this.textShadow.color;
      }

      // Set fill to transparent for outline-only first pass
      const tempFill = this.fill;
      this.fill = '';
      
      // Render the outline
      originalRender.call(this, ctx);
      
      // Reset shadow for the fill pass
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
      
      // Second pass: Render fill (restore fill color, disable stroke)
      this.fill = tempFill;
      this.stroke = '';
      this.strokeWidth = 0;
      
      // Render the fill
      originalRender.call(this, ctx);
      
      // Restore original stroke settings
      this.stroke = originalStroke;
      this.strokeWidth = originalStrokeWidth;
    } else {
      // No outline, just render with shadow if needed
      if (this.textShadow) {
        ctx.shadowOffsetX = this.textShadow.offsetX;
        ctx.shadowOffsetY = this.textShadow.offsetY;
        ctx.shadowBlur = this.textShadow.blur;
        ctx.shadowColor = this.textShadow.color;
      }
      
      // Single pass render for non-outline text
      originalRender.call(this, ctx);
    }

    // Restore original properties
    this.fill = originalFill;
    this.text = originalText;
    
    ctx.restore();
  };

  // Override _renderTextLinesBackground to prevent double background
  fabric.IText.prototype._renderTextLinesBackground = function(ctx: CanvasRenderingContext2D) {
    if (this.padding > 0 || this.borderRadius > 0) {
      // Skip standard background rendering as we've done it in _render
      return;
    }
    // Otherwise, use the standard background rendering
    originalTextLinesBackground.call(this, ctx);
  };

  // Override toObject for serialization
  fabric.IText.prototype.toObject = function(propertiesToInclude = []) {
    const obj = originalToObject.call(this, propertiesToInclude);
    
    // Add our custom properties
    obj.padding = this.padding;
    obj.borderRadius = this.borderRadius;
    obj.textShadow = this.textShadow;
    obj.textOutline = this.textOutline;
    obj.textGradient = this.textGradient;
    obj.letterSpacing = this.letterSpacing;
    obj.textTransform = this.textTransform;
    
    return obj;
  };

  // Override fromObject for deserialization
  fabric.IText.fromObject = function(object: Record<string, any>, callback: Function) {
    return originalFromObject(object, function(instance: any) {
      // Apply enhanced properties if present
      if (object.padding !== undefined) instance.padding = object.padding;
      if (object.borderRadius !== undefined) instance.borderRadius = object.borderRadius;
      if (object.textShadow !== undefined) instance.textShadow = object.textShadow;
      if (object.textOutline !== undefined) instance.textOutline = object.textOutline;
      if (object.textGradient !== undefined) instance.textGradient = object.textGradient;
      if (object.letterSpacing !== undefined) instance.letterSpacing = object.letterSpacing;
      if (object.textTransform !== undefined) instance.textTransform = object.textTransform;
      
      callback && callback(instance);
    });
  };

  // Update cache properties
  fabric.IText.prototype.cacheProperties = fabric.IText.prototype.cacheProperties.concat([
    'padding',
    'borderRadius',
    'textShadow',
    'textOutline',
    'textGradient',
    'letterSpacing',
    'textTransform'
  ]);
}

// Add TypeScript type definitions
declare global {
  namespace fabric {
    interface IText {
      padding: number;
      borderRadius: number;
      textShadow?: TextShadow;
      textOutline?: TextOutline;
      textGradient?: TextGradient;
      letterSpacing: number;
      textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
      
      refreshObject(): fabric.IText;
      getTransformedText(): string;
      createGradient(ctx: CanvasRenderingContext2D): CanvasGradient | null;
    }
  }
}

// Export fabric namespace with extended types
export type { fabric };
