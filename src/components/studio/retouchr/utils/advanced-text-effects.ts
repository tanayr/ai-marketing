"use client";

import { fabric } from './fabric-imports';

// Advanced text effect types
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

/**
 * Advanced text class with professional-grade effects
 */
export class AdvancedText extends fabric.IText {
  // Shadow properties
  textShadow?: TextShadow;
  
  // Outline properties  
  textOutline?: TextOutline;
  
  // Gradient properties
  textGradient?: TextGradient;
  
  // Letter spacing
  letterSpacing: number = 0;
  
  // Text transform
  textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize' = 'none';
  
  // Padding and border radius (inherited from EnhancedText concept)
  padding: number = 0;
  borderRadius: number = 0;

  static type = 'advanced-text';

  constructor(text: string, options: any = {}) {
    super(text, options);
    this.type = AdvancedText.type;
    
    // Initialize advanced properties
    this.textShadow = options.textShadow;
    this.textOutline = options.textOutline;
    this.textGradient = options.textGradient;
    this.letterSpacing = options.letterSpacing || 0;
    this.textTransform = options.textTransform || 'none';
    this.padding = options.padding || 0;
    this.borderRadius = options.borderRadius || 0;
  }

  /**
   * Override toObject for serialization
   */
  toObject(propertiesToInclude = []) {
    const obj = super.toObject(propertiesToInclude);
    return {
      ...obj,
      textShadow: this.textShadow,
      textOutline: this.textOutline,
      textGradient: this.textGradient,
      letterSpacing: this.letterSpacing,
      textTransform: this.textTransform,
      padding: this.padding,
      borderRadius: this.borderRadius,
      type: AdvancedText.type
    };
  }

  /**
   * Apply text transform to the text
   */
  getTransformedText(): string {
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
  }

  /**
   * Custom render method with advanced effects
   */
  _render(ctx: CanvasRenderingContext2D) {
    this._renderBackground(ctx);
    this._renderTextWithEffects(ctx);
  }

  /**
   * Render background with padding and border radius
   */
  _renderBackground(ctx: CanvasRenderingContext2D) {
    if (this.padding > 0 || this.borderRadius > 0) {
      ctx.save();

      const width = this.width + this.padding * 2;
      const height = this.height + this.padding * 2;
      const left = -this.width / 2 - this.padding;
      const top = -this.height / 2 - this.padding;

      if (this.backgroundColor && this.backgroundColor !== '' && this.backgroundColor !== 'transparent') {
        ctx.beginPath();
        
        if (this.borderRadius > 0) {
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
          ctx.rect(left, top, width, height);
        }

        ctx.fillStyle = this.backgroundColor;
        ctx.fill();
      }

      ctx.restore();
    }
  }

  /**
   * Render text with advanced effects
   */
  _renderTextWithEffects(ctx: CanvasRenderingContext2D) {
    ctx.save();

    // Apply letter spacing
    if (this.letterSpacing !== 0) {
      ctx.letterSpacing = `${this.letterSpacing}px`;
    }

    // Store original fill to restore later
    const originalFill = this.fill;

    // Apply gradient fill to the text object itself
    if (this.textGradient) {
      const gradient = this._createGradient(ctx);
      this.fill = gradient;
    }

    // Apply text shadow
    if (this.textShadow) {
      ctx.shadowOffsetX = this.textShadow.offsetX;
      ctx.shadowOffsetY = this.textShadow.offsetY;
      ctx.shadowBlur = this.textShadow.blur;
      ctx.shadowColor = this.textShadow.color;
    }

    // Apply text outline (stroke) - render outline first, then fill
    if (this.textOutline && this.textOutline.width > 0) {
      // Save current stroke settings
      const originalStroke = this.stroke;
      const originalStrokeWidth = this.strokeWidth;
      
      // Apply outline as stroke
      this.stroke = this.textOutline.color;
      this.strokeWidth = this.textOutline.width;
      
      // Render with stroke only first
      const tempFill = this.fill;
      this.fill = '';
      super._render(ctx);
      
      // Restore fill and remove stroke for fill rendering
      this.fill = tempFill;
      this.stroke = '';
      this.strokeWidth = 0;
      
      // Clear shadow for fill rendering to avoid double shadow
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
      
      // Render with fill only
      super._render(ctx);
      
      // Restore original stroke settings
      this.stroke = originalStroke;
      this.strokeWidth = originalStrokeWidth;
    } else {
      // Render normally if no outline
      super._render(ctx);
    }

    // Restore original fill
    this.fill = originalFill;

    ctx.restore();
  }

  /**
   * Create gradient for text
   */
  _createGradient(ctx: CanvasRenderingContext2D): CanvasGradient {
    let gradient: CanvasGradient;
    
    if (this.textGradient!.type === 'linear') {
      const angle = (this.textGradient!.angle || 0) * Math.PI / 180;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      
      gradient = ctx.createLinearGradient(
        -this.width / 2 * cos, -this.height / 2 * sin,
        this.width / 2 * cos, this.height / 2 * sin
      );
    } else {
      gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(this.width, this.height) / 2);
    }

    // Add color stops
    const colors = this.textGradient!.colors;
    colors.forEach((color, index) => {
      gradient.addColorStop(index / (colors.length - 1), color);
    });

    return gradient;
  }

  /**
   * Override text rendering to apply transforms
   */
  _renderText(ctx: CanvasRenderingContext2D) {
    // Store original text
    const originalText = this.text;
    
    // Apply text transform
    this.text = this.getTransformedText();
    
    // Call parent render
    super._renderText(ctx);
    
    // Restore original text
    this.text = originalText;
  }

  /**
   * Skip standard background rendering
   */
  _renderTextLinesBackground(ctx: CanvasRenderingContext2D) {
    if (this.padding > 0 || this.borderRadius > 0) {
      return; // Skip standard background as we handle it in _renderBackground
    }
    super._renderTextLinesBackground(ctx);
  }

  /**
   * Refresh method for property changes
   */
  _refreshObject() {
    this.dirty = true;
    this.setCoords();
    
    if (typeof this.setCacheAsDirty === 'function') {
      this.setCacheAsDirty();
    }
    
    if (this.canvas) {
      this.canvas.renderAll();
    }
    
    return this;
  }

  /**
   * Static method for creating from object
   */
  static fromObject(options: any, callback: Function) {
    return callback && callback(new AdvancedText(options.text, options));
  }
}

// Register with fabric
(fabric as any).AdvancedText = AdvancedText;

// Export advanced text effects utilities
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
