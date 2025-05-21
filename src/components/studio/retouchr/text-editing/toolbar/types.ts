"use client";

import { fabric } from '../../utils/fabric-imports';
import { FabricTextProperties } from '../../toolbar/text-tool-fabric-utils';

export interface TextToolbarProps {
  canvas: fabric.Canvas | null;
  textProperties: Partial<FabricTextProperties>;
  updateTextProperty: (property: string, value: any) => void;
}

export interface NumericControlProps extends TextToolbarProps {
  property: string;
  min: number;
  max: number;
  step: number;
  icon?: React.ReactNode;
  defaultValue: number;
  label?: string;
}
