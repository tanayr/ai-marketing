"use client";

import React, { useState } from 'react';
import { useCanvas } from '../hooks/use-canvas';
import { fabric, FabricIText } from '../utils/fabric-imports';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ColorPicker } from '../utils/color-picker';

// Font options
const FONT_OPTIONS = [
  { value: 'Arial', label: 'Arial' },
  { value: 'Helvetica', label: 'Helvetica' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Courier New', label: 'Courier New' },
  { value: 'Verdana', label: 'Verdana' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
];

export const TextTool: React.FC = () => {
  const { canvas, selectedObjects } = useCanvas();
  const [textValue, setTextValue] = useState('Add your text');
  
  // Text properties for new text
  const [fontFamily, setFontFamily] = useState('Arial');
  const [fontSize, setFontSize] = useState(24);
  const [textColor, setTextColor] = useState('#000000');
  const [backgroundColor, setBackgroundColor] = useState('');
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [underline, setUnderline] = useState(false);
  
  // Update selected text
  const updateSelectedText = (property: string, value: any) => {
    if (!canvas || selectedObjects.length === 0) return;
    
    const activeObject = canvas.getActiveObject();
    if (activeObject && activeObject.type === 'text') {
      // Cast to any to bypass TypeScript errors with fabric.js types
      const textObject = activeObject as any;
      textObject.set(property, value);
      canvas.renderAll();
    }
  };
  
  // Add new text to canvas
  const addText = () => {
    if (!canvas) return;
    
    // Get canvas dimensions from the canvas object
    const canvasWidth = (canvas as any).width || 800;
    const canvasHeight = (canvas as any).height || 600;
    
    const text = new fabric.Text(textValue, {
      left: canvasWidth / 2,
      top: canvasHeight / 2,
      originX: 'center',
      originY: 'center',
      fontFamily,
      fontSize,
      fill: textColor,
      backgroundColor: backgroundColor || undefined,
      fontWeight: bold ? 'bold' : 'normal',
      fontStyle: italic ? 'italic' : 'normal',
      underline: underline,
    });
    
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
  };
  
  // Get current text value from selected object
  const getCurrentTextValue = () => {
    if (!canvas || selectedObjects.length === 0) return textValue;
    
    const activeObject = canvas.getActiveObject();
    if (activeObject && activeObject.type === 'text') {
      return (activeObject as any).text;
    }
    
    return textValue;
  };
  
  // Get current text properties from selected object
  const updateTextPropertiesFromSelection = () => {
    if (!canvas || selectedObjects.length === 0) return;
    
    const activeObject = canvas.getActiveObject();
    if (activeObject && activeObject.type === 'text') {
      const textObj = activeObject as any;
      setTextValue(textObj.text);
      setFontFamily(textObj.fontFamily);
      setFontSize(textObj.fontSize);
      setTextColor(textObj.fill);
      setBackgroundColor(textObj.backgroundColor || '');
      setBold(textObj.fontWeight === 'bold');
      setItalic(textObj.fontStyle === 'italic');
      setUnderline(textObj.underline || false);
    }
  };
  
  return (
    <div className="space-y-3 p-3">
      
      {/* Text input */}
      <div className="space-y-1">
        <Label htmlFor="text-input" className="text-xs">Text</Label>
        <Input
          id="text-input"
          className="h-8 text-xs"
          value={getCurrentTextValue()}
          onChange={(e) => {
            setTextValue(e.target.value);
            if (selectedObjects.length > 0) {
              updateSelectedText('text', e.target.value);
            }
          }}
        />
      </div>
      
      {/* Font family */}
      <div className="space-y-1">
        <Label htmlFor="font-family" className="text-xs">Font</Label>
        <Select
          value={fontFamily}
          onValueChange={(value) => {
            setFontFamily(value);
            updateSelectedText('fontFamily', value);
          }}
        >
          <SelectTrigger id="font-family" className="h-8 text-xs">
            <SelectValue placeholder="Select font" />
          </SelectTrigger>
          <SelectContent>
            {FONT_OPTIONS.map((font) => (
              <SelectItem key={font.value} value={font.value}>
                {font.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Font size */}
      <div className="space-y-1">
        <div className="flex justify-between">
          <Label htmlFor="font-size" className="text-xs">Size</Label>
          <span className="text-xs text-muted-foreground">{fontSize}px</span>
        </div>
        <Slider
          id="font-size"
          min={8}
          max={72}
          step={1}
          value={[fontSize]}
          onValueChange={(values) => {
            setFontSize(values[0]);
            updateSelectedText('fontSize', values[0]);
          }}
        />
      </div>
      
      {/* Text color */}
      <div className="space-y-1">
        <Label className="text-xs">Text Color</Label>
        <ColorPicker
          color={textColor}
          onChange={(color) => {
            setTextColor(color);
            updateSelectedText('fill', color);
          }}
        />
      </div>
      
      {/* Background color */}
      <div className="space-y-1">
        <Label className="text-xs">Background Color</Label>
        <div className="flex items-center gap-2">
          <ColorPicker
            color={backgroundColor}
            onChange={(color) => {
              setBackgroundColor(color);
              updateSelectedText('backgroundColor', color || undefined);
            }}
            allowTransparent
          />
          {backgroundColor && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setBackgroundColor('');
                updateSelectedText('backgroundColor', undefined);
              }}
            >
              Clear
            </Button>
          )}
        </div>
      </div>
      
      {/* Text style controls */}
      <div className="space-y-1">
        <Label className="text-xs">Text Style</Label>
        <div className="flex space-x-1">
          <Button 
            variant={bold ? "default" : "outline"} 
            size="sm" 
            className="h-8 w-8 p-0 font-bold" 
            onClick={() => {
              const newValue = !bold;
              setBold(newValue);
              updateSelectedText('fontWeight', newValue ? 'bold' : 'normal');
            }}
          >
            B
          </Button>
          <Button 
            variant={italic ? "default" : "outline"} 
            size="sm" 
            className="h-8 w-8 p-0 italic" 
            onClick={() => {
              const newValue = !italic;
              setItalic(newValue);
              updateSelectedText('fontStyle', newValue ? 'italic' : 'normal');
            }}
          >
            I
          </Button>
          <Button 
            variant={underline ? "default" : "outline"} 
            size="sm" 
            className="h-8 w-8 p-0 underline" 
            onClick={() => {
              const newValue = !underline;
              setUnderline(newValue);
              updateSelectedText('underline', newValue);
            }}
          >
            U
          </Button>
        </div>
      </div>
      
      {/* Add text button */}
      <Button onClick={addText} size="sm" className="w-full h-8 mt-2">
        Add Text
      </Button>
    </div>
  );
};
