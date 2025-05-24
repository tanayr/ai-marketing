import { fabric, FabricIText } from '../utils/fabric-imports';
import { EnhancedText } from '../utils/enhanced-text'; // Import our custom text class

export interface FabricTextProperties {
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fill?: string;
  backgroundColor?: string;
  fontWeight?: 'normal' | 'bold' | string; // string for other potential values from presets
  fontStyle?: 'normal' | 'italic' | string; // string for other potential values from presets
  underline?: boolean;
  lineHeight?: number;
  charSpacing?: number; // This is the fabric.js property (often 10x UI letterSpacing)
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  padding?: number;
  borderRadius?: number; // Custom property, assuming it's handled
  // Fabric specific positioning for addTextToCanvas
  left?: number;
  top?: number;
  originX?: 'left' | 'center' | 'right';
  originY?: 'top' | 'center' | 'bottom';
}

/**
 * Updates properties of the currently active text object on the canvas.
 */
export const updateActiveTextObject = (
  canvas: fabric.Canvas | null,
  updates: Partial<FabricTextProperties>
): void => {
  if (!canvas) return;
  const activeObject = canvas.getActiveObject();

  if (activeObject && (activeObject.type === 'text' || activeObject.type === 'i-text' || activeObject.type === 'enhanced-text')) {
    // Cast to any to set potentially custom properties like borderRadius
    // or use activeObject.set(updates as any) if FabricIText is strict
    (activeObject as any).set(updates as any);
    canvas.renderAll();
  }
};

/**
 * Adds a new text object to the canvas.
 */
export const addTextToCanvas = (
  canvas: fabric.Canvas | null,
  text: string,
  properties: Omit<FabricTextProperties, 'text'> // text is a separate param
): FabricIText | undefined => {
  if (!canvas) return undefined;

  const canvasWidth = (canvas as any).width || 800;
  const canvasHeight = (canvas as any).height || 600;

  // Use our EnhancedText class instead of fabric.Text
  const textObject = new EnhancedText(text, {
    left: canvasWidth / 2,
    top: canvasHeight / 2,
    originX: 'center',
    originY: 'center',
    ...properties,
  });

  // Cast to fabric.Object for canvas methods to satisfy TypeScript
  canvas.add(textObject as unknown as fabric.Object);
  canvas.setActiveObject(textObject as unknown as fabric.Object);
  canvas.renderAll();
  
  // Return as FabricIText type for compatibility with existing code
  return textObject as unknown as FabricIText;
};

/**
 * Retrieves properties from the currently active text object.
 */
export const getActiveTextObjectProperties = (
  canvas: fabric.Canvas | null
): (FabricTextProperties & { text: string }) | null => {
  if (!canvas) return null;
  const activeObject = canvas.getActiveObject();

  if (activeObject && (activeObject.type === 'text' || activeObject.type === 'i-text' || activeObject.type === 'enhanced-text')) {
    const textObj = activeObject as any; // Cast to any to access all text properties
    return {
      text: textObj.text || '',
      fontFamily: textObj.fontFamily,
      fontSize: textObj.fontSize,
      fill: textObj.fill as string, // Assuming fill is always string
      backgroundColor: textObj.backgroundColor || undefined,
      fontWeight: textObj.fontWeight,
      fontStyle: textObj.fontStyle,
      underline: textObj.underline || false,
      lineHeight: textObj.lineHeight,
      charSpacing: textObj.charSpacing, // This is the Fabric.js value
      textAlign: textObj.textAlign as 'left' | 'center' | 'right' | 'justify',
      padding: textObj.padding, // Cast if padding is not a standard IText property
      borderRadius: textObj.borderRadius, // Cast for custom property
    };
  }
  return null;
};