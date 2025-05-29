import { TextShadow, TextOutline, TextGradient } from '../../utils/text-extensions';

/**
 * Base props shared by all QC components
 */
export interface QCBaseProps {
  onApplyEffect: (effectType: string, value: any) => void;
}

/**
 * Props for shadow effect component
 */
export interface QCShadowProps extends QCBaseProps {
  textShadow?: TextShadow;
}

/**
 * Props for outline effect component
 */
export interface QCOutlineProps extends QCBaseProps {
  textOutline?: TextOutline;
}

/**
 * Props for gradient effect component
 */
export interface QCGradientProps extends QCBaseProps {
  textGradient?: TextGradient;
}

/**
 * Default shadow presets
 */
export const SHADOW_PRESETS = [
  { name: 'Light Shadow', value: { offsetX: 2, offsetY: 2, blur: 3, color: 'rgba(0,0,0,0.3)' } },
  { name: 'Dark Drop Shadow', value: { offsetX: 3, offsetY: 3, blur: 5, color: 'rgba(0,0,0,0.6)' } },
  { name: 'Blue Glow', value: { offsetX: 0, offsetY: 0, blur: 8, color: 'rgba(0,100,255,0.7)' } },
  { name: 'Crisp Shadow', value: { offsetX: 2, offsetY: 2, blur: 0, color: 'rgba(0,0,0,0.5)' } },
];

/**
 * Default outline presets
 */
export const OUTLINE_PRESETS = [
  { name: 'Thin Black', value: { width: 1, color: '#000000' } },
  { name: 'Medium White', value: { width: 2, color: '#ffffff' } },
  { name: 'Bold Red', value: { width: 3, color: '#ff0000' } },
  { name: 'Subtle Gray', value: { width: 1, color: '#888888' } },
];

/**
 * Default gradient presets
 */
export const GRADIENT_PRESETS = [
  { 
    name: 'Sunset', 
    value: {
      type: 'linear' as const,
      angle: 90,
      colors: ['#ff4500', '#ff8c00', '#ffd700']
    }
  },
  { 
    name: 'Ocean', 
    value: {
      type: 'linear' as const,
      angle: 45,
      colors: ['#0077be', '#00a8e8', '#87ceeb']
    }
  },
  { 
    name: 'Rainbow', 
    value: {
      type: 'linear' as const,
      angle: 0,
      colors: ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#4b0082', '#8b00ff']
    }
  },
  { 
    name: 'Fire', 
    value: {
      type: 'linear' as const,
      angle: 135,
      colors: ['#ff0000', '#ff6a00', '#ffcc00']
    }
  },
];
