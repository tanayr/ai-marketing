"use client";

import React from 'react';
import { QCShadow } from './QC-Shadow';
import { QCOutline } from './QC-Outline';
import { QCGradient } from './QC-Gradient';
import { TextShadow, TextOutline, TextGradient } from '../../utils/text-extensions';
import { TextToolbarProps } from './types';

/**
 * Combined effects controls component
 * Assembles all individual effect components (shadow, outline, gradient)
 */
export const QCEffectsControls: React.FC<TextToolbarProps & {
  textShadow?: TextShadow;
  textOutline?: TextOutline;
  textGradient?: TextGradient;
  onApplyEffect: (effectType: string, value: any) => void;
}> = (props) => {
  return (
    <div className="flex items-center gap-1">
      <QCShadow 
        textShadow={props.textShadow}
        onApplyEffect={props.onApplyEffect}
      />
      <QCOutline
        textOutline={props.textOutline}
        onApplyEffect={props.onApplyEffect}
      />
      <QCGradient
        textGradient={props.textGradient}
        onApplyEffect={props.onApplyEffect}
      />
    </div>
  );
};
